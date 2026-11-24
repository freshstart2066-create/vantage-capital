// Vantage backend: supports Neon PostgreSQL (when DATABASE_URL is set) and SQLite fallback.
// Money model: the SERVER LEDGER (integer cents) is the only withdrawable balance.
// It changes only through: admin credit, admin-approved deposit, withdrawal (reserved at request time).
// Terminal trading P&L is simulated and self-reported: stored for review, never withdrawable.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { db, isPostgres } from './db.js';
import {
  sendWelcomeEmail,
  sendDepositReportedEmail,
  sendDepositConfirmedEmail,
  sendWithdrawalRequestedEmail,
  sendWithdrawalDispatchedEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from './email.js';

const scrypt = promisify(crypto.scrypt);
const __dir = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dir, '..', 'dist');
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
const MAX_BODY = 100 * 1024;
const MAX_CENTS = 100_000_000_00; // $100M hard ceiling per operation
// Self-allocation is disabled: deposits NEVER auto-credit. All funding must be approved or allocated by Admin.
const SANDBOX = process.env.SANDBOX_MODE === 'true';
const DELAY = Math.max(5, Number(process.env.SANDBOX_DELAY_SEC) || 40) * 1000;
const BANK_INFO = {
  beneficiary: process.env.BANK_BENEFICIARY || 'Vantage Capital Asset Management LLC',
  bankName: process.env.BANK_NAME || 'Capital One, N.A.',
  routing: process.env.BANK_ROUTING || '051405515',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '362910482914',
  accountType: process.env.BANK_ACCOUNT_TYPE || 'Commercial Checking',
  address: process.env.BANK_ADDRESS || '1680 Capital One Drive, McLean, VA 22102',
};

if (IS_PROD && !process.env.ADMIN_PASSWORD) {
  console.warn('Set ADMIN_PASSWORD before running in production. Using fallback credentials.');
}

// ---- secrets ----
let secret = process.env.SESSION_SECRET || (await db.get("SELECT v FROM meta WHERE k='secret'"))?.v;
if (!secret) {
  secret = crypto.randomBytes(32).toString('hex');
  await db.run("INSERT INTO meta VALUES('secret',?)", secret);
}

const hashPw = async (pw, salt) => (await scrypt(pw, salt, 64)).toString('hex');
const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const sign = p => {
  const b = Buffer.from(JSON.stringify(p)).toString('base64url');
  return b + '.' + crypto.createHmac('sha256', secret).update(b).digest('base64url');
};
const verify = t => {
  try {
    const [b, s] = String(t || '').split('.');
    if (!b || !s || !safeEq(crypto.createHmac('sha256', secret).update(b).digest('base64url'), s)) return null;
    const p = JSON.parse(Buffer.from(b, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
};
const accountNo = () => 'VC' + crypto.randomInt(10000000, 99999999);

const depositAcct = async u => {
  if (BANK_INFO.accountNumber) return BANK_INFO.accountNumber;
  if (u.deposit_acct) return u.deposit_acct;
  for (let i = 0; i < 10; i++) {
    const a = String(crypto.randomInt(10 ** 11, 10 ** 12));
    try {
      await db.run('UPDATE users SET deposit_acct=? WHERE id=? AND deposit_acct IS NULL', a, u.id);
      const res = await db.get('SELECT deposit_acct FROM users WHERE id=?', u.id);
      if (res?.deposit_acct) return res.deposit_acct;
    } catch { /* retry */ }
  }
  return '362910482914';
};
const refNo = p => `${p}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const dollars = c => Number((c / 100).toFixed(2));
// Bank account numbers are encrypted at rest (AES-256-GCM) and only ever decrypted for admins paying out.
const encKey = crypto.createHash('sha256').update('acct|' + (process.env.ACCOUNT_KEY || secret)).digest();
const enc = txt => {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', encKey, iv);
  const ct = Buffer.concat([c.update(txt, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), ct].map(b => b.toString('base64')).join('.');
};
const dec = v => {
  try {
    const [iv, tag, ct] = v.split('.').map(x => Buffer.from(x, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', encKey, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
  } catch { return ''; }
};
const toCents = v => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  const c = Math.round(n * 100);
  return c > 0 && c <= MAX_CENTS ? c : null;
};
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const validAba = r => /^\d{9}$/.test(r) && (3 * (+r[0] + +r[3] + +r[6]) + 7 * (+r[1] + +r[4] + +r[7]) + (+r[2] + +r[5] + +r[8])) % 10 === 0;

async function createUser({ email, name, country, currency, acct_type, password, role = 'user' }) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashPw(password, salt);
  for (let i = 0; i < 5; i++) {
    try {
      await db.run(
        'INSERT INTO users(email,name,country,currency,acct_type,account_no,salt,hash,role,balance,balance_cents,created_at) VALUES(?,?,?,?,?,?,?,?,?,0,0,?)',
        email, name, country, currency, acct_type, accountNo(), salt, hash, role, Date.now()
      );
      return;
    } catch (e) {
      if (!/account_no|UNIQUE/i.test(String(e.message)) || /email/i.test(String(e.message))) throw e;
    }
  }
  throw new Error('Could not allocate account number');
}

// ---- admin bootstrap ----
const defaultAdminPw = process.env.ADMIN_PASSWORD || 'VantageAdmin2026!';
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vantagecapital.website').toLowerCase();
const existingAdmin = await db.get('SELECT id FROM users WHERE email=?', adminEmail);
if (!existingAdmin) {
  try {
    await createUser({ email: adminEmail, name: 'Administrator', country: 'United States', currency: 'USD', acct_type: 'ADMIN', password: defaultAdminPw, role: 'admin' });
    console.log(`Admin created: ${adminEmail}`);
  } catch (e) {
    console.error('Error creating admin:', e.message);
  }
} else {
  await db.run("UPDATE users SET role='admin' WHERE id=?", existingAdmin.id);
}

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

// ---- settlement: deposits NEVER auto-credit; they require admin confirmation in the Admin Portal ----
async function settleDue() {
  // Auto-crediting is completely disabled: only an admin can approve and credit deposits.
}

// ---- helpers ----
const pub = u => ({ id: u.id, email: u.email, name: u.name, country: u.country, currency: u.currency, accountType: u.acct_type, accountId: u.account_no, role: u.role, balance: dollars(u.balance_cents), joinedDate: Number(u.created_at) });
const txOut = (t, admin = false) => {
  let detail = t.detail ? (typeof t.detail === 'string' ? JSON.parse(t.detail) : t.detail) : undefined;
  if (detail) { const { accountEnc, ...rest } = detail; detail = admin && accountEnc ? { ...rest, accountNumber: dec(accountEnc) } : rest; }
  return { id: t.id, user_id: t.user_id, kind: t.kind, amount: dollars(t.amount_cents), status: t.status, note: t.note, ref: t.ref, created_at: Number(t.created_at), name: t.name, account_no: t.account_no, detail };
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

// ---- static files ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };
let csp = null;
const buildCsp = () => {
  let hashes = '';
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => ` 'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`).join('');
  } catch { /* not built yet */ }
  return `default-src 'self'; script-src 'self'${hashes}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.fasthosts.co.uk; font-src 'self' https://fonts.gstatic.com https://static.fasthosts.co.uk data:; img-src 'self' data: blob: https:; connect-src 'self' https://open.er-api.com https://api.binance.com https://api.coinbase.com https://api.coingecko.com wss: ws:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;
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
    const existing = await db.get('SELECT 1 FROM users WHERE email=?', email);
    if (existing) throw new HttpError(409, 'An account with this email already exists.');
    const currency = ['USD', 'EUR', 'GBP'].includes(b.currency) ? b.currency : 'USD';
    const acct_type = ['ECN_RAW', 'STANDARD_STP'].includes(b.accountType) ? b.accountType : 'STANDARD_STP';
    await createUser({ email, name, country: str(b.country, 60), currency, acct_type, password, role: 'user' });
    const u = await db.get('SELECT * FROM users WHERE email=?', email);
    sendWelcomeEmail({ to: u.email, name: u.name, accountId: u.account_no }).catch(err => console.error('[Email Error] Welcome email failed:', err.message));
    return send(res, 200, { token: sign({ uid: u.id, exp: Date.now() + 7 * 864e5 }), user: pub(u) });
  }
  if (p === '/api/login') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    const email = str(b.email, 254).toLowerCase(), key = 'login|' + email + '|' + ip;
    if (!hit('loginip|' + ip, 120, 9e5) || (buckets.get(key) || []).filter(t => Date.now() - t < 9e5).length >= 15) throw new HttpError(429, 'Too many failed login attempts. Try again in 15 minutes.');
    const u = await db.get('SELECT * FROM users WHERE email=?', email);
    const ok = u ? safeEq(await hashPw(typeof b.password === 'string' ? b.password : '', u.salt), u.hash) : (await hashPw('x', 'y'), false);
    if (!ok) { hit(key, 99, 9e5); throw new HttpError(401, 'Incorrect email or password.'); }
    buckets.delete(key);
    return send(res, 200, { token: sign({ uid: u.id, exp: Date.now() + 7 * 864e5 }), user: pub(u) });
  }

  if (p === '/api/auth/forgot-password' || p === '/api/forgot-password') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    const email = str(b.email, 254).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
    if (!hit('forgot|' + ip, 10, 9e5)) throw new HttpError(429, 'Too many requests. Please try again later.');

    const u = await db.get('SELECT * FROM users WHERE email=?', email);
    if (u) {
      const resetToken = sign({
        uid: u.id,
        purpose: 'pwd_reset',
        exp: Date.now() + 36e5, // 1 hour validity
        v: (u.hash || '').slice(0, 16),
      });
      const appUrl = process.env.APP_URL || (IS_PROD ? 'https://vantagecapital.website' : `http://localhost:${PORT}`);
      const resetUrl = `${appUrl}/?reset_token=${resetToken}`;
      sendPasswordResetEmail({ to: u.email, name: u.name, resetUrl }).catch(err => {
        console.error('[Email Error] Failed to send password reset email:', err.message);
      });
    }

    return send(res, 200, {
      ok: true,
      message: 'If an account is associated with this email, a password reset link has been dispatched.',
    });
  }

  if (p === '/api/auth/reset-password' || p === '/api/reset-password') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    if (!hit('resetpw|' + ip, 15, 9e5)) throw new HttpError(429, 'Too many attempts. Please try again later.');
    const token = typeof b.token === 'string' ? b.token : '';
    const newPassword = typeof b.newPassword === 'string' ? b.newPassword : '';
    if (!token) throw new HttpError(400, 'Reset token is required.');
    if (newPassword.length < 8 || newPassword.length > 200) {
      throw new HttpError(400, 'Password must be between 8 and 200 characters.');
    }

    const payload = verify(token);
    if (!payload || payload.purpose !== 'pwd_reset') {
      throw new HttpError(400, 'Invalid or expired password reset link. Please request a new one.');
    }

    const u = await db.get('SELECT * FROM users WHERE id=?', payload.uid);
    if (!u || payload.v !== (u.hash || '').slice(0, 16)) {
      throw new HttpError(400, 'This password reset link has already been used or has expired.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashPw(newPassword, salt);
    await db.run('UPDATE users SET salt=?, hash=? WHERE id=?', salt, hash, u.id);

    sendPasswordChangedEmail({ to: u.email, name: u.name }).catch(err => {
      console.error('[Email Error] Failed to send password changed notice:', err.message);
    });

    return send(res, 200, {
      ok: true,
      message: 'Your password has been reset successfully. You can now sign in.',
    });
  }

  if (p === '/api/config') return send(res, 200, { sandbox: SANDBOX });
  const auth = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
  const me = auth ? await db.get('SELECT * FROM users WHERE id=?', auth.uid) : null;
  if (!me) throw new HttpError(401, 'Please sign in again.');

  if (p === '/api/me') return send(res, 200, { user: pub(me) });

  if (p === '/api/change-password') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    if (!hit('pw|' + me.id, 5, 9e5)) throw new HttpError(429, 'Too many attempts. Try again later.');
    const cur = typeof b.currentPassword === 'string' ? b.currentPassword : '', next = typeof b.newPassword === 'string' ? b.newPassword : '';
    if (next.length < 8 || next.length > 200) throw new HttpError(400, 'New password must be at least 8 characters.');
    if (!safeEq(await hashPw(cur, me.salt), me.hash)) throw new HttpError(401, 'Current password is incorrect.');
    const salt = crypto.randomBytes(16).toString('hex');
    await db.run('UPDATE users SET salt=?, hash=? WHERE id=?', salt, await hashPw(next, salt), me.id);
    return send(res, 200, { ok: true });
  }

  if (p === '/api/deposit-info') {
    const acct = await depositAcct(me);
    return send(res, 200, {
      sandbox: false,
      beneficiary: BANK_INFO.beneficiary,
      bankName: BANK_INFO.bankName,
      routingNumber: BANK_INFO.routing,
      accountNumber: acct,
      accountType: BANK_INFO.accountType,
      bankAddress: BANK_INFO.address,
      reference: me.account_no,
      processingSeconds: Math.round(DELAY / 1000)
    });
  }

  if (p === '/api/transactions') {
    const rows = await db.all('SELECT * FROM tx WHERE user_id=? ORDER BY id DESC LIMIT 100', me.id);
    return send(res, 200, { tx: rows.map(t => txOut(t, false)) });
  }

  if (p === '/api/deposit-notice') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    if (!hit('dep|' + me.id, 10, 36e5)) throw new HttpError(429, 'Too many deposit notices. Try later.');
    const c = toCents(b.amount); if (!c) throw new HttpError(400, 'Enter a valid amount.');
    if (c > 100_000_000_00) throw new HttpError(400, 'Deposits are limited to $100,000,000 per transfer.');
    const depNum = await depositAcct(me);
    const detail = { originatorName: me.name, originatingBankName: str(b.senderBankName, 120), wireMemo: str(b.memo, 140), accountNumber: depNum };
    const ref = refNo('DEP'), now = Date.now();
    await db.run(
      "INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,detail,ref,process_at,settle_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      me.id, 'deposit', dollars(c), c, 'pending', 'Bank wire transfer (awaiting confirmation)', JSON.stringify(detail), ref, null, null, now
    );
    sendDepositReportedEmail({
      to: me.email,
      name: me.name,
      amount: dollars(c),
      referenceId: ref,
      originatingBank: str(b.senderBankName, 120),
      accountId: me.account_no,
    }).catch(err => console.error('[Email Error] Deposit notice email failed:', err.message));
    return send(res, 200, { ok: true, referenceId: ref });
  }

  if (p === '/api/withdraw') {
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
    const out = await db.tx(async txDb => {
      const u = await txDb.get('SELECT balance_cents FROM users WHERE id=?', me.id);
      if (u.balance_cents < c) throw new HttpError(400, `Insufficient settled funds. Withdrawable: $${dollars(u.balance_cents).toFixed(2)}.`);
      await txDb.run('UPDATE users SET balance_cents=balance_cents-? WHERE id=?', c, me.id);
      const now = Date.now();
      await txDb.run(
        "INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,detail,ref,process_at,settle_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        me.id, 'withdrawal', dollars(c), c, 'pending', str(b.wireMemo, 140) || 'Capital payout', JSON.stringify(detail), ref, SANDBOX ? now + DELAY / 2 : null, SANDBOX ? now + DELAY * 2 : null, now
      );
      const updated = await txDb.get('SELECT balance_cents FROM users WHERE id=?', me.id);
      return updated.balance_cents;
    });
    sendWithdrawalRequestedEmail({
      to: me.email,
      name: me.name,
      amount: dollars(c),
      referenceId: ref,
      bankName: bank,
      accountLast4: acct.slice(-4),
    }).catch(err => console.error('[Email Error] Withdrawal request email failed:', err.message));
    return send(res, 200, { ok: true, referenceId: ref, balance: dollars(out) });
  }

  if (p === '/api/trades') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
    let stored = 0;
    await db.tx(async txDb => {
      for (const t of (Array.isArray(b.trades) ? b.trades : []).slice(0, 200)) {
        if (!t || typeof t !== 'object') continue;
        const pnl = Math.max(-1e9, Math.min(1e9, num(t.pnl)));
        await txDb.run(
          'INSERT OR IGNORE INTO trades(user_id,client_id,symbol,direction,lots,open_price,close_price,pnl,pips,tag,reason,open_time,close_time) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
          me.id, str(String(t.id), 80), str(t.symbol, 20), t.direction === 'SELL' ? 'SELL' : 'BUY', num(t.lots), num(t.openPrice), num(t.closePrice), pnl, num(t.pnlPips), str(t.strategyTag, 60) || 'Untagged', str(t.closeReason, 120), Math.trunc(num(t.openTime)), Math.trunc(num(t.closeTime))
        );
        stored++;
      }
    });
    return send(res, 200, { ok: true, stored });
  }

  if (!p.startsWith('/api/admin/') || me.role !== 'admin') throw new HttpError(403, 'Not allowed.');

  if (p === '/api/admin/users') {
    const rows = await db.all("SELECT id,name,email,account_no,currency,balance_cents,role,created_at FROM users ORDER BY id DESC");
    return send(res, 200, {
      users: rows.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        account_no: u.account_no,
        currency: u.currency,
        balance: dollars(u.balance_cents),
        role: u.role,
        created_at: Number(u.created_at)
      }))
    });
  }
  if (p === '/api/admin/user-tx') {
    if (!POST) throw new HttpError(405, 'Method not allowed.');
    const uid = Number(b.id);
    const u = await db.get("SELECT id,name,email,account_no,currency,balance_cents,country,role,created_at FROM users WHERE id=?", uid);
    if (!u) throw new HttpError(404, 'User not found.');
    const rows = await db.all('SELECT tx.*, users.name, users.account_no FROM tx JOIN users ON users.id=tx.user_id WHERE tx.user_id=? ORDER BY tx.id DESC LIMIT 100', uid);
    return send(res, 200, { user: { id: u.id, name: u.name, email: u.email, account_no: u.account_no, currency: u.currency, country: u.country, role: u.role, balance: dollars(u.balance_cents), created_at: Number(u.created_at) }, tx: rows.map(t => txOut(t, true)) });
  }
  if (p === '/api/admin/transactions') {
    const rows = await db.all('SELECT tx.*, users.name, users.account_no FROM tx JOIN users ON users.id=tx.user_id ORDER BY tx.id DESC LIMIT 200');
    return send(res, 200, { tx: rows.map(t => txOut(t, true)) });
  }
  if (p === '/api/admin/report') {
    const rows = await db.all('SELECT trades.tag, trades.pnl, users.name FROM trades JOIN users ON users.id=trades.user_id');
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
    let recipientUser = null;
    await db.tx(async txDb => {
      const u = await txDb.get("SELECT id, name, email, account_no FROM users WHERE id=?", uid);
      if (!u) throw new HttpError(404, 'User not found.');
      await txDb.run('UPDATE users SET balance_cents=balance_cents+? WHERE id=?', c, uid);
      const ref = refNo('ADM');
      await txDb.run(
        "INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,ref,decided_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
        uid, 'deposit', dollars(c), c, 'completed', str(b.note, 140) || 'Admin credit', ref, me.id, Date.now()
      );
      const updated = await txDb.get("SELECT balance_cents FROM users WHERE id=?", uid);
      recipientUser = { ...u, balance_cents: updated.balance_cents, ref };
    });
    if (recipientUser) {
      sendDepositConfirmedEmail({
        to: recipientUser.email,
        name: recipientUser.name,
        amount: dollars(c),
        referenceId: recipientUser.ref,
        newBalance: dollars(recipientUser.balance_cents),
        accountId: recipientUser.account_no,
      }).catch(err => console.error('[Email Error] Credit email failed:', err.message));
    }
    return send(res, 200, { ok: true });
  }

  if (p === '/api/admin/set-balance') {
    const n = Number(b.amount);
    if (!Number.isFinite(n) || n < 0) throw new HttpError(400, 'Enter a valid balance (0 or greater).');
    const targetCents = Math.round(n * 100);
    const uid = Number(b.userId);
    if (!Number.isInteger(uid)) throw new HttpError(400, 'Invalid user ID.');
    await db.tx(async txDb => {
      const u = await txDb.get("SELECT id, balance_cents FROM users WHERE id=?", uid);
      if (!u) throw new HttpError(404, 'User not found.');
      const diff = targetCents - u.balance_cents;
      await txDb.run('UPDATE users SET balance_cents=? WHERE id=?', targetCents, uid);
      await txDb.run(
        "INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,ref,decided_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
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

  if (p === '/api/admin/debit') {
    const c = toCents(b.amount), uid = Number(b.userId), note = str(b.note, 140) || 'Capital reduction';
    if (!c || !Number.isInteger(uid)) throw new HttpError(400, 'Pick a user and enter an amount above zero.');
    await db.tx(async txDb => {
      const u = await txDb.get("SELECT balance_cents FROM users WHERE id=?", uid);
      if (!u) throw new HttpError(404, 'User not found.');
      if (u.balance_cents < c) throw new HttpError(400, `Balance is only $${dollars(u.balance_cents).toFixed(2)}. Cannot deduct more than available balance.`);
      await txDb.run('UPDATE users SET balance_cents=balance_cents-? WHERE id=?', c, uid);
      await txDb.run(
        "INSERT INTO tx(user_id,kind,amount,amount_cents,status,note,ref,decided_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
        uid, 'adjustment', dollars(c), c, 'completed', note, refNo('DBT'), me.id, Date.now()
      );
    });
    return send(res, 200, { ok: true });
  }

  if (p === '/api/admin/reset-password') {
    const uid = Number(b.userId);
    if (!await db.get("SELECT 1 FROM users WHERE id=?", uid)) throw new HttpError(404, 'User not found.');
    const temp = crypto.randomBytes(9).toString('base64url');
    const salt = crypto.randomBytes(16).toString('hex');
    await db.run('UPDATE users SET salt=?, hash=? WHERE id=?', salt, await hashPw(temp, salt), uid);
    return send(res, 200, { ok: true, temporaryPassword: temp });
  }

  if (p === '/api/admin/withdrawal' || p === '/api/admin/deposit') {
    const kind = p.endsWith('withdrawal') ? 'withdrawal' : 'deposit';
    if (b.action !== 'approve' && b.action !== 'reject') throw new HttpError(400, 'Action must be approve or reject.');
    let notifyTarget = null;
    await db.tx(async txDb => {
      const t = await txDb.get("SELECT * FROM tx WHERE id=? AND kind=? AND status IN ('pending','processing')", Number(b.id), kind);
      if (!t) throw new HttpError(404, 'Request not found or already decided.');
      const status = b.action === 'approve' ? 'completed' : 'rejected';
      await txDb.run('UPDATE tx SET status=?, decided_by=? WHERE id=?', status, me.id, t.id);
      if (kind === 'withdrawal' && status === 'rejected') {
        await txDb.run('UPDATE users SET balance_cents=balance_cents+? WHERE id=?', t.amount_cents, t.user_id);
      }
      if (kind === 'deposit' && status === 'completed') {
        await txDb.run('UPDATE users SET balance_cents=balance_cents+? WHERE id=?', t.amount_cents, t.user_id);
      }
      const u = await txDb.get('SELECT id, name, email, account_no, balance_cents FROM users WHERE id=?', t.user_id);
      if (u) {
        notifyTarget = { user: u, tx: t, status };
      }
    });

    if (notifyTarget && notifyTarget.status === 'completed') {
      const { user: recipient, tx: decidedTx } = notifyTarget;
      if (kind === 'deposit') {
        sendDepositConfirmedEmail({
          to: recipient.email,
          name: recipient.name,
          amount: dollars(decidedTx.amount_cents),
          referenceId: decidedTx.ref,
          newBalance: dollars(recipient.balance_cents),
          accountId: recipient.account_no,
        }).catch(err => console.error('[Email Error] Deposit confirmed email failed:', err.message));
      } else if (kind === 'withdrawal') {
        let parsedDetail = {};
        try { parsedDetail = JSON.parse(decidedTx.detail || '{}'); } catch {}
        sendWithdrawalDispatchedEmail({
          to: recipient.email,
          name: recipient.name,
          amount: dollars(decidedTx.amount_cents),
          referenceId: decidedTx.ref,
          bankName: parsedDetail.bankName || 'Beneficiary Bank',
        }).catch(err => console.error('[Email Error] Withdrawal dispatched email failed:', err.message));
      }
    }

    return send(res, 200, { ok: true });
  }
  throw new HttpError(404, 'Not found');
}

setInterval(settleDue, 3000).unref();
void settleDue();

http.createServer(async (req, res) => {
  try {
    const p = new URL(req.url, 'http://x').pathname;
    if (!p.startsWith('/api/')) return serveStatic(req, res, p);
    await api(req, res, p);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.code, { error: e.message });
    console.error(e); send(res, 500, { error: 'Server error' });
  }
}).listen(PORT, () => console.log('Vantage server running on :' + PORT + (isPostgres ? ' (Neon Postgres)' : ' (SQLite)')));
