import { NextResponse } from 'next/server';

const DATADRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com';

interface SummonerSpell {
  id: string; // e.g., SummonerFlash
  name: string; // e.g., Flash
  description: string;
  tooltip?: string;
  key: string; // numeric id as string, e.g., '4'
  image?: { full: string };
}

type SummonerSpellMap = Record<string, SummonerSpell>;

let cachedVersion: string | null = null;
let cachedSpells: SummonerSpellMap | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getLatestVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  try {
    const res = await fetch(`${DATADRAGON_BASE_URL}/api/versions.json`, {
      cache: 'no-store',
    });
    const versions: string[] = await res.json();
    cachedVersion = versions?.[0] || '15.18.1';
  } catch {
    cachedVersion = '15.18.1';
  }
  return cachedVersion;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedSpells && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ spells: cachedSpells, cached: true });
    }

    const version = await getLatestVersion();
    const url = `${DATADRAGON_BASE_URL}/cdn/${version}/data/en_US/summoner.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok)
      throw new Error(`Failed to fetch summoner spells: ${res.status}`);
    const data = await res.json();
    const spells: SummonerSpellMap = data?.data || {};
    cachedSpells = spells;
    cacheTime = now;
    return NextResponse.json({ spells, cached: false, version });
  } catch (error) {
    console.error('Error fetching summoner spells:', error);
    return NextResponse.json(
      {
        spells: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
