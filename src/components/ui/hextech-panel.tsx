import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PanelAccent = 'default' | 'elevated' | 'magic';

const ACCENT_CLASS: Record<PanelAccent, string> = {
  default: 'hex-card',
  elevated: 'hex-card-elevated',
  magic: 'hex-card-magic',
};

const CORNER_COLOR: Record<PanelAccent, string> = {
  default: 'border-hx-gold',
  elevated: 'border-hx-gold-bright',
  magic: 'border-hx-magic',
};

interface HextechPanelProps {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  accent?: PanelAccent;
  /** Render the four gold corner studs. */
  corners?: boolean;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
  id?: string;
}

/**
 * Ornate LoL-client panel: framed plate, four corner studs, optional
 * engraved header row with icon/action slots.
 */
export function HextechPanel({
  title,
  icon,
  action,
  accent = 'default',
  corners = true,
  className,
  contentClassName,
  children,
  id,
}: HextechPanelProps) {
  const cornerColor = CORNER_COLOR[accent];
  return (
    <section
      id={id}
      className={cn(
        ACCENT_CLASS[accent],
        'relative scroll-mt-24 rounded-sm',
        className
      )}
    >
      {corners && (
        <>
          <i
            aria-hidden
            className={cn(
              'pointer-events-none absolute -top-px -left-px z-[1] h-3.5 w-3.5 border-t-2 border-l-2',
              cornerColor
            )}
          />
          <i
            aria-hidden
            className={cn(
              'pointer-events-none absolute -top-px -right-px z-[1] h-3.5 w-3.5 border-t-2 border-r-2',
              cornerColor
            )}
          />
          <i
            aria-hidden
            className={cn(
              'pointer-events-none absolute -bottom-px -left-px z-[1] h-3.5 w-3.5 border-b-2 border-l-2',
              cornerColor
            )}
          />
          <i
            aria-hidden
            className={cn(
              'pointer-events-none absolute -right-px -bottom-px z-[1] h-3.5 w-3.5 border-r-2 border-b-2',
              cornerColor
            )}
          />
        </>
      )}
      {title !== undefined && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hx-gold-dark/40 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <span className="shrink-0 text-hx-gold">{icon}</span>}
            <h2 className="truncate hex-title text-sm text-hx-gold sm:text-base">
              {title}
            </h2>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('p-4 sm:p-5', contentClassName)}>{children}</div>
    </section>
  );
}

interface OrnateHeadingProps {
  children: ReactNode;
  /** Small gold caps line above the heading. */
  eyebrow?: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

/** Section heading flanked by fading gold rules and diamond studs. */
export function OrnateHeading({
  children,
  eyebrow,
  className,
  as: Tag = 'h2',
}: OrnateHeadingProps) {
  return (
    <div className={cn('text-center', className)}>
      {eyebrow && <p className="mb-2 hex-label">{eyebrow}</p>}
      <div className="flex items-center justify-center gap-4">
        <span className="hex-divider w-16 sm:w-28" aria-hidden />
        <span className="hex-diamond shrink-0" aria-hidden />
        <Tag className="hex-title text-xl tracking-[0.1em] sm:text-2xl">
          {children}
        </Tag>
        <span className="hex-diamond shrink-0" aria-hidden />
        <span className="hex-divider w-16 sm:w-28" aria-hidden />
      </div>
    </div>
  );
}
