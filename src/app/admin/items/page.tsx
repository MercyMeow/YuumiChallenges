'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ItemSlot } from '@/components/match-history/item-slots';
import {
  Loader2,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertCircle,
} from 'lucide-react';

type ItemCategory = 'starter' | 'early' | 'core' | 'situational';

interface GuideItem {
  id: string;
  name: string;
  itemId: number;
  category: ItemCategory;
  reason: string;
  priority: number;
  isActive: boolean;
}

interface ItemFormData {
  id?: string;
  name: string;
  itemId: number;
  category: ItemCategory;
  reason: string;
  priority: number;
  isActive: boolean;
}

const initialFormData: ItemFormData = {
  name: '',
  itemId: 0,
  category: 'core',
  reason: '',
  priority: 0,
  isActive: true,
};

export default function ItemsEditorPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);

  // Placeholder - items will come from Convex when connected
  const items: GuideItem[] = [];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <Loader2 className="h-8 w-8 animate-spin text-yuumi-purple" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement with Convex when connected
    setIsDialogOpen(false);
    setFormData(initialFormData);
  };

  const handleEdit = (item: GuideItem) => {
    setFormData({
      id: item.id,
      name: item.name,
      itemId: item.itemId,
      category: item.category,
      reason: item.reason,
      priority: item.priority,
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    // TODO: Implement with Convex when connected
    console.log('Delete item:', id);
  };

  const handleAddNew = () => {
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const groupedItems = items.reduce<Record<ItemCategory, GuideItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    { starter: [], early: [], core: [], situational: [] }
  );

  const categories: { key: ItemCategory; label: string; color: string }[] = [
    { key: 'starter', label: 'Starter Items', color: 'text-purple-300' },
    { key: 'early', label: 'Early Game Items', color: 'text-blue-300' },
    { key: 'core', label: 'Core Items', color: 'text-green-300' },
    {
      key: 'situational',
      label: 'Situational Items',
      color: 'text-yellow-300',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
      <div className="container mx-auto max-w-7xl px-6 py-8 duration-500 animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="bg-gradient-to-r from-white via-yuumi-purple to-yuumi-blue bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Items Editor
            </h1>
            <p className="mt-1 text-white/60">
              Manage recommended items for the Yuumi guide
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white transition-opacity hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-black/30 text-white backdrop-blur-md">
              <DialogHeader>
                <DialogTitle>
                  {formData.id ? 'Edit Item' : 'Add New Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Dragon Item ID</Label>
                    <Input
                      type="number"
                      value={formData.itemId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          itemId: parseInt(e.target.value) || 0,
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          category: v as ItemCategory,
                        })
                      }
                    >
                      <SelectTrigger className="border-white/20 bg-white/5 text-white placeholder:text-white/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="early">Early Game</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="situational">Situational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority (lower = first)</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: parseInt(e.target.value) || 0,
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason / Description</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-white/20 bg-white/5"
                  />
                  <Label htmlFor="isActive">Active (show in guide)</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white transition-opacity hover:opacity-90"
                  >
                    Save Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Convex Connection Notice */}
        <Card className="mb-6 border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-200">Connect Convex</h4>
              <p className="mt-1 text-sm text-yellow-200/80">
                Run{' '}
                <code className="rounded bg-black/30 px-1">npx convex dev</code>{' '}
                to connect your Convex database and enable item management.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Items by Category */}
        <div className="space-y-6">
          {categories.map((category) => (
            <Card
              key={category.key}
              className="border-white/10 bg-black/30 backdrop-blur-md"
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-2 ${category.color}`}
                >
                  <Package className="h-5 w-5" />
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedItems[category.key].length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedItems[category.key].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-4 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-black/40"
                      >
                        <ItemSlot itemId={item.itemId} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {item.name}
                            </span>
                            {!item.isActive && (
                              <Badge
                                variant="outline"
                                className="border-red-400/40 text-red-300"
                              >
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-white/60">
                            {item.reason}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                              className="h-7 border-white/20 px-2 text-xs"
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(item.id)}
                              className="h-7 border-red-400/40 px-2 text-xs text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-white/60">
                    No items in this category yet. Connect Convex to add items.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
