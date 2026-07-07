import type { Metadata } from 'next';
import { GamesClient } from './games-client';

export const metadata: Metadata = {
  title: 'High Elo Yuumi Games',
  description:
    'Every Master+ solo queue Yuumi game across all Riot regions on the current and last patch, refreshed every 5 minutes.',
};

export default function GamesPage() {
  return <GamesClient />;
}
