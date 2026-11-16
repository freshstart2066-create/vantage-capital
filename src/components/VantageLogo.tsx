import React from 'react';

interface VantageLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const VantageLogo: React.FC<VantageLogoProps> = ({ size = 28, className = '', showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Faceted Geometric 'V' Crest Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="vantageGradLeft" x1="6" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="vantageGradRight" x1="18" y1="12" x2="30" y2="6" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
          <filter id="vantageGlow" x="0" y="0" width="36" height="36" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer subtle shield geometry */}
        <rect width="36" height="36" rx="9" fill="currentColor" fillOpacity="0.04" />

        {/* Left wing of V */}
        <path
          d="M7 8.5L16 27.5L18 27.5L13.5 8.5H7Z"
          fill="url(#vantageGradLeft)"
        />

        {/* Right ascending wing of V */}
        <path
          d="M29 8.5L18 27.5L16 27.5L22.5 8.5H29Z"
          fill="url(#vantageGradRight)"
        />

        {/* Center faceted apex core */}
        <path
          d="M14.5 13L18 20L21.5 13L18 10.5L14.5 13Z"
          fill="#38BDF8"
          fillOpacity="0.9"
        />

        {/* Ascending alpha star pip */}
        <circle cx="28.5" cy="7.5" r="2" fill="#10B981" />
      </svg>

      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black tracking-wider text-[var(--text-primary)]">
              VANTAGE
            </span>
            <span className="hidden min-[430px]:inline text-xs font-bold px-1.5 py-0.5 rounded neo-inset-sm text-[var(--accent-brand)] tracking-widest">
              CAPITAL
            </span>
          </div>
          <span className="hidden sm:block text-[9px] font-mono tracking-widest uppercase text-[var(--text-muted)]">
            Institutional Strategy Sandbox
          </span>
        </div>
      )}
    </div>
  );
};
