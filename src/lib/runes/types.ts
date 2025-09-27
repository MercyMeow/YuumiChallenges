export type RuneTree = 'Sorcery' | 'Resolve' | 'Inspiration' | 'Domination' | 'Precision';

export type RuneSelection = {
  tree: RuneTree;
  keystone: string; // e.g., 'Summon Aery'
  primaries: string[]; // 3 primary runes from the same tree
};

export type RuneShards = {
  offense: string; // e.g., 'Ability Haste'
  flex: string; // e.g., 'Adaptive Force'
  defense: string; // e.g., 'Health'
};

export type RunePage = {
  name: string;
  patch: string;
  primary: RuneSelection;
  secondary: {
    tree: RuneTree;
    runes: string[]; // 2 runes selected in the secondary tree
  };
  shards: RuneShards;
  notes?: string;
  sources?: string[];
};

