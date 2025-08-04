/**
 * Example usage of the comprehensive rune data API system
 * This file demonstrates how to use all the implemented features
 */

import { 
  RuneTree, 
  RuneData, 
  RuneSelection,
  getRuneById,
  getRuneTreeById,
  getStatShardById,
  validateRuneSelection,
  STAT_SHARDS,
  STAT_SHARD_SLOTS
} from '@/lib/apis/datadragon';

// Example rune selection (common Yuumi support build)
const exampleRuneSelection: RuneSelection = {
  primaryTree: 8200, // Sorcery tree
  keystone: 8214,    // Summon Aery
  slot1: 8226,       // Manaflow Band
  slot2: 8210,       // Transcendence
  slot3: 8237,       // Scorch
  secondaryTree: 8000, // Precision tree
  secondary1: 9111,    // Triumph
  secondary2: 8014,    // Coup de Grace
  statShards: [5008, 5002, 5001] // Adaptive Force, Armor, Health
};

/**
 * Example API usage functions
 */

// 1. Fetch all rune data
export async function fetchAllRunes(): Promise<RuneTree[]> {
  try {
    const response = await fetch('/api/data-dragon/runes');
    const data = await response.json();
    
    if (data.error && !data.fallback) {
      throw new Error(data.error);
    }
    
    console.log(`Loaded ${data.treeCount} rune trees with ${data.totalRunes} total runes`);
    console.log(`Data cached: ${data.cached}, Cache age: ${data.cacheAge || 0}s`);
    
    return data.runes;
  } catch (error) {
    console.error('Failed to fetch rune data:', error);
    return [];
  }
}

// 2. Get specific rune by ID
export async function getSpecificRune(runeId: number): Promise<RuneData | null> {
  try {
    const response = await fetch('/api/data-dragon/runes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runeId, type: 'rune' })
    });
    
    const data = await response.json();
    return data.rune || null;
  } catch (error) {
    console.error('Failed to fetch specific rune:', error);
    return null;
  }
}

// 3. Get all keystone runes
export async function getAllKeystones(): Promise<unknown> {
  try {
    const response = await fetch('/api/data-dragon/runes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'keystones' })
    });
    
    const data = await response.json();
    return data.keystones || [];
  } catch (error) {
    console.error('Failed to fetch keystones:', error);
    return [];
  }
}

// 4. Validate a rune selection
export function validateYuumiRuneSelection(runeTrees: RuneTree[]): boolean {
  const isValid = validateRuneSelection(runeTrees, exampleRuneSelection);
  
  if (isValid) {
    console.log('✅ Yuumi rune selection is valid!');
  } else {
    console.log('❌ Yuumi rune selection is invalid!');
  }
  
  return isValid;
}

// 5. Get rune information for display
export function getRuneDisplayInfo(runeTrees: RuneTree[]) {
  const { primaryTree, keystone, secondaryTree, statShards } = exampleRuneSelection;
  
  // Get primary tree info
  const primaryTreeData = getRuneTreeById(runeTrees, primaryTree);
  const keystoneData = getRuneById(runeTrees, keystone);
  
  // Get secondary tree info
  const secondaryTreeData = getRuneTreeById(runeTrees, secondaryTree);
  
  // Get stat shard info
  const [offense, flex, defense] = statShards;
  const offenseShard = getStatShardById(offense);
  const flexShard = getStatShardById(flex);
  const defenseShard = getStatShardById(defense);
  
  return {
    primary: {
      tree: primaryTreeData?.name,
      keystone: keystoneData?.name,
    },
    secondary: {
      tree: secondaryTreeData?.name,
    },
    statShards: {
      offense: offenseShard?.description,
      flex: flexShard?.description,
      defense: defenseShard?.description,
    }
  };
}

// 6. Generate rune image URLs
export async function getRuneImageUrls(runeTrees: RuneTree[]) {
  const keystoneData = getRuneById(runeTrees, exampleRuneSelection.keystone);
  const primaryTreeData = getRuneTreeById(runeTrees, exampleRuneSelection.primaryTree);
  
  if (!keystoneData || !primaryTreeData) {
    return null;
  }
  
  // These would use the runeImages utility functions
  return {
    keystoneIcon: `https://ddragon.leagueoflegends.com/cdn/img/${keystoneData.icon}`,
    treeIcon: `https://ddragon.leagueoflegends.com/cdn/img/${primaryTreeData.icon}`,
  };
}

// 7. Example usage with hooks (would be used in React components)
export const runeHookUsageExample = `
// In a React component:
import { useRuneData, useRune, useKeystoneRunes } from '@/hooks/use-rune-data';

function RuneSelector() {
  const { runeTrees, loading, error } = useRuneData();
  const { rune: selectedRune } = useRune(8214); // Summon Aery
  const { keystones } = useKeystoneRunes();
  
  if (loading) return <div>Loading runes...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Use runeTrees, selectedRune, keystones in your component
  return (
    <div>
      <h2>Available Rune Trees: {runeTrees.length}</h2>
      <h2>Available Keystones: {keystones.length}</h2>
      {selectedRune && <p>Selected: {selectedRune.name}</p>}
    </div>
  );
}
`;

// 8. Stat shard examples
export function demonstrateStatShards() {
  console.log('=== Stat Shard System ===');
  
  // Show all available stat shards
  Object.values(STAT_SHARDS).forEach(shard => {
    console.log(`${shard.name} (${shard.slot}): ${shard.description}`);
  });
  
  // Show stat shard slots
  console.log('\\nStat Shard Slots:');
  console.log('Offense:', STAT_SHARD_SLOTS.offense);
  console.log('Flex:', STAT_SHARD_SLOTS.flex);
  console.log('Defense:', STAT_SHARD_SLOTS.defense);
  
  // Example stat shard selection for Yuumi
  const yuumiStatShards = exampleRuneSelection.statShards;
  console.log('\\nYuumi Stat Shard Selection:');
  yuumiStatShards.forEach((shardId, index) => {
    const shard = getStatShardById(shardId);
    const slotName = ['Offense', 'Flex', 'Defense'][index];
    console.log(`${slotName}: ${shard?.description || 'Unknown'}`);
  });
}

// 9. Complete rune build analysis
export function analyzeRuneBuild(runeTrees: RuneTree[]) {
  console.log('=== Yuumi Support Rune Build Analysis ===');
  
  const displayInfo = getRuneDisplayInfo(runeTrees);
  
  console.log(`Primary Tree: ${displayInfo.primary.tree}`);
  console.log(`Keystone: ${displayInfo.primary.keystone}`);
  console.log(`Secondary Tree: ${displayInfo.secondary.tree}`);
  console.log('Stat Shards:');
  console.log(`  • ${displayInfo.statShards.offense}`);
  console.log(`  • ${displayInfo.statShards.flex}`);
  console.log(`  • ${displayInfo.statShards.defense}`);
  
  const isValid = validateYuumiRuneSelection(runeTrees);
  console.log(`Build Validation: ${isValid ? 'Valid' : 'Invalid'}`);
  
  return {
    build: displayInfo,
    valid: isValid
  };
}

const runeSystemExamples = {
  fetchAllRunes,
  getSpecificRune,
  getAllKeystones,
  validateYuumiRuneSelection,
  getRuneDisplayInfo,
  getRuneImageUrls,
  demonstrateStatShards,
  analyzeRuneBuild,
  exampleRuneSelection
};

export default runeSystemExamples;