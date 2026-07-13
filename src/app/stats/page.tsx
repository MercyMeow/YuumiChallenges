import type { Metadata } from 'next';
import { StatsClient } from './stats-client';

export const metadata: Metadata = {
  title: 'Yuumi Meta Report',
  description:
    'Duo synergies, matchup winrates, keystones and scaling curves — computed from every Master+ solo queue Yuumi game across all Riot regions, refreshed hourly.',
};

export default function StatsPage() {
  return <StatsClient />;
}
