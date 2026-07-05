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

const EMPTY_ITEM: MythicItem = {
  name: '',
  champion: '',
  skinNum: 0,
  costME: 0,
  section: 'biweekly',
  kind: 'skin',
};

export default function AdminMythicShopPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, sessionToken } = useAuth();
  const convexAvailable = useConvexAvailable();

  const [items, setItems] = useState<MythicItem[]>([]);
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
    fetchMythicRotation().then((rotation) => {
      if (cancelled || !rotation) return;
      setItems(rotation.items);
      setPatch(rotation.patch ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <Loader2 className="h-8 w-8 animate-spin text-yuumi-purple" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const updateItem = (index: number, patchData: Partial<MythicItem>) => {
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
        items: items.filter((item) => item.name.trim().length > 0),
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
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      <div className="container mx-auto max-w-5xl px-6 py-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 text-yuumi-purple transition-colors hover:text-yuumi-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="bg-gradient-to-r from-white via-yuumi-purple to-yuumi-pink bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Mythic Shop Rotation
          </h1>
          <div className="flex items-center gap-3">
            <Input
              value={patch}
              onChange={(e) => setPatch(e.target.value)}
              placeholder="Patch (e.g. 16.13)"
              className="w-36 border-white/20 bg-white/5 text-white placeholder:text-white/40"
            />
            <Button
              onClick={handleSave}
              disabled={saving || !convexAvailable}
              className="bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white transition-opacity hover:opacity-90"
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
          <Card className="mb-6 border-yellow-400/40 bg-black/30 backdrop-blur-md">
            <CardContent className="p-4 text-sm text-yellow-300">
              Convex is not configured (NEXT_PUBLIC_CONVEX_URL missing), so
              saving is disabled.
            </CardContent>
          </Card>
        )}
        {status && (
          <Card className="mb-6 border-white/10 bg-black/30 backdrop-blur-md">
            <CardContent className="p-4 text-sm text-white/80">
              {status}
            </CardContent>
          </Card>
        )}

        <Card className="border-white/10 bg-black/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Items</CardTitle>
            <Button
              variant="outline"
              onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && (
              <p className="text-center text-sm text-white/50">
                No items yet. Add the current rotation — champion is the Data
                Dragon id (e.g. MissFortune), skin # is the splash number.
              </p>
            )}
            {items.map((item, index) => {
              const art = skinLoadingUrl(item);
              return (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  {art && item.name ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny admin preview, remote skin art
                    <img
                      src={art}
                      alt={item.name}
                      className="h-16 w-9 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-9 rounded bg-black/40" />
                  )}
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      updateItem(index, { name: e.target.value })
                    }
                    placeholder="Display name"
                    className="w-48 flex-1 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                  <Input
                    value={item.champion}
                    onChange={(e) =>
                      updateItem(index, { champion: e.target.value })
                    }
                    placeholder="Champion id"
                    className="w-36 border-white/20 bg-white/5 text-white placeholder:text-white/40"
                  />
                  <Input
                    type="number"
                    value={item.skinNum}
                    onChange={(e) =>
                      updateItem(index, { skinNum: Number(e.target.value) })
                    }
                    placeholder="Skin #"
                    className="w-24 border-white/20 bg-white/5 text-white"
                  />
                  <Input
                    type="number"
                    value={item.costME}
                    onChange={(e) =>
                      updateItem(index, { costME: Number(e.target.value) })
                    }
                    placeholder="ME"
                    className="w-24 border-white/20 bg-white/5 text-white"
                  />
                  <Select
                    value={item.section}
                    onValueChange={(value) =>
                      updateItem(index, {
                        section: value as MythicItem['section'],
                      })
                    }
                  >
                    <SelectTrigger className="w-32 border-white/20 bg-white/5 text-white">
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
                    <SelectTrigger className="w-32 border-white/20 bg-white/5 text-white">
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
