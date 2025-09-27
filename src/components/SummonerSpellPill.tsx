import React from 'react';

type Props = {
  name: string;
  iconSrc: string;
  selected?: boolean;
  onClick?: (() => void) | undefined;
  className?: string;
};

// Small, reusable pill used to display a summoner spell with icon and consistent styling.
// Use this for both recommended and alternate summoner spell options to ensure parity.
export default function SummonerSpellPill({
  name,
  iconSrc,
  selected = false,
  onClick,
  className = '',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={name}
      className={[
        'group inline-flex items-center gap-2 rounded-full border px-3 py-1',
        'transition-colors duration-150',
        selected
          ? 'border-blue-400 bg-blue-500/10 text-blue-300'
          : 'border-zinc-700 bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800',
        className,
      ].join(' ')}
    >
      <img
        src={iconSrc}
        alt={name}
        width={20}
        height={20}
        className="h-5 w-5 rounded"
        loading="lazy"
      />
      <span className="text-sm leading-none">{name}</span>
    </button>
  );
}
