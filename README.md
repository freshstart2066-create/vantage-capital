# Vantage Capital — Institutional Asset Management & Trading Terminal

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/freshstart2066-create/vantage-capital)

Vantage Capital is an institutional asset management and trading platform that manages real client funds and provides direct market access (DMA). To protect client capital, all quantitative models and discretionary strategies are first forward-tested with paper simulation in our high-precision strategy validation lab before live client capital is allocated.

---

## Live Deployment to Render

### 1-Click Blueprint Deployment
Click the button above or visit:
**[https://render.com/deploy?repo=https://github.com/freshstart2066-create/vantage-capital](https://render.com/deploy?repo=https://github.com/freshstart2066-create/vantage-capital)**

Render will automatically read [`render.yaml`](./render.yaml) and configure the build settings.

### Manual Render Setup (Static Site)
If setting up manually in your [Render Dashboard](https://dashboard.render.com/):
1. Click **New +** &rarr; **Static Site**
2. Connect repository: `freshstart2066-create/vantage-capital`
3. Configure settings:
   - **Name:** `vantage-capital`
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add Route Rewrite (SPA):
   - **Source:** `/*`
   - **Destination:** `/index.html`
5. Click **Create Static Site**.

---

## Core Institutional Features

1. **USA Domestic Fedwire Banking (Inbound & Outbound):**
   - Inbound Fedwire deposit registration with ABA routing number verification (`021000021`) and instant account credit.
   - Outbound Fedwire disbursements with FinCEN compliance fields, real-time Fedwire reference generation (`FEDWIRE-XXXXXX`), and fee waivers.
2. **Managed Client Portfolios & AUM Dashboard:**
   - Real-money client account tracking ($410k+ AUM across Sovereign, Institutional Prime, Accredited, and Private Wealth mandates).
   - High-Water Mark calculation, 2% management fee / 20% incentive fee tracking, and strategy allocation bridge.
3. **Strategy Pre-Deployment Risk Guard:**
   - Fiduciary risk gate requiring strategies to achieve a +10% profit hurdle within a 5% max daily risk budget and 10% trailing drawdown ceiling before live capital deployment.
4. **Interactive Trading Terminal & Charting:**
   - Multi-asset execution (Forex, US Equities, Commodities, Crypto) with candlestick charting, indicator overlays (SMA, EMA, Bollinger Bands, RSI), and pre-trade checklist logging.
5. **Strategy Lab & Edge Analytics:**
   - Isolated Win Rate %, Profit Factor, and mathematical expectancy calculation per setup rule tag.

---

## Local Development

```bash
# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Build production bundle
npm run build
```
