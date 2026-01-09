'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  LogOut,
  Package,
  Sparkles,
  Target,
  Users,
  Database,
  Settings,
  FileText,
  RefreshCw,
} from 'lucide-react';

// Placeholder data - will be replaced with Convex queries when connected
interface ScrapeJob {
  _id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Placeholder counts - replace with Convex queries when connected
  const itemsCount = 0;
  const runesCount = 0;
  const skillOrdersCount = 0;
  const matchupsCount = 0;
  const scrapeJobs: ScrapeJob[] = [];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const stats = [
    {
      title: 'Items',
      value: itemsCount,
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      href: '/admin/items',
    },
    {
      title: 'Rune Pages',
      value: runesCount,
      icon: Sparkles,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      href: '/admin/runes',
    },
    {
      title: 'Skill Orders',
      value: skillOrdersCount,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      href: '/admin/skills',
    },
    {
      title: 'Matchups',
      value: matchupsCount,
      icon: Users,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      href: '/admin/matchups',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 text-white/60">
              Welcome back, <span className="text-purple-300">{user?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-purple-400/40 text-purple-300">
              {user?.role}
            </Badge>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/" className="block">
            <Card className="cursor-pointer border-white/10 bg-black/30 transition-colors hover:bg-black/40">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-purple-500/20 p-3">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">View Guide</div>
                  <div className="text-sm text-white/60">See live guide</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/scraper" className="block">
            <Card className="cursor-pointer border-white/10 bg-black/30 transition-colors hover:bg-black/40">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-blue-500/20 p-3">
                  <Database className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Data Scraper</div>
                  <div className="text-sm text-white/60">Fetch external data</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/settings" className="block">
            <Card className="cursor-pointer border-white/10 bg-black/30 transition-colors hover:bg-black/40">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-green-500/20 p-3">
                  <Settings className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Settings</div>
                  <div className="text-sm text-white/60">Configure guide</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/users" className="block">
            <Card className="cursor-pointer border-white/10 bg-black/30 transition-colors hover:bg-black/40">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-yellow-500/20 p-3">
                  <Users className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Users</div>
                  <div className="text-sm text-white/60">Manage access</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href} className="block">
              <Card className="cursor-pointer border-white/10 bg-black/30 transition-colors hover:bg-black/40">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">{stat.title}</p>
                      <p className="mt-1 text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`rounded-lg ${stat.bgColor} p-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Scrape Jobs */}
        <Card className="border-white/10 bg-black/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <RefreshCw className="h-5 w-5" />
              Recent Scrape Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scrapeJobs && scrapeJobs.length > 0 ? (
              <div className="space-y-3">
                {scrapeJobs.map((job) => (
                  <div
                    key={job._id}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`border ${
                          job.status === 'completed'
                            ? 'border-green-400 text-green-300'
                            : job.status === 'running'
                              ? 'border-blue-400 text-blue-300'
                              : job.status === 'failed'
                                ? 'border-red-400 text-red-300'
                                : 'border-yellow-400 text-yellow-300'
                        }`}
                      >
                        {job.status}
                      </Badge>
                      <span className="font-medium text-white">{job.source}</span>
                    </div>
                    <div className="text-sm text-white/60">
                      {job.completedAt
                        ? new Date(job.completedAt).toLocaleString()
                        : job.startedAt
                          ? 'In progress...'
                          : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/60">
                No scrape jobs yet. Go to Data Scraper to fetch data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
