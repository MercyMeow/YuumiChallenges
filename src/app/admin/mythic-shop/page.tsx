'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConvexAvailable } from '@/providers/ConvexProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import {
  fetchMythicRotation,
  mythicRotationSchema,
  MYTHIC_SHOP_METADATA_KEY,
  SECTION_LABELS,
  skinLoadingUrl,
  type MythicItem,
} from '@/lib/mythic-shop/rotation';

// Editor rows keep numeric fields as strings so inputs can be cleared while
// typing; values are converted and zod-validated on save.
type EditorItem = Omit<MythicItem, 'skinNum' | 'costME'> & {
  skinNum: string;
  costME: string;
};

const EMPTY_ITEM: EditorItem = {
  name: '',
  champion: '',
  skinNum: '0',
  costME: '',
  section: 'biweekly',
  kind: 'skin',
};

export default function AdminMythicShopPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, sessionToken } = useAuth();
  const convexAvailable = useConvexAvailable();

  const [items, setItems] = useState<EditorItem[]>([]);
  const [loadingRotation, setLoadingRotation] = useState(true);
  const [patch, setPatch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    fetchMythicRotation()
      .then((rotation) => {
        if (cancelled || !rotation) return;
        setItems(
          rotation.items.map((item) => ({
            ...item,
            skinNum: String(item.skinNum),
            costME: String(item.costME),
          }))
        );
        setPatch(rotation.patch ?? '');
      })
      .finally(() => {
        if (!cancelled) setLoadingRotation(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center hex-page-bg">
        <Loader2 className="h-8 w-8 animate-spin text-hx-gold" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const updateItem = (index: number, patchData: Partial<EditorItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patchData } : item))
    );
  };

  const handleSave = async () => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!sessionToken || !convexUrl) return;
    setSaving(true);
    setStatus(null);
    try {
      const rotation = mythicRotationSchema.parse({
        version: 1,
        updatedAt: Date.now(),
        ...(patch ? { patch } : {}),
        items: items
          .filter((item) => item.name.trim().length > 0)
          .map((item) => ({
            ...item,
            skinNum: Number(item.skinNum || 0),
            costME: Number(item.costME || 0),
          })),
      });
      const client = new ConvexHttpClient(convexUrl);
      await client.mutation(api.guide.setMetadata, {
        sessionToken,
        key: MYTHIC_SHOP_METADATA_KEY,
        value: JSON.stringify(rotation),
      });
      setStatus('Saved. The /mythic-shop page updates immediately.');
    } catch (error) {
      setStatus(
        error instanceof Error ? `Save failed: ${error.message}` : 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen hex-page-bg">
      <div className="container mx-auto max-w-5xl px-6 py-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-hx-gold transition-colors hover:text-hx-gold-bright"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-gradient-gold text-3xl font-black tracking-wide uppercase">
            Mythic Shop Rotation
          </h1>
          <div className="flex items-center gap-3">
            <Input
              value={patch}
              onChange={(e) => setPatch(e.target.value)}
              placeholder="Patch (e.g. 16.13)"
              className="w-36 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
            />
            <Button
              onClick={handleSave}
              disabled={saving || !convexAvailable}
              className="btn-hextech rounded-sm"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Rotation
            </Button>
          </div>
        </div>

        {!convexAvailable && (
          <Card className="mb-6 rounded-sm border-yellow-400/40 bg-hx-black/60">
            <CardContent className="p-4 text-sm text-yellow-300">
              Convex is not configured (NEXT_PUBLIC_CONVEX_URL missing), so
              saving is disabled.
            </CardContent>
          </Card>
        )}
        {status && (
          <Card className="hex-card mb-6 rounded-sm border-0">
            <CardContent className="p-4 text-sm text-landing-text-secondary">
              {status}
            </CardContent>
          </Card>
        )}

        <Card className="hex-card-elevated hex-corners rounded-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-hx-gold">Items</CardTitle>
            <Button
              variant="outline"
              onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
              className="rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRotation && (
              <p className="flex items-center justify-center gap-2 text-sm text-hx-gold/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading current rotation…
              </p>
            )}
            {!loadingRotation && items.length === 0 && (
              <p className="text-center text-sm text-hx-gold/60">
                No items yet. Add the current rotation — champion is the Data
                Dragon id (e.g. MissFortune), skin # is the splash number.
              </p>
            )}
            {items.map((item, index) => {
              const art = skinLoadingUrl({
                ...item,
                skinNum: Number(item.skinNum || 0),
                costME: 0,
              });
              return (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-3 rounded-sm border border-hx-gold-dark/40 bg-hx-black/40 p-3"
                >
                  {art && item.name ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny admin preview, remote skin art
                    <img
                      src={art}
                      alt={item.name}
                      className="h-16 w-9 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="h-16 w-9 rounded-sm bg-hx-black/60" />
                  )}
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      updateItem(index, { name: e.target.value })
                    }
                    placeholder="Display name"
                    className="w-48 flex-1 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                  />
                  <Input
                    value={item.champion}
                    onChange={(e) =>
                      updateItem(index, { champion: e.target.value })
                    }
                    placeholder="Champion id"
                    className="w-36 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                  />
                  <Input
                    type="number"
                    value={item.skinNum}
                    onChange={(e) =>
                      updateItem(index, { skinNum: e.target.value })
                    }
                    placeholder="Skin #"
                    className="w-24 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                  />
                  <Input
                    type="number"
                    value={item.costME}
                    onChange={(e) =>
                      updateItem(index, { costME: e.target.value })
                    }
                    placeholder="ME"
                    className="w-24 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                  />
                  <Select
                    value={item.section}
                    onValueChange={(value) =>
                      updateItem(index, {
                        section: value as MythicItem['section'],
                      })
                    }
                  >
                    <SelectTrigger className="w-32 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SECTION_LABELS).map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={item.kind}
                    onValueChange={(value) =>
                      updateItem(index, { kind: value as MythicItem['kind'] })
                    }
                  >
                    <SelectTrigger className="w-32 rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skin">Skin</SelectItem>
                      <SelectItem value="chroma">Chroma</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-red-300 hover:bg-red-500/10"
                    aria-label={`Remove ${item.name || 'item'}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
