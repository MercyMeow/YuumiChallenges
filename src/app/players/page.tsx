import type { Metadata } from 'next';
import { PlayersClient } from './players-client';

export const metadata: Metadata = {
  title: 'Yuumi Ladder — Master+ Players',
  description:
    'Every Master+ solo queue Yuumi player across all Riot regions, ranked by tier and LP with season stats.',
};

export default function PlayersPage() {
  return <PlayersClient />;
}
