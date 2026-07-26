import type { Metadata } from 'next';
import { MayhemClient } from './mayhem-client';

export const metadata: Metadata = {
  title: 'ARAM Mayhem Augments',
  description:
    'Pick a champion and see the best ARAM: Mayhem augments for them, ranked from live meta data.',
};

export default function MayhemPage() {
  return <MayhemClient />;
}
