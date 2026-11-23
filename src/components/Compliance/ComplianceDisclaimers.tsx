import React from 'react';
import { AlertTriangle, ShieldCheck, Scale, FileText } from 'lucide-react';

export const ComplianceDisclaimers: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Title */}
      <div className="neo-box p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neo-inset-sm text-xs font-bold text-[var(--accent-short)] mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Regulatory Disclosures & Risk Advisory</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
          Important Financial Disclosures & Strategy Governance Terms
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Please review the statutory warnings, fiduciary parameters, and risk disclosures governing Vantage Capital asset management and strategy testing.
        </p>
      </div>

      {/* 1. Capital Allocation & Strategy Scope */}
      <div className="neo-box p-6 space-y-3">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-brand)]" />
          1. Asset Management & Strategy Verification Scope
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Vantage Capital is an institutional asset management firm that manages client funds and executes real-money market operations with domestic Bank transfer settlement. We are not a prop firm.
        </p>
        <div className="p-3 rounded-xl neo-inset text-xs text-[var(--text-muted)] leading-relaxed">
          <strong>Fiduciary Mandate:</strong> To protect client capital, all quantitative models and discretionary strategies must first undergo mandatory forward-testing in our internal paper simulation cockpit before any live client capital is allocated. Real-money client deposits and disbursements are processed exclusively via Bank transfer clearing.
        </div>
      </div>

      {/* 2. CFTC Rule 4.41 Simulated Performance Disclaimer */}
      <div className="neo-box p-6 space-y-3">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Scale className="w-4 h-4 text-[var(--accent-brand)]" />
          2. Simulated & Hypothetical Forward-Testing Limitations (CFTC Rule 4.41 Standard)
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Hypothetical or simulated forward-testing results have inherent limitations. Unlike an actual live performance record, forward simulation results do not represent live capital exposure. Also, since simulated trades have not actually been executed against interbank market makers, results may have under- or over-compensated for the impact of extreme market illiquidity, severe execution slippage, or flash crash events.
        </p>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Forward-testing is utilized strictly to verify risk models, validate execution rules, and stress-test risk management controls prior to live deployment. No representation is being made that any account will or is likely to achieve profits identical to simulated metrics.
        </p>
      </div>

      {/* 3. Margin & Leverage Risk Warning */}
      <div className="neo-box p-6 space-y-3">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--accent-short)]" />
          3. Leverage & High-Risk Speculation Warning
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Foreign exchange (Forex), equity securities, and derivative trading on margin carry a high level of risk and may not be suitable for all investors. The high degree of leverage offered (up to 1:200 ECN) can work against you as well as for you.
        </p>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Prior to deploying capital into live financial markets, investors should carefully consider their investment objectives, financial situation, and risk tolerance. The possibility exists that an investor could sustain a loss of some or all initial capital.
        </p>
      </div>

      {/* 4. Market Data Attribution */}
      <div className="neo-box p-6 space-y-3">
        <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--text-muted)]" />
          4. Market Feed Integrity & Microstructure Modeling
        </h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Indicative live rates are derived from public interbank exchange rate feeds and consensus market benchmarks. Micro-ticks and intraday spreads are synthetically modeled to provide realistic liquidity conditions 24 hours a day, 7 days a week, enabling consistent strategy testing across weekend intervals and off-market hours.
        </p>
      </div>
    </div>
  );
};
