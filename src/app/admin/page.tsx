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
  Layers,
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
  const buildsCount = 0;
  const matchupsCount = 0;
  const scrapeJobs: ScrapeJob[] = [];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center hex-page-bg">
        <Loader2 className="h-8 w-8 animate-spin text-hx-gold" />
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
      title: 'Builds',
      value: buildsCount,
      icon: Layers,
      color: 'text-hx-gold',
      bgColor: 'bg-hx-gold/15',
      href: '/admin/builds',
      description: 'Runes, Items & Skills combined',
    },
    {
      title: 'Matchups',
      value: matchupsCount,
      icon: Users,
      color: 'text-hx-magic',
      bgColor: 'bg-hx-magic/15',
      href: null,
      description: 'Enemy & Ally matchups (managed in code)',
    },
  ];

  return (
    <div className="min-h-screen hex-page-bg">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-gradient-gold text-3xl font-black tracking-wide uppercase">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-landing-text-secondary">
              Welcome back,{' '}
              <span className="text-hx-gold">{user?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="rounded-sm border-hx-gold-dark bg-hx-black/60 text-hx-gold"
            >
              {user?.role}
            </Badge>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/" className="block">
            <Card className="hex-card cursor-pointer rounded-sm border-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-sm bg-hx-gold/15 p-3">
                  <FileText className="h-6 w-6 text-hx-gold" />
                </div>
                <div>
                  <div className="font-medium text-hx-parchment">
                    View Guide
                  </div>
                  <div className="text-sm text-landing-text-secondary">
                    See live guide
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/scraper" className="block">
            <Card className="hex-card cursor-pointer rounded-sm border-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-sm bg-hx-magic/15 p-3">
                  <Database className="h-6 w-6 text-hx-magic" />
                </div>
                <div>
                  <div className="font-medium text-hx-parchment">
                    Data Scraper
                  </div>
                  <div className="text-sm text-landing-text-secondary">
                    Fetch external data
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/builds" className="block">
            <Card className="hex-card cursor-pointer rounded-sm border-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-sm bg-hx-gold/15 p-3">
                  <Layers className="h-6 w-6 text-hx-gold" />
                </div>
                <div>
                  <div className="font-medium text-hx-parchment">Builds</div>
                  <div className="text-sm text-landing-text-secondary">
                    Runes, items & skills
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/items" className="block">
            <Card className="hex-card cursor-pointer rounded-sm border-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-sm bg-hx-gold/15 p-3">
                  <Settings className="h-6 w-6 text-hx-gold" />
                </div>
                <div>
                  <div className="font-medium text-hx-parchment">Items</div>
                  <div className="text-sm text-landing-text-secondary">
                    Item configuration
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {stats.map((stat) => {
            const card = (
              <Card
                className={`hex-card rounded-sm border-0 transition-all duration-200 ${
                  stat.href
                    ? 'cursor-pointer hover:-translate-y-0.5 hover:border-hx-gold'
                    : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-landing-text-secondary">
                        {stat.title}
                      </p>
                      <p className="mt-1 text-3xl font-bold text-hx-parchment">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs text-hx-gold/60">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`rounded-sm ${stat.bgColor} p-3`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            return stat.href ? (
              <Link key={stat.title} href={stat.href} className="block">
                {card}
              </Link>
            ) : (
              <div key={stat.title}>{card}</div>
            );
          })}
        </div>

        {/* Recent Scrape Jobs */}
        <Card className="hex-card-elevated hex-corners rounded-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-hx-gold">
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
                    className="flex items-center justify-between rounded-sm bg-hx-black/40 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`rounded-sm border ${
                          job.status === 'completed'
                            ? 'border-green-400/40 text-green-300'
                            : job.status === 'running'
                              ? 'border-blue-400/40 text-blue-300'
                              : job.status === 'failed'
                                ? 'border-red-400/40 text-red-300'
                                : 'border-yellow-400/40 text-yellow-300'
                        }`}
                      >
                        {job.status}
                      </Badge>
                      <span className="font-medium text-hx-parchment">
                        {job.source}
                      </span>
                    </div>
                    <div className="text-sm text-landing-text-secondary">
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
              <p className="text-center text-landing-text-secondary">
                No scrape jobs yet. Go to Data Scraper to fetch data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
