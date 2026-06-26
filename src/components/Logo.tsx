interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showMotto?: boolean
  animated?: boolean
}

export default function Logo({ size = 'md', showMotto = false }: LogoProps) {
  // Just control the rendered height; width scales automatically via viewBox
  const heights = { sm: 32, md: 40, lg: 52, xl: 68 }
  const h = heights[size]

  return (
    <div className="flex items-center gap-2.5">
      {/* Icon only — tight 70x70 viewBox around just the envelope+hook */}
      <svg
        viewBox="55 80 160 128"
        height={h}
        width={h}
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d4ff"/>
            <stop offset="100%" stopColor="#6366f1"/>
          </linearGradient>
        </defs>

        {/* Envelope body */}
        <rect x="55" y="90" width="150" height="108" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
        {/* V flap */}
        <polyline points="55,90 130,152 205,90" fill="none" stroke="url(#lg)" strokeWidth="2.5"/>
        {/* Text lines */}
        <line x1="78" y1="168" x2="182" y2="168" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="78" y1="180" x2="152" y2="180" stroke="#334155" strokeWidth="1.5" strokeLinecap="round"/>

        {/* Hook eye */}
        <circle cx="197" cy="87" r="4" fill="none" stroke="url(#lg)" strokeWidth="2.5"/>
        {/* Hook — one continuous path */}
        <path
          d="M197 91 L197 112 Q197 124 187 124 Q177 124 177 114 Q177 108 183 106 L188 100"
          fill="none" stroke="url(#lg)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      <div>
        <div className={`font-bold tracking-tight leading-none text-white ${
          size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-4xl'
        }`}>
          PhishGuard
        </div>
        <div className={`font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#6366f1] tracking-[0.25em] uppercase leading-none mt-0.5 ${
          size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-sm'
        }`}>
          360° Protection
        </div>
        {showMotto && (
          <div className="text-[9px] text-[var(--text-dim)] tracking-[0.2em] uppercase mt-0.5 font-mono">
            Protect · Serve · Secure
          </div>
        )}
      </div>
    </div>
  )
}