import React from 'react';
import type { RunePage } from '../lib/runes/types';
import { getRuneIconPath } from '../lib/runes/icons';

type Props = {
  page: RunePage;
  className?: string;
};

export default function RunePageCard({ page, className = '' }: Props) {
  const renderRune = (name: string) => (
    <div key={name} className="flex items-center gap-2">
      <img src={getRuneIconPath(name)} alt={name} className="h-5 w-5" />
      <span className="text-sm text-zinc-200">{name}</span>
    </div>
  );

  return (
    <div
      className={[
        'rounded-lg border border-zinc-700 bg-zinc-900/60 p-3',
        'flex flex-col gap-3',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-100">{page.name}</h4>
        <span className="text-xs text-zinc-400">{page.patch}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium text-zinc-400">
            Primary — {page.primary.tree}
          </div>
          <div className="flex flex-col gap-2">
            {renderRune(page.primary.keystone)}
            {page.primary.primaries.map(renderRune)}
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs font-medium text-zinc-400">
            Secondary — {page.secondary.tree}
          </div>
          <div className="flex flex-col gap-2">
            {page.secondary.runes.map(renderRune)}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-400">Shards</div>
        <div className="flex flex-wrap gap-3 text-sm text-zinc-200">
          <span>Offense: {page.shards.offense}</span>
          <span>Flex: {page.shards.flex}</span>
          <span>Defense: {page.shards.defense}</span>
        </div>
      </div>

      {page.notes ? (
        <p className="text-xs text-zinc-400">{page.notes}</p>
      ) : null}
    </div>
  );
}
