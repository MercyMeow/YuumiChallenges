import type { Metadata } from 'next';
import { fetchProfile, parseProfileParams } from './profile-data';
import { ProfileClient } from './profile-client';

type Params = { region: string; riotId: string };

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const profile = await fetchProfile(params);
  if (!profile) {
    // Neutral fallback: covers both genuine not-found and a transient
    // Convex outage, so shared links never embed a wrong "not found" title.
    return { title: 'Yuumi Player Profile — yuumi.quest' };
  }
  const { player } = profile;
  const winrate =
    player.gamesCount > 0
      ? Math.round((player.wins / player.gamesCount) * 100)
      : 0;
  const positionPart =
    typeof player.position === 'number' && player.position > 0
      ? ` · #${player.position} Yuumi worldwide`
      : '';
  const title = `${player.gameName}#${player.tagLine} — Yuumi Player Profile`;
  const description = `${player.tier} ${player.lp} LP${positionPart} · ${player.gamesCount} games, ${winrate}% winrate this season.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProfilePage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const parsed = parseProfileParams(params.region, params.riotId);
  return <ProfileClient params={parsed} />;
}
