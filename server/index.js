// Vantage backend: zero-dependency (Node 22+). Users, paper balances, admin credits, withdrawals.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dir, '..', 'data', 'vantage.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, country TEXT, currency TEXT,
  acct_type TEXT, account_no TEXT, salt TEXT, hash TEXT, role TEXT DEFAULT 'user', balance REAL DEFAULT 0, created_at INTEGER);
CREATE TABLE IF NOT EXISTS tx(id INTEGER PRIMARY KEY, user_id INTEGER, kind TEXT, amount REAL, status TEXT, note TEXT, created_at INTEGER);
CREATE TABLE IF NOT EXISTS trades(id INTEGER PRIMARY KEY, user_id INTEGER, client_id TEXT, symbol TEXT, direction TEXT, lots REAL,
  open_price REAL, close_price REAL, pnl REAL, pips REAL, tag TEXT, reason TEXT, open_time INTEGER, close_time INTEGER, UNIQUE(user_id, client_id));
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);`);

let secret = db.prepare("SELECT v FROM meta WHERE k='secret'").get()?.v;
if (!secret) { secret = crypto.randomBytes(32).toString('hex'); db.prepare("INSERT INTO meta VALUES('secret',?)").run(secret); }

const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const sign = p => { const b = Buffer.from(JSON.stringify(p)).toString('base64url'); return b + '.' + crypto.createHmac('sha256', secret).update(b).digest('base64url'); };
const verify = t => {
  const [b, s] = (t || '').split('.');
  if (!b || !s || crypto.createHmac('sha256', secret).update(b).digest('base64url') !== s) return null;
  const p = JSON.parse(Buffer.from(b, 'base64url').toString());
  return p.exp > Date.now() ? p : null;
};
const accountNo = () => 'VC' + crypto.randomInt(10000000, 99999999);
const round = n => Math.round(n * 100) / 100;

function createUser({ email, name, country, currency, acct_type, password, role = 'user' }) {
  const salt = crypto.randomBytes(16).toString('hex');
  db.prepare('INSERT INTO users(email,name,country,currency,acct_type,account_no,salt,hash,role,balance,created_at) VALUES(?,?,?,?,?,?,?,?,?,0,?)')
    .run(email.toLowerCase(), name, country || '', currency || 'USD', acct_type || 'STANDARD_STP', accountNo(), salt, hashPw(password, salt), role, Date.now());
}

const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
if (IS_PROD && !process.env.ADMIN_PASSWORD) { console.error('Set ADMIN_PASSWORD before running in production.'); process.exit(1); }

// Nightly backup of the database file (keeps the last 7)
const backup = () => {
  try {
    const dir = path.join(path.dirname(DB_PATH), 'backups');
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(DB_PATH, path.join(dir, `vantage-${new Date().toISOString().slice(0, 10)}.db`));
    fs.readdirSync(dir).sort().slice(0, -7).forEach(f => fs.unlinkSync(path.join(dir, f)));
  } catch (e) { console.error('Backup failed', e.message); }
};
backup(); setInterval(backup, 864e5);

// Login throttling: 5 failures per 15 minutes per email+IP
const fails = new Map();
const throttled = k => { const f = (fails.get(k) || []).filter(t => Date.now() - t < 9e5); fails.set(k, f); return f.length >= 5; };

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vantage.local').toLowerCase();
const adminPass = process.env.ADMIN_PASSWORD || 'change-me-now';
if (!db.prepare('SELECT 1 FROM users WHERE email=?').get(adminEmail)) {
  createUser({ email: adminEmail, name: 'Administrator', password: adminPass, role: 'admin' });
  console.log(`Admin created: ${adminEmail}` + (process.env.ADMIN_PASSWORD ? '' : ' (default password - set ADMIN_PASSWORD!)'));
}

const pub = u => ({ id: u.id, email: u.email, name: u.name, country: u.country, currency: u.currency, accountType: u.acct_type, accountId: u.account_no, role: u.role, balance: u.balance, joinedDate: u.created_at });
const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
const body = req => new Promise(r => { let d = ''; req.on('data', c => (d += c)); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch { r({}); } }); });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (!p.startsWith('/api/')) {
    const dist = path.join(__dir, '..', 'dist');
    let f = path.join(dist, p === '/' ? 'index.html' : p);
    if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, 'index.html');
    if (!fs.existsSync(f)) return send(res, 404, { error: 'Not built' });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    return fs.createReadStream(f).pipe(res);
  }
  try {
    const b = req.method === 'POST' ? await body(req) : {};
    if (p === '/api/signup' && req.method === 'POST') {
      if (!b.email?.includes('@') || !b.name?.trim() || (b.password || '').length < 8) return send(res, 400, { error: 'Check your name, email and password (8+ characters).' });
      if (db.prepare('SELECT 1 FROM users WHERE email=?').get(b.email.toLowerCase())) return send(res, 409, { error: 'An account with this email already exists.' });
      createUser({ ...b, acct_type: b.accountType });
      const u = db.prepare('SELECT * FROM users WHERE email=?').get(b.email.toLowerCase());
      return send(res, 200, { token: sign({ uid: u.id, exp: Date.now() + 30 * 864e5 }), user: pub(u) });
    }
    if (p === '/api/login' && req.method === 'POST') {
      const key = (b.email || '').toLowerCase() + '|' + req.socket.remoteAddress;
      if (throttled(key)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const u = db.prepare('SELECT * FROM users WHERE email=?').get((b.email || '').toLowerCase());
      if (!u || hashPw(b.password || '', u.salt) !== u.hash) { fails.get(key).push(Date.now()); return send(res, 401, { error: 'Incorrect email or password.' }); }
      return send(res, 200, { token: sign({ uid: u.id, exp: Date.now() + 30 * 864e5 }), user: pub(u) });
    }
    const auth = verify((req.headers.authorization || '').replace('Bearer ', ''));
    const me = auth && db.prepare('SELECT * FROM users WHERE id=?').get(auth.uid);
    if (!me) return send(res, 401, { error: 'Please sign in again.' });
    if (p === '/api/me') return send(res, 200, { user: pub(me) });
    if (p === '/api/account/adjust') { // trading P&L synced from the terminal
      const bal = round(Math.max(0, me.balance + Number(b.delta || 0)));
      db.prepare('UPDATE users SET balance=? WHERE id=?').run(bal, me.id);
      return send(res, 200, { balance: bal });
    }
    if (p === '/api/withdrawal-request') { // balance is already reduced by the terminal; this records the request for admin review
      const amt = round(Number(b.amount));
      if (!(amt > 0)) return send(res, 400, { error: 'Invalid amount.' });
      db.prepare("INSERT INTO tx(user_id,kind,amount,status,note,created_at) VALUES(?,?,?,?,?,?)").run(me.id, 'withdrawal', amt, 'pending', b.note || '', Date.now());
      return send(res, 200, { ok: true });
    }
    if (p === '/api/trades') {
      const ins = db.prepare('INSERT OR IGNORE INTO trades(user_id,client_id,symbol,direction,lots,open_price,close_price,pnl,pips,tag,reason,open_time,close_time) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
      for (const t of (b.trades || []).slice(0, 500)) ins.run(me.id, String(t.id), t.symbol, t.direction, t.lots, t.openPrice, t.closePrice, t.pnl, t.pnlPips || 0, t.strategyTag || 'Untagged', t.closeReason || '', t.openTime, t.closeTime);
      return send(res, 200, { ok: true });
    }
    if (p === '/api/transactions') return send(res, 200, { tx: db.prepare('SELECT * FROM tx WHERE user_id=? ORDER BY id DESC LIMIT 100').all(me.id) });
    if (!p.startsWith('/api/admin/') || me.role !== 'admin') return send(res, 403, { error: 'Not allowed.' });
    if (p === '/api/admin/users') return send(res, 200, { users: db.prepare("SELECT id,name,email,account_no,currency,balance,created_at FROM users WHERE role='user' ORDER BY id DESC").all() });
    if (p === '/api/admin/transactions') return send(res, 200, { tx: db.prepare('SELECT tx.*, users.name, users.account_no FROM tx JOIN users ON users.id=tx.user_id ORDER BY tx.id DESC LIMIT 200').all() });
    if (p === '/api/admin/report') {
      const rows = db.prepare('SELECT trades.*, users.name FROM trades JOIN users ON users.id=trades.user_id').all();
      const agg = (key) => {
        const m = {};
        for (const t of rows) { const k = key(t); const a = (m[k] ||= { name: k, trades: 0, wins: 0, gain: 0, loss: 0 }); a.trades++; if (t.pnl > 0) { a.wins++; a.gain += t.pnl; } else a.loss += -t.pnl; }
        return Object.values(m).map(a => ({ name: a.name, trades: a.trades, winRate: round(100 * a.wins / a.trades), pnl: round(a.gain - a.loss), profitFactor: a.loss ? round(a.gain / a.loss) : null })).sort((x, y) => y.pnl - x.pnl);
      };
      return send(res, 200, { byStrategy: agg(t => t.tag), byUser: agg(t => t.name), totalTrades: rows.length });
    }
    if (p === '/api/admin/credit') {
      const amt = round(Number(b.amount));
      const u = db.prepare('SELECT * FROM users WHERE id=?').get(b.userId);
      if (!u || !(amt > 0)) return send(res, 400, { error: 'Pick a user and enter an amount above zero.' });
      db.prepare('UPDATE users SET balance=? WHERE id=?').run(round(u.balance + amt), u.id);
      db.prepare('INSERT INTO tx(user_id,kind,amount,status,note,created_at) VALUES(?,?,?,?,?,?)').run(u.id, 'deposit', amt, 'completed', b.note || 'Admin deposit', Date.now());
      return send(res, 200, { ok: true });
    }
    if (p === '/api/admin/withdrawal') {
      const t = db.prepare("SELECT * FROM tx WHERE id=? AND kind='withdrawal' AND status='pending'").get(b.id);
      if (!t) return send(res, 404, { error: 'Request not found.' });
      if (b.action === 'reject') db.prepare('UPDATE users SET balance=balance+? WHERE id=?').run(t.amount, t.user_id);
      db.prepare('UPDATE tx SET status=? WHERE id=?').run(b.action === 'reject' ? 'rejected' : 'completed', t.id);
      return send(res, 200, { ok: true });
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) { console.error(e); send(res, 500, { error: 'Server error' }); }
}).listen(PORT, () => console.log('Vantage server on :' + PORT));
