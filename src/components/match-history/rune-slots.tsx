'use client';

import { cn } from '@/lib/utils';

interface RuneSlotsProps {
  runes: {
    primaryStyle: number;
    subStyle: number;
    statPerks: {
      defense: number;
      flex: number;
      offense: number;
    };
    primarySelections: {
      perk: number;
      var1: number;
      var2: number;
      var3: number;
    }[];
    subSelections: {
      perk: number;
      var1: number;
      var2: number;
      var3: number;
    }[];
  };
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function RuneSlots({ runes, size = 'md', className }: RuneSlotsProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const containerClasses = {
    xs: 'gap-1',
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-2',
  };

  // Get the keystone (first primary selection)
  const keystone = runes.primarySelections[0];
  // Get the first secondary rune
  const secondaryRune = runes.subSelections[0];

  if (!keystone) {
    return null;
  }

  return (
    <div className={cn('flex items-center', containerClasses[size], className)}>
      {/* Keystone Rune */}
      <div
        className={cn(
          'rounded-full border border-yellow-500/30 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center',
          sizeClasses[size]
        )}
        title="Keystone Rune"
      >
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/RunesReforged/Keystone/${keystone.perk}/${keystone.perk}.png`}
          alt="Keystone Rune"
          className={cn('rounded-full', sizeClasses[size])}
          onError={(e) => {
            // Fallback to a default image if the rune image fails to load
            e.currentTarget.src = '/images/rune-placeholder.png';
          }}
        />
      </div>

      {/* Secondary Rune */}
      {secondaryRune && (
        <div
          className={cn(
            'rounded-full border border-blue-500/30 bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center',
            sizeClasses[size]
          )}
          title="Secondary Rune"
        >
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/RunesReforged/Precision/${secondaryRune.perk}/${secondaryRune.perk}.png`}
            alt="Secondary Rune"
            className={cn('rounded-full', sizeClasses[size])}
            onError={(e) => {
              // Try different rune tree paths as fallback
              const fallbackPaths = [
                'Domination',
                'Sorcery',
                'Resolve',
                'Inspiration'
              ];
              
              let currentSrc = e.currentTarget.src;
              let currentPath = fallbackPaths.find(path => currentSrc.includes(path));
              let currentIndex = currentPath ? fallbackPaths.indexOf(currentPath) : -1;
              
              if (currentIndex < fallbackPaths.length - 1) {
                let nextPath = fallbackPaths[currentIndex + 1];
                e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/RunesReforged/${nextPath}/${secondaryRune.perk}/${secondaryRune.perk}.png`;
              } else {
                e.currentTarget.src = '/images/rune-placeholder.png';
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

export default RuneSlots;