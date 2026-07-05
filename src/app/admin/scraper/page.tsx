'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  ArrowLeft,
  Play,
  RefreshCw,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';

const SOURCES = [
  { id: 'ugg', name: 'U.GG', color: 'bg-blue-500' },
  { id: 'opgg', name: 'OP.GG', color: 'bg-orange-500' },
  { id: 'lolalytics', name: 'Lolalytics', color: 'bg-green-500' },
  { id: 'mobalytics', name: 'Mobalytics', color: 'bg-purple-500' },
  { id: 'onetricks', name: 'Onetricks.gg', color: 'bg-yellow-500' },
] as const;

type Source = (typeof SOURCES)[number]['id'];

interface ScrapeJob {
  _id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  error?: string;
  recordsScraped?: number;
}

interface ScrapedData {
  _id: string;
  source: Source;
  dataType: string;
  patch: string;
  scrapedAt: number;
  winRate?: number;
  pickRate?: number;
  sampleSize?: number;
  rank?: string;
  region?: string;
}

export default function ScraperPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [selectedSource, setSelectedSource] = useState<Source | 'all'>('all');
  const [selectedDataType, setSelectedDataType] = useState<string>('all');
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());

  // Placeholder data - will be replaced with Convex when connected
  const scrapeJobs: ScrapeJob[] = [];
  const scrapedData: ScrapedData[] = [];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center hex-page-bg">
        <Loader2 className="h-8 w-8 animate-spin text-hx-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleScrape = async (source: Source | 'all') => {
    setRunningJobs((prev) => new Set(prev).add(source));
    // TODO: Implement with Convex actions when connected
    setTimeout(() => {
      setRunningJobs((prev) => {
        const next = new Set(prev);
        next.delete(source);
        return next;
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <div className="min-h-screen hex-page-bg">
      <div className="container mx-auto max-w-7xl px-6 py-8 duration-500 animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center text-sm text-hx-gold/60 hover:text-hx-gold-bright"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-gradient-gold text-3xl font-black tracking-wide uppercase">
            Data Scraper
          </h1>
          <p className="mt-1 text-landing-text-secondary">
            Fetch build data from external statistics websites
          </p>
        </div>

        <Tabs defaultValue="scrape" className="space-y-6">
          <TabsList className="hex-card rounded-sm p-1">
            <TabsTrigger
              value="scrape"
              className="rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
            >
              Scrape Data
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
            >
              Job History
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
            >
              Scraped Data
            </TabsTrigger>
          </TabsList>

          {/* Scrape Tab */}
          <TabsContent value="scrape" className="space-y-6">
            {/* Scrape All Button */}
            <Card className="hex-card rounded-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="hex-title text-lg text-hx-gold">
                      Scrape All Sources
                    </h3>
                    <p className="text-sm text-landing-text-secondary">
                      Fetch data from all supported websites at once
                    </p>
                  </div>
                  <Button
                    onClick={() => handleScrape('all')}
                    disabled={runningJobs.has('all')}
                    className="btn-hextech-magic rounded-sm"
                  >
                    {runningJobs.has('all') ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scraping...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scrape All
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Individual Sources */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SOURCES.map((source) => (
                <Card
                  key={source.id}
                  className="hex-card rounded-sm border-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${source.color}`} />
                      <h3 className="hex-title text-hx-gold">{source.name}</h3>
                    </div>
                    <p className="mb-4 text-sm text-landing-text-secondary">
                      {source.id === 'ugg' &&
                        'Champion statistics and builds from U.GG'}
                      {source.id === 'opgg' &&
                        'Korean server statistics and meta analysis'}
                      {source.id === 'lolalytics' &&
                        'Detailed win rate data and item analysis'}
                      {source.id === 'mobalytics' &&
                        'AI-powered build recommendations'}
                      {source.id === 'onetricks' &&
                        'High ELO one-trick player builds'}
                    </p>
                    <Button
                      onClick={() => handleScrape(source.id)}
                      disabled={
                        runningJobs.has(source.id) || runningJobs.has('all')
                      }
                      variant="outline"
                      className="w-full rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
                    >
                      {runningJobs.has(source.id) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Scrape
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Warning Notice */}
            <Card className="rounded-sm border-yellow-400/40 bg-yellow-500/10 backdrop-blur-md">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                <div>
                  <h4 className="font-medium text-yellow-200">
                    Important Note
                  </h4>
                  <p className="mt-1 text-sm text-yellow-200/80">
                    Web scraping should be done responsibly. These scrapers
                    fetch public data for personal use. Excessive scraping may
                    result in rate limiting or IP blocks. Use the &quot;Scrape
                    All&quot; function sparingly. Connect Convex to enable
                    scraping functionality.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="hex-card rounded-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 hex-title text-hx-gold">
                  <Clock className="h-5 w-5" />
                  Job History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scrapeJobs.length > 0 ? (
                  <div className="space-y-3">
                    {scrapeJobs.map((job) => (
                      <div
                        key={job._id}
                        className="flex items-center justify-between rounded-sm border border-hx-gold-dark/40 bg-hx-black/40 p-4"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(job.status)}
                          <div>
                            <span className="font-medium text-hx-parchment">
                              {job.source}
                            </span>
                            <Badge
                              variant="outline"
                              className={`ml-3 rounded-sm ${
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
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-landing-text-secondary">
                            {job.startedAt
                              ? new Date(job.startedAt).toLocaleString()
                              : 'Not started'}
                          </div>
                          {job.recordsScraped !== undefined && (
                            <div className="text-xs text-hx-gold/60">
                              {job.recordsScraped} records
                            </div>
                          )}
                          {job.error && (
                            <div className="text-xs text-red-400">
                              {job.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-landing-text-secondary">
                    No scrape jobs yet. Connect Convex and start by clicking
                    &quot;Scrape All&quot; above.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            {/* Filters */}
            <Card className="hex-card rounded-sm border-0">
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-landing-text-secondary" />
                  <span className="text-sm text-landing-text-secondary">
                    Filters:
                  </span>
                </div>
                <Select
                  value={selectedSource}
                  onValueChange={(v) => setSelectedSource(v as Source | 'all')}
                >
                  <SelectTrigger className="w-40 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {SOURCES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedDataType}
                  onValueChange={setSelectedDataType}
                >
                  <SelectTrigger className="w-40 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40">
                    <SelectValue placeholder="Data Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="items">Items</SelectItem>
                    <SelectItem value="runes">Runes</SelectItem>
                    <SelectItem value="skillOrder">Skill Order</SelectItem>
                    <SelectItem value="matchups">Matchups</SelectItem>
                    <SelectItem value="stats">Stats</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Data List */}
            <Card className="hex-card rounded-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 hex-title text-hx-gold">
                  <Database className="h-5 w-5" />
                  Scraped Data ({scrapedData.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scrapedData.length > 0 ? (
                  <div className="space-y-3">
                    {scrapedData.map((record) => (
                      <div
                        key={record._id}
                        className="rounded-sm border border-hx-gold-dark/40 bg-hx-black/40 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`rounded-sm ${
                                record.source === 'ugg'
                                  ? 'bg-blue-500'
                                  : record.source === 'opgg'
                                    ? 'bg-orange-500'
                                    : record.source === 'lolalytics'
                                      ? 'bg-green-500'
                                      : record.source === 'mobalytics'
                                        ? 'bg-purple-500'
                                        : 'bg-yellow-500'
                              }`}
                            >
                              {record.source}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="rounded-sm border-hx-gold-dark/60 text-hx-gold"
                            >
                              {record.dataType}
                            </Badge>
                            <span className="text-sm text-landing-text-secondary">
                              Patch {record.patch}
                            </span>
                          </div>
                          <span className="text-sm text-hx-gold/60">
                            {new Date(record.scrapedAt).toLocaleString()}
                          </span>
                        </div>
                        {record.winRate && (
                          <div className="text-sm text-landing-text-secondary">
                            Win Rate: {record.winRate.toFixed(2)}%
                            {record.pickRate &&
                              ` | Pick Rate: ${record.pickRate.toFixed(2)}%`}
                            {record.sampleSize &&
                              ` | Sample: ${record.sampleSize.toLocaleString()}`}
                          </div>
                        )}
                        {record.rank && (
                          <div className="text-xs text-hx-gold/60">
                            Rank: {record.rank}
                            {record.region && ` | Region: ${record.region}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-landing-text-secondary">
                    No scraped data found. Connect Convex and run a scrape job
                    first.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
