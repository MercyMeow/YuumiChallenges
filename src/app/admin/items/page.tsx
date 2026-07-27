'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  AdminClientError,
  deleteAdminItemRequest,
  fetchAdminItemsRequest,
  saveAdminItemRequest,
} from '@/lib/admin/client';
import {
  MAX_ADMIN_PRIORITY,
  parseAdminIntegerInput,
} from '@/lib/admin/integer-input';
import type { AdminItem, AdminItemCategory } from '@/lib/admin/types';
import {
  AdminStatusBanner,
  type AdminStatusState,
} from '@/components/admin/StatusBanner';
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
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
} from 'lucide-react';
import { Skeleton, PanelSkeleton } from '@/components/ui/skeleton';

type ItemCategory = AdminItemCategory;
type GuideItemId = string;

interface ItemFormData {
  id?: GuideItemId;
  name: string;
  itemId: string;
  category: ItemCategory;
  reason: string;
  priority: string;
  isActive: boolean;
}

const initialFormData: ItemFormData = {
  name: '',
  itemId: '',
  category: 'core',
  reason: '',
  priority: '0',
  isActive: true,
};

const itemCategoryOrder: Record<ItemCategory, number> = {
  starter: 0,
  early: 1,
  core: 2,
  situational: 3,
};

function createInitialFormData(): ItemFormData {
  return { ...initialFormData };
}

function compareAdminItems(left: AdminItem, right: AdminItem): number {
  return (
    itemCategoryOrder[left.category] - itemCategoryOrder[right.category] ||
    left.priority - right.priority
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function validateItemFormData(formData: ItemFormData): string | null {
  if (!formData.name.trim()) return 'Item name is required.';
  if (
    parseAdminIntegerInput(formData.itemId, {
      minimum: 1,
    }) === null
  ) {
    return 'Item ID must be a positive integer.';
  }
  if (!formData.reason.trim()) return 'Item reason is required.';
  if (
    parseAdminIntegerInput(formData.priority, {
      minimum: 0,
      maximum: MAX_ADMIN_PRIORITY,
    }) === null
  ) {
    return 'Item priority must be a non-negative integer.';
  }
  return null;
}

function normalizeItemPayload(formData: ItemFormData) {
  const itemId = parseAdminIntegerInput(formData.itemId, { minimum: 1 });
  const priority = parseAdminIntegerInput(formData.priority, {
    minimum: 0,
    maximum: MAX_ADMIN_PRIORITY,
  });
  if (itemId === null || priority === null) {
    throw new Error('Item numeric fields must be valid integers.');
  }

  return {
    name: formData.name.trim(),
    itemId,
    category: formData.category,
    reason: formData.reason.trim(),
    priority,
    isActive: formData.isActive,
  };
}

export default function ItemsEditorPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [items, setItems] = useState<AdminItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>(
    createInitialFormData()
  );
  const [status, setStatus] = useState<AdminStatusState>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<GuideItemId | null>(null);

  const isMutating = isSubmitting || deletingId !== null;

  const getActionErrorMessage = useCallback(
    (error: unknown, fallback: string): string => {
      if (
        error instanceof AdminClientError &&
        (error.status === 401 || error.status === 403)
      ) {
        router.push('/admin/login');
        return 'Your admin session expired. Log in again.';
      }
      return getErrorMessage(error, fallback);
    },
    [router]
  );

  const refreshItems = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setIsDataLoading(true);
    try {
      const nextItems = await fetchAdminItemsRequest();
      setItems(nextItems);
    } catch (error) {
      if (
        error instanceof AdminClientError &&
        (error.status === 401 || error.status === 403)
      ) {
        setItems([]);
        router.push('/admin/login');
        return;
      }
      throw error;
    } finally {
      setIsDataLoading(false);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshItems().catch((error) => {
        setItems([]);
        setStatus({
          type: 'error',
          message: getActionErrorMessage(
            error,
            'Unable to load guide items right now.'
          ),
        });
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authLoading, getActionErrorMessage, isAuthenticated, refreshItems]);

  if (authLoading || isDataLoading) {
    return (
      <div role="status" aria-busy="true" className="min-h-screen hex-page-bg">
        <span className="sr-only">Loading items editor…</span>
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Skeleton className="mb-4 h-4 w-36" />
              <Skeleton className="h-9 w-52" />
              <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }, (_, index) => (
              <PanelSkeleton key={index}>
                <div className="p-6">
                  <Skeleton className="h-5 w-40" />
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }, (_, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3">
                        <Skeleton className="h-12 w-12 shrink-0" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-full" />
                          <div className="mt-2 flex gap-2">
                            <Skeleton className="h-7 w-14" />
                            <Skeleton className="h-7 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PanelSkeleton>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (isMutating) {
      return;
    }
    setIsDialogOpen(open);
    if (!open) {
      setSubmitError(null);
      setFormData(createInitialFormData());
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (user?.role !== 'admin' && user?.role !== 'editor') {
      const message = 'Your account is not allowed to edit guide items.';
      setSubmitError(message);
      setStatus({ type: 'error', message });
      return;
    }

    const validationError = validateItemFormData(formData);
    if (validationError) {
      setSubmitError(validationError);
      setStatus({ type: 'error', message: validationError });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setStatus({
      type: 'pending',
      message: formData.id ? 'Updating item…' : 'Creating item…',
    });

    try {
      const savedItem = await saveAdminItemRequest({
        ...normalizeItemPayload(formData),
        ...(formData.id ? { id: formData.id } : {}),
      });
      setItems((currentItems) =>
        [
          ...currentItems.filter((item) => item.id !== savedItem.id),
          savedItem,
        ].sort(compareAdminItems)
      );
      setStatus({
        type: 'success',
        message: formData.id
          ? 'Item updated successfully.'
          : 'Item created successfully.',
      });
      setIsDialogOpen(false);
      setFormData(createInitialFormData());
    } catch (error) {
      const message = getActionErrorMessage(
        error,
        'Unable to save the item right now.'
      );
      setSubmitError(message);
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: AdminItem) => {
    if (isMutating) {
      return;
    }
    setSubmitError(null);
    setFormData({
      id: item.id,
      name: item.name,
      itemId: String(item.itemId),
      category: item.category,
      reason: item.reason,
      priority: String(item.priority),
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: GuideItemId) => {
    if (isMutating) {
      return;
    }
    if (!confirm('Are you sure you want to delete this item?')) return;

    setDeletingId(id);
    setStatus({ type: 'pending', message: 'Deleting item…' });
    try {
      const deletedId = await deleteAdminItemRequest(id);
      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== deletedId)
      );
      if (formData.id === deletedId) {
        setIsDialogOpen(false);
        setFormData(createInitialFormData());
        setSubmitError(null);
      }
      setStatus({ type: 'success', message: 'Item deleted successfully.' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: getActionErrorMessage(
          error,
          'Unable to delete the item right now.'
        ),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddNew = () => {
    if (isMutating) {
      return;
    }
    setSubmitError(null);
    setFormData(createInitialFormData());
    setIsDialogOpen(true);
  };

  const groupedItems = items.reduce<Record<ItemCategory, AdminItem[]>>(
    (accumulator, item) => {
      accumulator[item.category].push(item);
      return accumulator;
    },
    { starter: [], early: [], core: [], situational: [] }
  );

  const categories: { key: ItemCategory; label: string; color: string }[] = [
    { key: 'starter', label: 'Starter Items', color: 'text-hx-gold' },
    { key: 'early', label: 'Early Game Items', color: 'text-blue-300' },
    { key: 'core', label: 'Core Items', color: 'text-green-300' },
    {
      key: 'situational',
      label: 'Situational Items',
      color: 'text-yellow-300',
    },
  ];

  return (
    <div className="min-h-screen hex-page-bg">
      <div className="container mx-auto max-w-7xl px-6 py-8 duration-500 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center text-sm text-hx-gold/60 hover:text-hx-gold-bright"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-gradient-gold text-3xl font-black tracking-wide uppercase">
              Items Editor
            </h1>
            <p className="mt-1 text-landing-text-secondary">
              Manage recommended items for the Yuumi guide
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddNew}
                className="btn-hextech rounded-sm"
                disabled={isMutating}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent
              className="hex-card rounded-sm border-0 text-hx-parchment"
              onEscapeKeyDown={(event) => {
                if (isMutating) {
                  event.preventDefault();
                }
              }}
              onInteractOutside={(event) => {
                if (isMutating) {
                  event.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>
                  {formData.id ? 'Edit Item' : 'Add New Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <AdminStatusBanner
                    status={{ type: 'error', message: submitError }}
                  />
                )}
                <div
                  className={
                    isSubmitting ? 'pointer-events-none opacity-70' : ''
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(event) =>
                          setFormData({ ...formData, name: event.target.value })
                        }
                        className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Dragon Item ID</Label>
                      <Input
                        type="number"
                        value={formData.itemId}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            itemId: event.target.value,
                          })
                        }
                        min="1"
                        step="1"
                        className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            category: value as ItemCategory,
                          })
                        }
                      >
                        <SelectTrigger className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="early">Early Game</SelectItem>
                          <SelectItem value="core">Core</SelectItem>
                          <SelectItem value="situational">
                            Situational
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority (lower = first)</Label>
                      <Input
                        type="number"
                        value={formData.priority}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            priority: event.target.value,
                          })
                        }
                        min="0"
                        max={MAX_ADMIN_PRIORITY}
                        step="1"
                        className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason / Description</Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(event) =>
                        setFormData({ ...formData, reason: event.target.value })
                      }
                      className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60 text-hx-parchment placeholder:text-hx-gold/40"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          isActive: event.target.checked,
                        })
                      }
                      className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60"
                    />
                    <Label htmlFor="isActive">Active (show in guide)</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogOpenChange(false)}
                    disabled={isMutating}
                    className="rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-hextech rounded-sm"
                    disabled={isMutating}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {status && (
          <div className="mb-6">
            <AdminStatusBanner status={status} />
          </div>
        )}

        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category.key} className="hex-card rounded-sm border-0">
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-2 hex-title ${category.color}`}
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
                        className="hex-card flex items-start gap-3 rounded-sm border-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border hover:border-hx-gold"
                      >
                        <ItemSlot itemId={item.itemId} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-hx-parchment">
                              {item.name}
                            </span>
                            {!item.isActive && (
                              <Badge
                                variant="outline"
                                className="rounded-sm border-red-400/40 text-red-300"
                              >
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-landing-text-secondary">
                            {item.reason}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                              disabled={isMutating}
                              className="h-7 rounded-sm border-hx-gold-dark/60 px-2 text-xs text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(item.id)}
                              disabled={isMutating}
                              className="h-7 rounded-sm border-red-400/40 px-2 text-xs text-red-300 hover:bg-red-500/10"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1 h-3 w-3" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-landing-text-secondary">
                    No items in this category yet.
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
