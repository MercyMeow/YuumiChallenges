'use client';
import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RuneIcon } from '@/components/ui/rune-display';
import type {
  RuneTree as DDragonRuneTree,
  RuneData,
} from '@/lib/apis/datadragon';
import type { RunePage } from '@/lib/runes/types';
import { useRuneData } from '@/hooks/use-rune-data';

type BestRunesShape = {
  primary: {
    tree: string;
    keystone: { id: number; name: string };
    slots: { id: number; name: string }[];
  };
  secondary: {
    tree: string;
    slots: { id: number; name: string }[];
  };
  shards: { id: number; name: string }[];
};

type Props = {
  best: BestRunesShape;
  options: RunePage[]; // additional named options to resolve
};

function findRuneByName(
  runeTrees: DDragonRuneTree[],
  name: string
): RuneData | null {
  for (const tree of runeTrees) {
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        if (rune.name === name) return rune;
      }
    }
  }
  return null;
}

export default function RuneTabs({ best, options }: Props) {
  const { runeTrees, loading } = useRuneData();

  const resolved = useMemo(() => {
    const pages: { key: string; label: string; data: BestRunesShape }[] = [];

    // Best option as first tab
    pages.push({ key: 'best', label: 'Best (Recommended)', data: best });

    // Resolve additional named pages via rune names
    if (!loading && runeTrees.length) {
      for (const page of options) {
        const keystone = findRuneByName(runeTrees, page.primary.keystone);
        const primaries = page.primary.primaries
          .map((n) => findRuneByName(runeTrees, n))
          .filter(Boolean) as RuneData[];
        const secondaryRunes = page.secondary.runes
          .map((n) => findRuneByName(runeTrees, n))
          .filter(Boolean) as RuneData[];

        if (
          !keystone ||
          primaries.length !== page.primary.primaries.length ||
          secondaryRunes.length !== page.secondary.runes.length
        ) {
          // Skip pages we cannot fully resolve
          continue;
        }

        const data: BestRunesShape = {
          primary: {
            tree: page.primary.tree,
            keystone: { id: keystone.id, name: keystone.name },
            slots: primaries.map((r) => ({ id: r.id, name: r.name })),
          },
          secondary: {
            tree: page.secondary.tree,
            slots: secondaryRunes.map((r) => ({ id: r.id, name: r.name })),
          },
          shards: [
            { id: 5007, name: page.shards.offense },
            { id: 5008, name: page.shards.flex },
            { id: 5001, name: page.shards.defense },
          ],
        };

        pages.push({ key: page.name, label: page.name, data });
      }
    }

    return pages;
  }, [best, options, loading, runeTrees]);

  if (!resolved.length) return null;

  const defaultTab = resolved[0]!.key;

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4 flex-wrap">
        {resolved.map((p) => (
          <TabsTrigger key={p.key} value={p.key}>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {resolved.map((p) => (
        <TabsContent key={p.key} value={p.key} className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-purple-300">
                Primary: {p.data.primary.tree}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <RuneIcon runeId={p.data.primary.keystone.id} size="lg" />
                  <div>
                    <div className="font-medium text-white">
                      {p.data.primary.keystone.name}
                    </div>
                    <div className="text-sm text-white/70">Keystone</div>
                  </div>
                </div>
                {p.data.primary.slots.map((rune) => (
                  <div key={rune.id} className="flex items-center gap-3">
                    <RuneIcon runeId={rune.id} size="md" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {rune.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-green-300">
                Secondary: {p.data.secondary.tree}
              </h3>
              <div className="space-y-3">
                {p.data.secondary.slots.map((rune) => (
                  <div key={rune.id} className="flex items-center gap-3">
                    <RuneIcon runeId={rune.id} size="md" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {rune.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="mb-4 mt-6 text-lg font-semibold text-blue-300">
                Stat Shards
              </h3>
              <div className="flex flex-wrap gap-2">
                {p.data.shards.map((shard) => (
                  <Badge
                    key={shard.id}
                    variant="outline"
                    className="border-white/20 text-white/90"
                  >
                    {shard.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
