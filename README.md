# Vantage Capital: Strategy Simulator and Client Ledger

React/Vite terminal plus a zero-dependency Node 22 server (SQLite).

## What it is for
Vantage Capital is meant to be an asset-management firm's platform: strategies are first forward-tested on simulated (paper) trading in the Strategy Lab, and only strategies that pass a risk gate (+10% profit hurdle, 5% daily risk budget, 10% trailing drawdown) would get live client capital. It has a trading terminal and charting, a Strategy Lab with win rate / profit factor / expectancy per setup, client onboarding with deposits and withdrawals, and an admin console for crediting, approving and reviewing.

> **Status: simulation.** Market prices are generated locally (`marketEngine.ts`) and trade results are simulated.
> Do not describe this as live market access, real AUM or a licensed custodian until that is true and licensed.
> The wire instructions in the Deposit screen are placeholders: replace them with a real account before taking money.

## Money model
- **Server ledger (integer cents)** is the only withdrawable balance. It changes only via:
  admin credit, admin-confirmed wire deposit, and withdrawals (funds are reserved atomically at request time; a rejection refunds).
- **Simulated trading P&L** lives in the browser, is uploaded for strategy review (`/api/trades`) and never changes the ledger.
- Deposits: the client posts a *notice*; the client is credited only when it completes (automatically in sandbox, or when an admin confirms in real mode).
- Withdrawals: server checks settled funds and validates the ABA routing checksum. Account numbers are AES-256-GCM encrypted at rest and shown only to admins.

## Test (sandbox) mode
`SANDBOX_MODE` defaults to on. Every user gets a personal dummy US account number (Deposit > copy details). After "I have sent the transfer",
a deposit goes Pending -> Processing -> Completed automatically (about 40 s, `SANDBOX_DELAY_SEC`) and is credited exactly once. Withdrawals do the same over about 80 s
unless an admin approves or rejects first. Test routing number: `110000000`. Set `SANDBOX_MODE=false` for real operation: then nothing is credited until an admin confirms the funds.

## Environment variables (Render)
| Name | Purpose |
|---|---|
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin bootstrap (password required in production) |
| `SANDBOX_MODE` | `true` (default) auto-settles transfers with dummy bank details; `false` requires admin confirmation |
| `SESSION_SECRET` | Optional. Token signing key (else generated and stored in the DB) |
| `ACCOUNT_KEY` | Optional but recommended. Separate key for bank-account encryption. Losing it makes stored account numbers unreadable |
| `DB_PATH` | SQLite path on the persistent disk (`/var/data/vantage.db`) |

## Run
```bash
npm install
npm run build
ADMIN_PASSWORD=choose-one npm start   # http://localhost:3000
npm run dev                           # Vite only; run the server separately for /api
```
Nightly consistent backups (last 7) are written next to the database.

## Upgrade note
First start on an existing database converts old balances to cents. Old balances included client-synced P&L: review them before approving any withdrawal.
