// The hextech backdrop (navy depths, magic glow, star field) is applied
// globally via html::before/::after in globals.css. This wrapper remains for
// pages that composed with <MagicalBackground> (not-found, global-error).

interface MagicalBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function MagicalBackground({
  children,
  className = '',
}: MagicalBackgroundProps) {
  return (
    <div className={`relative min-h-screen w-full ${className}`}>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
