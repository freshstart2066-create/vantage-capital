import React, { useEffect } from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TradingTerminal } from './components/TradingTerminal/TradingTerminal';
import { StrategyLab } from './components/StrategyLab/StrategyLab';
import { MarketsDirectory } from './components/Markets/MarketsDirectory';
import { CompanyAbout } from './components/Company/CompanyAbout';
import { ComplianceDisclaimers } from './components/Compliance/ComplianceDisclaimers';
import { SettingsView } from './components/Settings/SettingsView';
import { CompanyHome } from './components/Home/CompanyHome';
import { EconomicCalendar } from './components/Calendar/EconomicCalendar';
import { AuthPage } from './components/Auth/AuthPage';
import { ProfilePage } from './components/Profile/ProfilePage';
import { ClientPortfolios } from './components/Clients/ClientPortfolios';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, toastMessage, clearToast } = useTrading();

  // Auto clear toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Platform Header */}
      <Header />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-4 py-4">
        {activeTab === 'home' && <CompanyHome />}
        {activeTab === 'terminal' && <TradingTerminal />}
        {activeTab === 'strategy_lab' && <StrategyLab />}
        {activeTab === 'calendar' && <EconomicCalendar />}
        {activeTab === 'markets' && <MarketsDirectory />}
        {activeTab === 'company' && <CompanyAbout />}
        {activeTab === 'compliance' && <ComplianceDisclaimers />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'auth' && <AuthPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'clients' && <ClientPortfolios />}
      </main>

      {/* Floating Neomorphic Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div
            className={`neo-card p-3.5 pr-8 rounded-xl shadow-2xl flex items-center gap-3 border ${
              toastMessage.type === 'success'
                ? 'border-[var(--accent-long)]/40 bg-[var(--bg-surface-card)]'
                : toastMessage.type === 'danger'
                ? 'border-[var(--accent-short)]/40 bg-[var(--bg-surface-card)]'
                : 'border-[var(--accent-brand)]/40 bg-[var(--bg-surface-card)]'
            }`}
          >
            {toastMessage.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-[var(--accent-long)] flex-shrink-0" />
            )}
            {toastMessage.type === 'danger' && (
              <AlertTriangle className="w-5 h-5 text-[var(--accent-short)] flex-shrink-0" />
            )}
            {toastMessage.type === 'info' && (
              <Info className="w-5 h-5 text-[var(--accent-brand)] flex-shrink-0" />
            )}

            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {toastMessage.text}
            </span>

            <button
              onClick={clearToast}
              className="absolute right-2 top-2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Platform Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <TradingProvider>
      <MainLayout />
    </TradingProvider>
  );
}
