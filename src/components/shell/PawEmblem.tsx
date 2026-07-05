// Brand mark: gold hex-frame diamond holding Yuumi's magic paw print.
// Pure inline SVG so it stays crisp at any size and needs no asset request.

interface PawEmblemProps {
  size?: number;
  className?: string;
}

export function PawEmblem({ size = 36, className }: PawEmblemProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="paw-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8D6A8" />
          <stop offset="55%" stopColor="#C8AA6E" />
          <stop offset="100%" stopColor="#785A28" />
        </linearGradient>
        <linearGradient id="paw-magic" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#CDFAFA" />
          <stop offset="45%" stopColor="#0AC8B9" />
          <stop offset="100%" stopColor="#9D7BEE" />
        </linearGradient>
      </defs>
      {/* outer rotated-square frame */}
      <rect
        x="6.5"
        y="6.5"
        width="35"
        height="35"
        transform="rotate(45 24 24)"
        stroke="url(#paw-gold)"
        strokeWidth="2"
        fill="#010A13"
      />
      <rect
        x="10"
        y="10"
        width="28"
        height="28"
        transform="rotate(45 24 24)"
        stroke="#785A28"
        strokeWidth="0.75"
        fill="none"
        opacity="0.8"
      />
      {/* paw print: pad + three toes, magic gradient */}
      <ellipse cx="24" cy="28.5" rx="6.2" ry="5" fill="url(#paw-magic)" />
      <circle cx="16.8" cy="22.5" r="2.6" fill="url(#paw-magic)" />
      <circle cx="24" cy="19.5" r="2.8" fill="url(#paw-magic)" />
      <circle cx="31.2" cy="22.5" r="2.6" fill="url(#paw-magic)" />
      {/* sparkle */}
      <path
        d="M33.5 12.5 L34.4 15 L37 15.9 L34.4 16.8 L33.5 19.3 L32.6 16.8 L30 15.9 L32.6 15 Z"
        fill="#F0E6D2"
        opacity="0.9"
      />
    </svg>
  );
}
