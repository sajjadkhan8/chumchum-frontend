const DEFAULT_ICON_SIZE = 80;

function ZMark({ stroke = '#22c55e', outer = 'rgba(34,197,94,0.3)', inner = 'rgba(34,197,94,0.5)', fillOuter = 'rgba(34,197,94,0.06)', fillInner = 'rgba(34,197,94,0.12)' } = {}) {
  return (
    <g>
      <polygon points="32,4 56,17 56,47 32,60 8,47 8,17" stroke={outer} strokeWidth="1" fill={fillOuter} />
      <polygon points="32,12 50,21.5 50,42.5 32,52 14,42.5 14,21.5" stroke={inner} strokeWidth="1.2" fill={fillInner} />
      <path d="M20 20h24l-20 24h22" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="44" cy="20" r="3" fill={stroke} />
      <circle cx="20" cy="44" r="3" fill={stroke} opacity="0.55" />
      <line x1="8" y1="17" x2="4" y2="14" stroke={inner} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="56" y1="17" x2="60" y2="14" stroke={inner} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="4" x2="32" y2="0" stroke={inner} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function DarkBanner({ className } = {}) {
  return (
    <svg
      className={className}
      viewBox="0 0 460 96"
      role="img"
      aria-label="ZingZing dark logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="zz-dark-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(34,197,94,0.09)" strokeWidth="1" />
        </pattern>
        <radialGradient id="zz-dark-left" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(48 22) rotate(48) scale(140 140)">
          <stop offset="0" stopColor="rgba(34,197,94,0.24)" />
          <stop offset="1" stopColor="rgba(34,197,94,0)" />
        </radialGradient>
        <radialGradient id="zz-dark-right" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(418 84) rotate(160) scale(96 96)">
          <stop offset="0" stopColor="rgba(34,197,94,0.16)" />
          <stop offset="1" stopColor="rgba(34,197,94,0)" />
        </radialGradient>
        <linearGradient id="zz-badge-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(34,197,94,0)" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      <rect width="460" height="96" rx="20" fill="#060d08" />
      <rect width="460" height="96" rx="20" fill="url(#zz-dark-grid)" />
      <rect width="460" height="96" rx="20" fill="url(#zz-dark-left)" />
      <rect width="460" height="96" rx="20" fill="url(#zz-dark-right)" />

      <g transform="translate(24 16)">
        <ZMark />
      </g>

      <text x="102" y="49" fontSize="40" fontWeight="900" fontFamily="Outfit, Sora, sans-serif" fill="#ffffff" letterSpacing="-1.2">
        Zing
        <tspan fill="#22c55e">Zing</tspan>
      </text>
      <text
        x="104"
        y="70"
        fontSize="11"
        fontWeight="600"
        fontFamily="'Space Grotesk', Manrope, sans-serif"
        fill="rgba(34,197,94,0.72)"
        letterSpacing="2.1"
      >
        INFLUENCER MARKETPLACE
      </text>

      <rect x="393" y="42" width="36" height="2" rx="1" fill="url(#zz-badge-line)" />
      <circle cx="430" cy="49" r="4" fill="#22c55e" />
      <circle cx="430" cy="49" r="7" fill="rgba(34,197,94,0.35)" />
      <rect x="405" y="54" width="24" height="2" rx="1" fill="url(#zz-badge-line)" />
    </svg>
  );
}

function LightBanner({ className } = {}) {
  return (
    <svg
      className={className}
      viewBox="0 0 460 96"
      role="img"
      aria-label="ZingZing light logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="zz-light-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(22,163,74,0.14)" />
        </pattern>
        <radialGradient id="zz-light-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(376 18) rotate(50) scale(164 164)">
          <stop offset="0" stopColor="rgba(22,163,74,0.2)" />
          <stop offset="1" stopColor="rgba(22,163,74,0)" />
        </radialGradient>
      </defs>

      <rect width="460" height="96" rx="20" fill="#f8fdf9" stroke="#bbf7d0" strokeWidth="1.5" />
      <rect width="460" height="96" rx="20" fill="url(#zz-light-dots)" />
      <rect width="460" height="96" rx="20" fill="url(#zz-light-glow)" />

      <g transform="translate(24 16)">
        <ZMark
          stroke="#16a34a"
          outer="rgba(22,163,74,0.25)"
          inner="rgba(22,163,74,0.45)"
          fillOuter="rgba(22,163,74,0.06)"
          fillInner="rgba(22,163,74,0.1)"
        />
      </g>

      <text x="102" y="49" fontSize="40" fontWeight="900" fontFamily="Outfit, Sora, sans-serif" fill="#0a1f0d" letterSpacing="-1.2">
        Zing
        <tspan fill="#16a34a">Zing</tspan>
      </text>
      <text
        x="104"
        y="70"
        fontSize="11"
        fontWeight="600"
        fontFamily="'Space Grotesk', Manrope, sans-serif"
        fill="#16a34a"
        letterSpacing="2.1"
      >
        INFLUENCER MARKETPLACE
      </text>

      <rect x="340" y="63" width="98" height="20" rx="10" fill="#dcfce7" stroke="#bbf7d0" />
      <text
        x="389"
        y="76"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fontFamily="'Space Grotesk', Manrope, sans-serif"
        fill="#16a34a"
        letterSpacing="1"
      >
        SAUDI ARABIA
      </text>
    </svg>
  );
}

function IconVariant({ size = DEFAULT_ICON_SIZE, className } = {}) {
  const numericSize = typeof size === 'number' ? size : DEFAULT_ICON_SIZE;
  const rounded = Math.max(6, Math.round(numericSize * 0.28));

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label="ZingZing app icon"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="zz-icon-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a7a3a" />
          <stop offset="0.6" stopColor="#0f5c28" />
          <stop offset="1" stopColor="#0a3d1a" />
        </linearGradient>
        <radialGradient id="zz-icon-highlight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 16) rotate(42) scale(55 45)">
          <stop offset="0" stopColor="rgba(255,255,255,0.26)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <pattern id="zz-icon-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="80" height="80" rx={rounded} fill="url(#zz-icon-bg)" />
      <rect width="80" height="80" rx={rounded} fill="url(#zz-icon-highlight)" />
      <rect width="80" height="80" rx={rounded} fill="url(#zz-icon-grid)" />

      <g transform="translate(14 12)">
        <polygon
          points="26,6 46,17 46,39 26,50 6,39 6,17"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.2"
          fill="rgba(255,255,255,0.08)"
        />
        <path d="M14 16h24L18 40h22" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="38" cy="16" r="3.5" fill="#ffffff" />
        <circle cx="14" cy="40" r="2.5" fill="#ffffff" opacity="0.55" />
      </g>
    </svg>
  );
}

export function ZingZingLogo({ variant = 'light', size, className } = {}) {
  if (variant === 'dark') {
    return <DarkBanner className={className} />;
  }

  if (variant === 'icon') {
    return <IconVariant size={size} className={className} />;
  }

  return <LightBanner className={className} />;
}

export default ZingZingLogo;

