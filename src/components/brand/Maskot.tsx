import { cn } from "@/lib/utils";


export function Mascot({
  className,
  animated = false,
  idPrefix = "hero",
  viewBox = "0 0 200 200",
  showCode = true,
}: {
  className?: string;
  animated?: boolean;
  idPrefix?: string;
  viewBox?: string;
  showCode?: boolean;
}) {
  const uid = idPrefix;
  const hair = `hair-${uid}`;
  const skin = `skin-${uid}`;
  const hoodie = `hoodie-${uid}`;
  const iris = `iris-${uid}`;

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label="Len, maskot LeCode"
      className={className}
    >
      <defs>
        <linearGradient id={hair} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#453579" />
          <stop offset="45%" stopColor="#382b66" />
          <stop offset="100%" stopColor="#241c47" />
        </linearGradient>
        <linearGradient id={skin} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9dc" />
          <stop offset="100%" stopColor="#ffd3bd" />
        </linearGradient>
        <linearGradient id={hoodie} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b6cff" />
          <stop offset="100%" stopColor="#5a3fd6" />
        </linearGradient>
        <linearGradient id={iris} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#17c3d8" />
          <stop offset="55%" stopColor="#3d7bf5" />
          <stop offset="100%" stopColor="#6d4cf1" />
        </linearGradient>
      </defs>

      {/* Rambut belakang */}
      <g>
        <ellipse cx="100" cy="96" rx="49" ry="52" fill={`url(#${hair})`} />
        <path d="M52 96c-4 20-2 36 6 52 3 6 9 10 16 12l-6-24c-5-12-6-26-4-40z" fill={`url(#${hair})`} />
        <path d="M148 96c4 20 2 36-6 52-3 6-9 10-16 12l6-24c5-12 6-26 4-40z" fill={`url(#${hair})`} />
      </g>

      {/* Badan / hoodie */}
      <path
        d="M100 140c-17 0-29 11-33 26l-5 26h76l-5-26c-4-15-16-26-33-26z"
        fill={`url(#${hoodie})`}
      />
      <path d="M74 160c8 6 17 9 26 9s18-3 26-9l-4-9c-7 5-14 7-22 7s-15-2-22-7z" fill="#ffffff" opacity="0.14" />
      <path d="M92 148v10M108 148v10" stroke="#c9b8ff" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      {showCode && (
        <text
          x="100"
          y="185"
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize="13"
          fontWeight="700"
          fill="#ffffff"
          opacity="0.82"
        >
          &lt;/&gt;
        </text>
      )}

      {/* Leher */}
      <path d="M91 128h18v16c0 5-18 5-18 0z" fill="#f7bda6" />

      {/* Wajah */}
      <ellipse cx="100" cy="99" rx="37" ry="39" fill={`url(#${skin})`} />
      <path d="M100 138c11 0 20-5 25-14-6 6-15 9-25 9s-19-3-25-9c5 9 14 14 25 14z" fill="#f3b39c" opacity="0.55" />

      {/* Telinga */}
      <ellipse cx="63" cy="104" rx="5" ry="7" fill="#ffd8c5" />
      <ellipse cx="137" cy="104" rx="5" ry="7" fill="#ffd8c5" />

      {/* Poni */}
      <path
        d="M63 90c0-34 16-50 37-50s37 16 37 50c-8-14-17-22-25-24-8-2-16-2-24 0-8 2-17 10-25 24z"
        fill={`url(#${hair})`}
      />
      <g fill={`url(#${hair})`}>
        <path d="M92 64c4 12 6 22 8 33 2-11 4-21 8-33z" />
        <path d="M76 68c6 10 10 18 12 26 4-12 8-22 10-28z" />
        <path d="M124 68c-6 10-10 18-12 26-4-12-8-22-10-28z" />
      </g>
      <path
        d="M74 58c8-10 20-14 32-13-10 4-20 9-26 17z"
        fill="#8a72cc"
        opacity="0.34"
      />

      {/* Antena rambut */}
      <path d="M104 40c3-11 12-16 19-16-7 5-10 11-11 17" fill="none" stroke="#4a3a82" strokeWidth="4" strokeLinecap="round" />

      {/* Alis */}
      <path d="M78 89c4-3 9-3 13-1M109 88c4-2 9-2 13 1" stroke="#3a2c63" strokeWidth="2.6" strokeLinecap="round" fill="none" />

      {/* Mata */}
      <g className="animate-blink" style={{ transformOrigin: "100px 103px" }}>
        <g>
          <ellipse cx="84" cy="103" rx="10.5" ry="12.5" fill="#fffdfb" />
          <ellipse cx="84" cy="104" rx="8.4" ry="10.2" fill={`url(#${iris})`} />
          <ellipse cx="84" cy="105" rx="4" ry="5.6" fill="#151233" />
          <circle cx="80.6" cy="99.6" r="3.1" fill="#ffffff" />
          <circle cx="87" cy="108" r="1.5" fill="#ffffff" opacity="0.75" />
          <path d="M73 98c4-6 10-8 16-6" stroke="#2a2050" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </g>
        <g>
          <ellipse cx="116" cy="103" rx="10.5" ry="12.5" fill="#fffdfb" />
          <ellipse cx="116" cy="104" rx="8.4" ry="10.2" fill={`url(#${iris})`} />
          <ellipse cx="116" cy="105" rx="4" ry="5.6" fill="#151233" />
          <circle cx="112.6" cy="99.6" r="3.1" fill="#ffffff" />
          <circle cx="119" cy="108" r="1.5" fill="#ffffff" opacity="0.75" />
          <path d="M105 98c4-6 10-8 16-6" stroke="#2a2050" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </g>
      </g>

      {/* Pipi merona */}
      <ellipse cx="72" cy="115" rx="6.4" ry="3.4" fill="#ff9db1" opacity="0.42" />
      <ellipse cx="128" cy="115" rx="6.4" ry="3.4" fill="#ff9db1" opacity="0.42" />

      {/* Hidung & mulut */}
      <path d="M100 110q2 3 0 4" stroke="#d9917c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M95 121q5 5 10 0" stroke="#a8465c" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Headphone */}
      <path d="M56 88C56 52 74 33 100 33s44 19 44 55" fill="none" stroke="#3d2f70" strokeWidth="7" strokeLinecap="round" />
      <path d="M56 88C56 52 74 33 100 33s44 19 44 55" fill="none" stroke="#8b6cff" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
      <rect x="44" y="82" width="17" height="30" rx="8.5" fill="#4a3a82" />
      <rect x="139" y="82" width="17" height="30" rx="8.5" fill="#4a3a82" />
      <circle cx="52.5" cy="97" r="5" fill="#22d3ee" />
      <circle cx="147.5" cy="97" r="5" fill="#22d3ee" />
      <circle cx="52.5" cy="97" r="9" fill="#22d3ee" opacity="0.2" />
      <circle cx="147.5" cy="97" r="9" fill="#22d3ee" opacity="0.2" />

      {/* Jepitan rambut "</>" */}
      <g transform="translate(126 62) rotate(12)">
        <rect x="-13" y="-6" width="26" height="12" rx="6" fill="#22d3ee" />
        <path d="M-4 1l-3 0-2 2 2 2 3 0M1 5l3 0 2-2-2-2-3 0" stroke="#0b1023" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.85" />
      </g>
    </svg>
  );
}

export function MascotAvatar({ className, bubble = false }: { className?: string; bubble?: boolean }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className="grid h-full w-full place-items-center overflow-hidden rounded-full border border-border bg-surface-2">
        <Mascot animated={false} idPrefix="avatar" viewBox="54 30 92 92" className="h-full w-full" showCode={false} />
      </span>
      {bubble && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-emerald-500" />
      )}
    </span>
  );
}
