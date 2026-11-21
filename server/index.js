// Vantage backend: zero-dependency (Node 22+).
// Money model: the SERVER LEDGER (integer cents) is the only withdrawable balance.
// It changes only through: admin credit, admin-approved deposit, withdrawal (reserved at request time).
// Terminal trading P&L is simulated and self-reported: stored for review, never withdrawable.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(crypto.scrypt);
const __dir = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dir, '..', 'dist');
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
const MAX_BODY = 100 * 1024;
const MAX_CENTS = 100_000_000_00; // $100M hard ceiling per operation
// SANDBOX_MODE (default on): dummy bank details, and deposits/withdrawals move pending -> processing -> completed on their own
// so every feature can be tested end to end. Set SANDBOX_MODE=false for real operation (admin confirms every movement).
const SANDBOX = process.env.SANDBOX_MODE !== 'false';
const DELAY = Math.max(5, Number(process.env.SANDBOX_DELAY_SEC) || 40) * 1000;
const TEST_BANK = { beneficiary: 'Vantage Capital Asset Management LLC (TEST)', bankName: 'Vantage Test Bank (Sandbox)', routing: '110000000', accountType: 'Checking', address: '1 Test Street, New York, NY 10001' };

if (IS_PROD && !process.env.ADMIN_PASSWORD) {
  console.warn('Set ADMIN_PASSWORD before running in production. Using fallback credentials.');
}

let DB_PATH = process.env.DB_PATH || path.join(__dir, '..', 'data', 'vantage.db');
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch (err) {
  console.warn('Failed to create DB directory at ' + DB_PATH + ', falling back to ./data/vantage.db', err);
  DB_PATH = path.join(__dir, '..', 'data', 'vantage.db');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, country TEXT, currency TEXT,
  acct_type TEXT, account_no TEXT, salt TEXT, hash TEXT, role TEXT DEFAULT 'user', balance REAL DEFAULT 0, created_at INTEGER);
CREATE TABLE IF NOT EXISTS tx(id INTEGER PRIMARY KEY, user_id INTEGER, kind TEXT, amount REAL, status TEXT, note TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS trades(id INTEGER PRIMARY KEY, user_id INTEGER, client_id TEXT, symbol TEXT, direction TEXT, lots REAL,
  open_price REAL, close_price REAL, pnl REAL, pips REAL, tag TEXT, reason TEXT, open_time INTEGER, close_time INTEGER, UNIQUE(user_id, client_id));
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);`);

// ---- one-time migration to integer-cent ledger ----
const hasCol = (t, c) => db.prepare(`PRAGMA table_info(${t})`).all().some(r => r.name === c);
if (!hasCol('users', 'balance_cents')) {
  db.exec('ALTER TABLE users ADD COLUMN balance_cents INTEGER NOT NULL DEFAULT 0');
  db.exec('UPDATE users SET balance_cents = CAST(ROUND(balance * 100) AS INTEGER)');
  if (db.prepare('SELECT 1 FROM users WHERE balance > 0').get()) console.warn('MIGRATION: old balances copied to ledger cents. Old balances included client-synced P&L - review before honoring withdrawals.');
}
if (!hasCol('tx', 'amount_cents')) {
  db.exec('ALTER TABLE tx ADD COLUMN amount_cents INTEGER');
  db.exec('UPDATE tx SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER)');
}
if (!hasCol('tx', 'detail')) db.exec('ALTER TABLE tx ADD COLUMN detail TEXT');
if (!hasCol('tx', 'decided_by')) db.exec('ALTER TABLE tx ADD COLUMN decided_by INTEGER');
if (!hasCol('tx', 'ref')) db.exec('ALTER TABLE tx ADD COLUMN ref TEXT');
if (!hasCol('tx', 'process_at')) db.exec('ALTER TABLE tx ADD COLUMN process_at INTEGER');
if (!hasCol('tx', 'settle_at')) db.exec('ALTER TABLE tx ADD COLUMN settle_at INTEGER');
if (!hasCol('users', 'deposit_acct')) db.exec('ALTER TABLE users ADD COLUMN deposit_acct TEXT');
db.exec('CREATE INDEX IF NOT EXISTS tx_user ON tx(user_id, id)');

// ---- secrets ----
let secret = process.env.SESSION_SECRET || db.prepare("SELECT v FROM meta WHERE k='secret'").get()?.v;
if (!secret) { secret = crypto.randomBytes(32).toString('hex'); db.prepare("INSERT INTO meta VALUES('secret',?)").run(secret); }

const hashPw = async (pw, salt) => (await scrypt(pw, salt, 64)).toString('hex');
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const sign = p => { const b = Buffer.from(JSON.stringify(p)).toString('base64url'); return b + '.' + crypto.createHmac('sha256', secret).update(b).digest('base64url'); };
const verify = t => {
  try {
    const [b, s] = String(t || '').split('.');
    if (!b || !s || !safeEq(crypto.createHmac('sha256', secret).update(b).digest('base64url'), s)) return null;
    const p = JSON.parse(Buffer.from(b, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
};
const accountNo = () => 'VC' + crypto.randomInt(10000000, 99999999);
const depositAcct = u => {
  if (u.deposit_acct) return u.deposit_acct;
  for (let i = 0; i < 10; i++) {
    const a = String(crypto.randomInt(10 ** 11, 10 ** 12)); // 12-digit dummy US account number
    try { db.prepare('UPDATE users SET deposit_acct=? WHERE id=? AND deposit_acct IS NULL').run(a, u.id); return db.prepare('SELECT deposit_acct FROM users WHERE id=?').get(u.id).deposit_acct; } catch { /* retry */ }
  }
  throw new Error('Could not allocate deposit account');
};
const refNo = p => `${p}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const dollars = c => c / 100;
// Bank account numbers are encrypted at rest (AES-256-GCM) and only ever decrypted for admins paying out.
const encKey = crypto.createHash('sha256').update('acct|' + (process.env.ACCOUNT_KEY || secret)).digest();
const enc = txt => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', encKey, iv); const ct = Buffer.concat([c.update(txt, 'utf8'), c.final()]); return [iv, c.getAuthTag(), ct].map(b => b.toString('base64')).join('.'); };
const dec = v => { try { const [iv, tag, ct] = v.split('.').map(x => Buffer.from(x, 'base64')); const d = crypto.createDecipheriv('aes-256-gcm', encKey, iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct), d.final()]).toString('utf8'); } catch { return ''; } };
const toCents = v => { const n = Number(v); if (!Number.isFinite(n) || n <= 0) return null; const c = Math.round(n * 100); return c > 0 && c <= MAX_CENTS ? c : null; };
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const validAba = r => /^\d{9}$/.test(r) && (3 * (+r[0] + +r[3] + +r[6]) + 7 * (+r[1] + +r[4] + +r[7]) + (+r[2] + +r[5] + +r[8])) % 10 === 0;

async function createUser({ email, name, country, currency, acct_type, password, role = 'user' }) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashPw(password, salt);
  for (let i = 0; i < 5; i++) {
    try {
      db.prepare('INSERT INTO users(email,name,country,currency,acct_type,account_no,salt,hash,role,balance,balance_cents,created_at) VALUES(?,?,?,?,?,?,?,?,?,0,0,?)')
        .run(email, name, country, currency, acct_type, accountNo(), salt, hash, role, Date.now());
      return;
    } catch (e) { if (!/account_no|UNIQUE/.test(String(e.message)) || /email/.test(String(e.message))) throw e; }
  }
  throw new Error('Could not allocate account number');
}

// ---- admin & seed users bootstrap ----
const defaultAdminPw = process.env.ADMIN_PASSWORD || 'VantageAdmin2026!';
const adminEmails = [
  (process.env.ADMIN_EMAIL || 'admin@vantagecapital.com').toLowerCase(),
  'admin@vantage.local',
  'admin@vantagecapital.demo'
];
for (const em of adminEmails) {
  if (!db.prepare('SELECT 1 FROM users WHERE email=?').get(em)) {
    try {
      await createUser({ email: em, name: 'Administrator', country: 'United States', currency: 'USD', acct_type: 'ADMIN', password: defaultAdminPw, role: 'admin' });
      console.log(`Admin created: ${em}`);
    } catch {}
  }
}

// Seed demo client accounts if missing
const demoClients = [
  { email: 'alex.vance@vantagecapital.demo', name: 'Alex Vance', country: 'United States', currency: 'USD', acct_type: 'STANDARD_STP', password: 'DemoPassword123!', initialCents: 5000000 },
  { email: 'elena.rostova@vantagecapital.demo', name: 'Elena Rostova', country: 'United Kingdom', currency: 'USD', acct_type: 'ECN_RAW', password: 'DemoPassword123!', initialCents: 2500000 }
];
for (const client of demoClients) {
  if (!db.prepare('SELECT 1 FROM users WHERE email=?').get(client.email)) {
    try {
      await createUser({ email: client.email, name: client.name, country: client.country, currency: client.currency, acct_type: client.acct_type, password: client.password, role: 'user' });
      if (client.initialCents > 0) {
        const u = db.prepare('SELECT id FROM users WHERE email=?').get(client.email);
        db.prepare('UPDATE users SET balance_cents=? WHERE id=?').run(client.initialCents, u.id);
        db.prepare("INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,ref,created_at) VALUES(?,?,?,?,?,?,?,?)")
          .run(u.id, 'deposit', dollars(client.initialCents), client.initialCents, 'completed', 'Initial Capital Allocation', refNo('INIT'), Date.now() - 864e5);
      }
      console.log(`Demo client created: ${client.email}`);
    } catch (e) {
      console.error('Error creating demo client:', e.message);
    }
  }
}

// ---- backups (consistent snapshot, last 7) ----
const backup = () => {
  try {
    const dir = path.join(path.dirname(DB_PATH), 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, `vantage-${new Date().toISOString().slice(0, 10)}.db`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
    db.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`);
    fs.readdirSync(dir).filter(n => n.endsWith('.db')).sort().slice(0, -7).forEach(n => fs.unlinkSync(path.join(dir, n)));
  } catch (e) { console.error('Backup failed', e.message); }
};
backup(); setInterval(backup, 864e5).unref();

// ---- throttling ----
const buckets = new Map();
const hit = (key, limit, windowMs) => {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= limit) { buckets.set(key, arr); return false; }
  arr.push(now); buckets.set(key, arr); return true;
};
setInterval(() => { const now = Date.now(); for (const [k, v] of buckets) if (!v.some(t => now - t < 9e5)) buckets.delete(k); }, 6e5).unref();
const clientIp = req => {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const list = String(xff).split(',').map(s => s.trim()).filter(Boolean);
    if (list.length > 0) return list[0];
  }
  return req.headers['x-real-ip'] || req.socket.remoteAddress || '127.0.0.1';
};

// ---- sandbox settlement: pending -> processing -> completed (idempotent; credits a deposit exactly once) ----
function settleDue() {
  if (!SANDBOX) return;
  const now = Date.now();
  const due = db.prepare("SELECT id FROM tx WHERE status IN ('pending','processing') AND settle_at IS NOT NULL AND (process_at<=? OR settle_at<=?)").all(now, now);
  for (const { id } of due) {
    try {
      tx(() => {
        const t = db.prepare("SELECT * FROM tx WHERE id=? AND status IN ('pending','processing')").get(id);
        if (!t) return;
        if (now >= t.settle_at) {
          const r = db.prepare("UPDATE tx SET status='completed' WHERE id=? AND status IN ('pending','processing')").run(id);
          if (r.changes === 1 && t.kind === 'deposit') db.prepare('UPDATE users SET balance_cents=balance_cents+? WHERE id=?').run(t.amount_cents, t.user_id);
        } else if (t.status === 'pending' && now >= t.process_at) {
          db.prepare("UPDATE tx SET status='processing' WHERE id=? AND status='pending'").run(id);
        }
      });
    } catch (e) { console.error('settle failed', e.message); }
  }
}

// ---- helpers ----
const pub = u => ({ id: u.id, email: u.email, name: u.name, country: u.country, currency: u.currency, accountType: u.acct_type, accountId: u.account_no, role: u.role, balance: dollars(u.balance_cents), joinedDate: u.created_at });
const txOut = (t, admin = false) => {
  let detail = t.detail ? JSON.parse(t.detail) : undefined;
  if (detail) { const { accountEnc, ...rest } = detail; detail = admin && accountEnc ? { ...rest, accountNumber: dec(accountEnc) } : rest; }
  return { id: t.id, user_id: t.user_id, kind: t.kind, amount: dollars(t.amount_cents), status: t.status, note: t.note, ref: t.ref, created_at: t.created_at, name: t.name, account_no: t.account_no, detail };
};
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const SEC = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
const send = (res, code, obj) => { res.writeHead(code, { ...SEC, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise((resolve, reject) => {
  let d = '', n = 0;
  req.on('data', c => { n += c.length; if (n > MAX_BODY) { reject(new HttpError(413, 'Request too large.')); req.destroy(); } else d += c; });
  req.on('end', () => { try { const j = JSON.parse(d || '{}'); resolve(j && typeof j === 'object' && !Array.isArray(j) ? j : {}); } catch { reject(new HttpError(400, 'Invalid JSON.')); } });
  req.on('error', reject);
});
const tx = fn => { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

// ---- static files ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };
let csp = null;
const buildCsp = () => {
  let hashes = '';
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => ` 'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`).join('');
  } catch { /* not built yet */ }
  return `default-src 'self'; script-src 'self'${hashes}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;
};
function serveStatic(req, res, p) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
  let rel; try { rel = decodeURIComponent(p); } catch { return send(res, 400, { error: 'Bad request.' }); }
  let f = path.resolve(DIST, '.' + path.sep + (rel === '/' ? 'index.html' : rel));
  const inside = f === DIST || f.startsWith(DIST + path.sep);
  if (!inside || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  if (!fs.existsSync(f)) return send(res, 404, { error: 'Not built' });
  const isHtml = f.endsWith('index.html');
  csp ||= buildCsp();
  res.writeHead(200, { ...SEC, 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
    'Cache-Control': isHtml ? 'no-cache' : (rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'),
    ...(isHtml ? { 'Content-Security-Policy': csp } : {}) });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(f).pipe(res);
}

// ---- API ----
async function api(req, res, p) {
  const POST = req.method === 'POST';
  const b = POST ? await readBody(req) : {};
  const ip = clientIp(req);

  if (p === '/api/signup' || p === '/api/register') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    if (!hit('signup|' + ip, 60, 36e5)) throw new HttpError(429, 'Too many sign-up attempts. Try later.');
    const email = str(b.email, 254).toLowerCase(), name = str(b.name, 100), password = typeof b.password === 'string' ? b.password : '';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name || password.length < 8 || password.length > 200) throw new HttpError(400, 'Check your name, email and password (8+ characters).');
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) throw new HttpError(409, 'An account with this email already exists.');
    const currency = ['USD', 'EUR', 'GBP'].includes(b.currency) ? b.currency : 'USD';
    const acct_type = ['ECN_RAW', 'STANDARD_STP'].includes(b.accountType) ? b.accountType : 'STANDARD_STP';
    await createUser({ email, name, country: str(b.country, 60), currency, acct_type, password, role: 'user' }); // role is NEVER taken from the request
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    return send(res, 200, { token: sign({ uid: u.id, exp: Date.now() + 7 * 864e5 }), user: pub(u) });
  }
  if (p === '/api/login') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    const email = str(b.email, 254).toLowerCase(), key = 'login|' + email + '|' + ip;
    if (!hit('loginip|' + ip, 120, 9e5) || (buckets.get(key) || []).filter(t => Date.now() - t < 9e5).length >= 15) throw new HttpError(429, 'Too many failed login attempts. Try again in 15 minutes.');
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const ok = u ? safeEq(await hashPw(typeof b.password === 'string' ? b.password : '', u.salt), u.hash) : (await hashPw('x', 'y'), false);
    if (!ok) { hit(key, 99, 9e5); throw new HttpError(401, 'Incorrect email or password.'); }
    buckets.delete(key);
    return send(res, 200, { token: sign({ uid: u.id, exp: Date.now() + 7 * 864e5 }), user: pub(u) });
  }

  if (p === '/api/config') return send(res, 200, { sandbox: SANDBOX });
  const auth = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
  const me = auth && db.prepare('SELECT * FROM users WHERE id=?').get(auth.uid);
  if (!me) throw new HttpError(401, 'Please sign in again.');

  if (p === '/api/me') return send(res, 200, { user: pub(me) });

  if (p === '/api/change-password') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    if (!hit('pw|' + me.id, 5, 9e5)) throw new HttpError(429, 'Too many attempts. Try again later.');
    const cur = typeof b.currentPassword === 'string' ? b.currentPassword : '', next = typeof b.newPassword === 'string' ? b.newPassword : '';
    if (next.length < 8 || next.length > 200) throw new HttpError(400, 'New password must be at least 8 characters.');
    if (!safeEq(await hashPw(cur, me.salt), me.hash)) throw new HttpError(401, 'Current password is incorrect.');
    const salt = crypto.randomBytes(16).toString('hex');
    db.prepare('UPDATE users SET salt=?, hash=? WHERE id=?').run(salt, await hashPw(next, salt), me.id);
    return send(res, 200, { ok: true });
  }

  if (p === '/api/deposit-info') {
    return send(res, 200, { sandbox: SANDBOX, beneficiary: TEST_BANK.beneficiary, bankName: TEST_BANK.bankName, routingNumber: TEST_BANK.routing,
      accountNumber: depositAcct(me), accountType: TEST_BANK.accountType, bankAddress: TEST_BANK.address, reference: me.account_no, processingSeconds: Math.round(DELAY / 1000) });
  }

  if (p === '/api/transactions') {
    const rows = db.prepare('SELECT * FROM tx WHERE user_id=? ORDER BY id DESC LIMIT 100').all(me.id);
    return send(res, 200, { tx: rows.map(txOut) });
  }

  if (p === '/api/deposit-notice') { // "I have sent the transfer". Credited only when the transfer completes (auto in sandbox, admin-confirmed otherwise).
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    if (!hit('dep|' + me.id, 10, 36e5)) throw new HttpError(429, 'Too many deposit notices. Try later.');
    const c = toCents(b.amount); if (!c) throw new HttpError(400, 'Enter a valid amount.');
    if (SANDBOX && c > 1_000_000_00) throw new HttpError(400, 'Test deposits are limited to $1,000,000.');
    const detail = { originatorName: me.name, originatingBankName: str(b.senderBankName, 120), wireMemo: str(b.memo, 140), accountNumber: depositAcct(me) };
    const ref = refNo('DEP'), now = Date.now();
    db.prepare("INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,detail,ref,process_at,settle_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
      .run(me.id, 'deposit', dollars(c), c, 'pending', SANDBOX ? 'Bank transfer (test)' : 'Bank transfer (awaiting confirmation)', JSON.stringify(detail), ref, SANDBOX ? now + DELAY / 4 : null, SANDBOX ? now + DELAY : null, now);
    return send(res, 200, { ok: true, referenceId: ref });
  }

  if (p === '/api/withdraw') { // reserves funds atomically; admin approves (paid out) or rejects (refund)
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    if (!hit('wd|' + me.id, 10, 36e5)) throw new HttpError(429, 'Too many withdrawal requests. Try later.');
    const c = toCents(b.amount);
    if (!c || c < 10000) throw new HttpError(400, 'Minimum withdrawal is $100.00.');
    const routing = String(b.routingNumber || '').replace(/\D/g, ''), acct = String(b.accountNumber || '').replace(/\D/g, '');
    if (!validAba(routing)) throw new HttpError(400, 'Routing number is not a valid ABA number.');
    if (acct.length < 4 || acct.length > 17) throw new HttpError(400, 'Bank account number must be 4-17 digits.');
    const beneficiary = str(b.beneficiaryName, 120), bank = str(b.bankName, 120);
    if (!beneficiary || !bank) throw new HttpError(400, 'Beneficiary name and bank name are required.');
    const detail = { beneficiaryName: beneficiary, bankName: bank, routingNumber: routing, accountLast4: acct.slice(-4), accountEnc: enc(acct), accountType: b.accountType === 'SAVINGS' ? 'SAVINGS' : 'CHECKING', beneficiaryAddress: str(b.beneficiaryAddress, 200) };
    const ref = refNo('TRANSFER');
    const out = tx(() => {
      const u = db.prepare('SELECT balance_cents FROM users WHERE id=?').get(me.id);
      if (u.balance_cents < c) throw new HttpError(400, `Insufficient settled funds. Withdrawable: $${dollars(u.balance_cents).toFixed(2)}.`);
      db.prepare('UPDATE users SET balance_cents=balance_cents-? WHERE id=?').run(c, me.id);
      const now = Date.now();
      db.prepare("INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,detail,ref,process_at,settle_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(me.id, 'withdrawal', dollars(c), c, 'pending', str(b.wireMemo, 140) || 'Capital payout', JSON.stringify(detail), ref, SANDBOX ? now + DELAY / 2 : null, SANDBOX ? now + DELAY * 2 : null, now);
      return db.prepare('SELECT balance_cents FROM users WHERE id=?').get(me.id).balance_cents;
    });
    return send(res, 200, { ok: true, referenceId: ref, balance: dollars(out) });
  }

  if (p === '/api/trades') { // simulated, self-reported: stored for strategy review only. Never affects the ledger.
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    const ins = db.prepare('INSERT OR IGNORE INTO trades(user_id,client_id,symbol,direction,lots,open_price,close_price,pnl,pips,tag,reason,open_time,close_time) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
    let stored = 0;
    tx(() => {
      for (const t of (Array.isArray(b.trades) ? b.trades : []).slice(0, 200)) {
        if (!t || typeof t !== 'object') continue;
        const pnl = Math.max(-1e9, Math.min(1e9, num(t.pnl)));
        ins.run(me.id, str(String(t.id), 80), str(t.symbol, 20), t.direction === 'SELL' ? 'SELL' : 'BUY', num(t.lots), num(t.openPrice), num(t.closePrice), pnl, num(t.pnlPips), str(t.strategyTag, 60) || 'Untagged', str(t.closeReason, 120), Math.trunc(num(t.openTime)), Math.trunc(num(t.closeTime)));
        stored++;
      }
    });
    return send(res, 200, { ok: true, stored });
  }

  if (!p.startsWith('/api/admin/') || me.role !== 'admin') throw new HttpError(403, 'Not allowed.');

  if (p === '/api/admin/users') {
    return send(res, 200, {
      users: db.prepare("SELECT id,name,email,account_no,currency,balance_cents,role,created_at FROM users ORDER BY id DESC").all().map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        account_no: u.account_no,
        currency: u.currency,
        balance: dollars(u.balance_cents),
        role: u.role,
        created_at: u.created_at
      }))
    });
  }
  if (p === '/api/admin/user-tx') { // one client's full ledger history (admin view)
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    const uid = Number(b.id);
    const u = db.prepare("SELECT id,name,email,account_no,currency,balance_cents,country,role,created_at FROM users WHERE id=?").get(uid);
    if (!u) throw new HttpError(404, 'User not found.');
    const rows = db.prepare('SELECT tx.*, users.name, users.account_no FROM tx JOIN users ON users.id=tx.user_id WHERE tx.user_id=? ORDER BY tx.id DESC LIMIT 100').all(uid);
    return send(res, 200, { user: { id: u.id, name: u.name, email: u.email, account_no: u.account_no, currency: u.currency, country: u.country, role: u.role, balance: dollars(u.balance_cents), created_at: u.created_at }, tx: rows.map(t => txOut(t, true)) });
  }
  if (p === '/api/admin/transactions') return send(res, 200, { tx: db.prepare('SELECT tx.*, users.name, users.account_no FROM tx JOIN users ON users.id=tx.user_id ORDER BY tx.id DESC LIMIT 200').all().map(t => txOut(t, true)) });
  if (p === '/api/admin/report') {
    const rows = db.prepare('SELECT trades.tag, trades.pnl, users.name FROM trades JOIN users ON users.id=trades.user_id').all();
    const agg = key => {
      const m = {};
      for (const t of rows) { const k = key(t); const a = (m[k] ||= { name: k, trades: 0, wins: 0, gain: 0, loss: 0 }); a.trades++; if (t.pnl > 0) { a.wins++; a.gain += t.pnl; } else a.loss += -t.pnl; }
      return Object.values(m).map(a => ({ name: a.name, trades: a.trades, winRate: Math.round(10000 * a.wins / a.trades) / 100, pnl: Math.round((a.gain - a.loss) * 100) / 100, profitFactor: a.loss ? Math.round(100 * a.gain / a.loss) / 100 : null })).sort((x, y) => y.pnl - x.pnl);
    };
    return send(res, 200, { byStrategy: agg(t => t.tag), byUser: agg(t => t.name), totalTrades: rows.length, note: 'Simulated, self-reported results. Unverified.' });
  }

  if (!POST) throw new HttpError(405, 'Method not allowed.');

  if (p === '/api/admin/credit') {
    const c = toCents(b.amount), uid = Number(b.userId);
    if (!c || !Number.isInteger(uid)) throw new HttpError(400, 'Pick a user and enter an amount above zero.');
    tx(() => {
      const u = db.prepare("SELECT id FROM users WHERE id=?").get(uid);
      if (!u) throw new HttpError(404, 'User not found.');
      db.prepare('UPDATE users SET balance_cents=balance_cents+? WHERE id=?').run(c, uid);
      db.prepare("INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,ref,decided_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)").run(uid, 'deposit', dollars(c), c, 'completed', str(b.note, 140) || 'Admin credit', refNo('ADM'), me.id, Date.now());
    });
    return send(res, 200, { ok: true });
  }

  if (p === '/api/admin/set-balance') {
    const n = Number(b.amount);
    if (!Number.isFinite(n) || n < 0) throw new HttpError(400, 'Enter a valid balance (0 or greater).');
    const targetCents = Math.round(n * 100);
    const uid = Number(b.userId);
    if (!Number.isInteger(uid)) throw new HttpError(400, 'Invalid user ID.');
    tx(() => {
      const u = db.prepare("SELECT id, balance_cents FROM users WHERE id=?").get(uid);
      if (!u) throw new HttpError(404, 'User not found.');
      const diff = targetCents - u.balance_cents;
      db.prepare('UPDATE users SET balance_cents=? WHERE id=?').run(targetCents, uid);
      db.prepare("INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,ref,decided_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)").run(
        uid,
        diff >= 0 ? 'deposit' : 'adjustment',
        dollars(Math.abs(diff)),
        Math.abs(diff),
        'completed',
        str(b.note, 140) || `Capital allocation balance set to $${dollars(targetCents).toFixed(2)}`,
        refNo('SET'),
        me.id,
        Date.now()
      );
    });
    return send(res, 200, { ok: true, newBalance: dollars(targetCents) });
  }

  if (p === '/api/admin/debit') { // reduce an account balance; never below zero; always leaves an auditable ledger entry
    const c = toCents(b.amount), uid = Number(b.userId), note = str(b.note, 140) || 'Capital reduction';
    if (!c || !Number.isInteger(uid)) throw new HttpError(400, 'Pick a user and enter an amount above zero.');
    tx(() => {
      const u = db.prepare("SELECT balance_cents FROM users WHERE id=?").get(uid);
      if (!u) throw new HttpError(404, 'User not found.');
      if (u.balance_cents < c) throw new HttpError(400, `Balance is only $${dollars(u.balance_cents).toFixed(2)}. Cannot deduct more than available balance.`);
      db.prepare('UPDATE users SET balance_cents=balance_cents-? WHERE id=?').run(c, uid);
      db.prepare("INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,ref,decided_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)").run(uid, 'adjustment', dollars(c), c, 'completed', note, refNo('DBT'), me.id, Date.now());
    });
    return send(res, 200, { ok: true });
  }

  if (p === '/api/admin/reset-password') { // support tool: sets a one-time temporary password the admin passes on to the client
    const uid = Number(b.userId);
    if (!db.prepare("SELECT 1 FROM users WHERE id=?").get(uid)) throw new HttpError(404, 'User not found.');
    const temp = crypto.randomBytes(9).toString('base64url');
    const salt = crypto.randomBytes(16).toString('hex');
    db.prepare('UPDATE users SET salt=?, hash=? WHERE id=?').run(salt, await hashPw(temp, salt), uid);
    return send(res, 200, { ok: true, temporaryPassword: temp });
  }

  if (p === '/api/admin/withdrawal' || p === '/api/admin/deposit') {
    const kind = p.endsWith('withdrawal') ? 'withdrawal' : 'deposit';
    if (b.action !== 'approve' && b.action !== 'reject') throw new HttpError(400, 'Action must be approve or reject.');
    tx(() => {
      const t = db.prepare("SELECT * FROM tx WHERE id=? AND kind=? AND status IN ('pending','processing')").get(Number(b.id), kind);
      if (!t) throw new HttpError(404, 'Request not found or already decided.');
      const status = b.action === 'approve' ? 'completed' : 'rejected';
      db.prepare('UPDATE tx SET status=?, decided_by=? WHERE id=?').run(status, me.id, t.id);
      if (kind === 'withdrawal' && status === 'rejected') db.prepare('UPDATE users SET balance_cents=balance_cents+? WHERE id=?').run(t.amount_cents, t.user_id); // refund the reserved funds
      if (kind === 'deposit' && status === 'completed') db.prepare('UPDATE users SET balance_cents=balance_cents+? WHERE id=?').run(t.amount_cents, t.user_id); // credit only once funds are confirmed
    });
    return send(res, 200, { ok: true });
  }
  throw new HttpError(404, 'Not found');
}

setInterval(settleDue, 2000).unref(); settleDue();

http.createServer(async (req, res) => {
  try {
    const p = new URL(req.url, 'http://x').pathname;
    if (!p.startsWith('/api/')) return serveStatic(req, res, p);
    await api(req, res, p);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.code, { error: e.message });
    console.error(e); send(res, 500, { error: 'Server error' });
  }
}).listen(PORT, () => console.log('Vantage server on :' + PORT));
