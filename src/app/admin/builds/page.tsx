'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  deleteAdminBuildRequest,
  fetchAdminBuildsRequest,
  saveAdminBuildRequest,
} from '@/lib/admin/client';
import { useAdminResourceEditor } from '@/hooks/use-admin-resource-editor';
import {
  MAX_ADMIN_PRIORITY,
  parseAdminIntegerInput,
} from '@/lib/admin/integer-input';
import { isAdminBuildIcon } from '@/lib/admin/build-icons';
import {
  adminBuildPayloadSchema,
  describeAdminValidationIssue,
  type AdminBuild,
} from '@/lib/admin/types';
import { AdminStatusBanner } from '@/components/admin/StatusBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Sparkles,
  Package,
  Target,
  Star,
  Loader2,
} from 'lucide-react';
import { Skeleton, PanelSkeleton } from '@/components/ui/skeleton';
import {
  initialFormData,
  type BuildFormData,
  type BuildItem,
} from './build-form';
import {
  BuildGeneralTab,
  BuildItemsTab,
  BuildRunesTab,
  BuildSkillsTab,
} from './build-form-tabs';

type BuildId = string;
type Build = AdminBuild;

function cloneBuildItems(items: BuildItem[]): BuildItem[] {
  return items.map((item) => ({ ...item }));
}

function createInitialBuildFormData(): BuildFormData {
  return {
    ...initialFormData,
    runes: {
      ...initialFormData.runes,
      primary: [...initialFormData.runes.primary],
      secondary: [...initialFormData.runes.secondary],
      shards: [...initialFormData.runes.shards],
    },
    items: {
      starter: cloneBuildItems(initialFormData.items.starter),
      core: cloneBuildItems(initialFormData.items.core),
      situational: cloneBuildItems(initialFormData.items.situational),
    },
    skillOrder: {
      ...initialFormData.skillOrder,
      levels: [...initialFormData.skillOrder.levels],
    },
  };
}

function getAdminBuildId(build: Build): string {
  return build.id;
}

function sortAdminBuilds(builds: Build[]): Build[] {
  return [...builds].sort((left, right) => left.priority - right.priority);
}

function mapBuildToFormData(build: Build): BuildFormData {
  return {
    id: build.id,
    name: build.name,
    description: build.description,
    icon: isAdminBuildIcon(build.icon) ? build.icon : 'star',
    color: build.color,
    borderColor: build.borderColor,
    isRecommended: build.isRecommended,
    isActive: build.isActive,
    priority: String(build.priority),
    runes: {
      ...build.runes,
      primary: [...build.runes.primary],
      secondary: [...build.runes.secondary],
      shards: [...build.runes.shards],
    },
    items: {
      starter: cloneBuildItems(build.items.starter),
      core: cloneBuildItems(build.items.core),
      situational: cloneBuildItems(build.items.situational),
    },
    skillOrder: {
      ...build.skillOrder,
      levels: [...build.skillOrder.levels],
    },
  };
}

function parseBuildFormData(formData: BuildFormData) {
  const priority = parseAdminIntegerInput(formData.priority, {
    minimum: 0,
    maximum: MAX_ADMIN_PRIORITY,
  });

  return adminBuildPayloadSchema.safeParse({
    name: formData.name.trim(),
    description: formData.description.trim(),
    icon: formData.icon,
    color: formData.color.trim(),
    borderColor: formData.borderColor.trim(),
    isRecommended: formData.isRecommended,
    isActive: formData.isActive,
    priority: priority ?? Number.NaN,
    runes: {
      name: formData.runes.name.trim(),
      primaryTree: formData.runes.primaryTree.trim(),
      keystone: formData.runes.keystone.trim(),
      primary: formData.runes.primary
        .map((value) => value.trim())
        .filter(Boolean),
      secondaryTree: formData.runes.secondaryTree.trim(),
      secondary: formData.runes.secondary
        .map((value) => value.trim())
        .filter(Boolean),
      shards: formData.runes.shards
        .map((value) => value.trim())
        .filter(Boolean),
    },
    items: {
      starter: cloneBuildItems(formData.items.starter).map((item) => ({
        ...item,
        name: item.name.trim(),
        reason: item.reason.trim(),
      })),
      core: cloneBuildItems(formData.items.core).map((item) => ({
        ...item,
        name: item.name.trim(),
        reason: item.reason.trim(),
      })),
      situational: cloneBuildItems(formData.items.situational).map((item) => ({
        ...item,
        name: item.name.trim(),
        reason: item.reason.trim(),
      })),
    },
    skillOrder: {
      priority: formData.skillOrder.priority.trim(),
      levels: formData.skillOrder.levels.map((value) =>
        value.trim().toUpperCase()
      ),
      notes: formData.skillOrder.notes.trim(),
    },
  });
}

export default function BuildsEditorPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BuildFormData>(
    createInitialBuildFormData()
  );
  const [activeTab, setActiveTab] = useState('general');
  const {
    authLoading,
    clearSubmitError,
    deletingId,
    isAuthenticated,
    isDataLoading,
    isMutating,
    isSubmitting,
    remove,
    reportValidationError,
    resources: builds,
    status,
    submit,
    submitError,
    user,
  } = useAdminResourceEditor<
    Build,
    Parameters<typeof saveAdminBuildRequest>[0]
  >({
    resourceName: 'build',
    fetchResources: fetchAdminBuildsRequest,
    saveResource: saveAdminBuildRequest,
    deleteResource: deleteAdminBuildRequest,
    getId: getAdminBuildId,
    sortResources: sortAdminBuilds,
  });

  if (authLoading || isDataLoading) {
    return (
      <div role="status" aria-busy="true" className="min-h-screen hex-page-bg">
        <span className="sr-only">Loading builds editor…</span>
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Skeleton className="mb-4 h-4 w-36" />
              <Skeleton className="h-9 w-56" />
              <Skeleton className="mt-2 h-4 w-80" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <PanelSkeleton key={index}>
                <div className="flex items-start justify-between p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-64" />
                      <div className="mt-3 flex flex-wrap gap-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
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
      clearSubmitError();
      setActiveTab('general');
      setFormData(createInitialBuildFormData());
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (user?.role !== 'admin' && user?.role !== 'editor') {
      const message = 'Your account is not allowed to edit guide builds.';
      reportValidationError(message);
      return;
    }

    const parsed = parseBuildFormData(formData);
    if (!parsed.success) {
      reportValidationError(
        describeAdminValidationIssue(parsed.error.issues[0]!)
      );
      return;
    }

    const result = await submit(
      {
        ...parsed.data,
        ...(formData.id ? { id: formData.id } : {}),
      },
      Boolean(formData.id)
    );
    if (result.ok) {
      setIsDialogOpen(false);
      setFormData(createInitialBuildFormData());
      setActiveTab('general');
    }
  };

  const handleEdit = (build: Build) => {
    if (isMutating) {
      return;
    }
    clearSubmitError();
    setActiveTab('general');
    setFormData(mapBuildToFormData(build));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: BuildId) => {
    if (isMutating) {
      return;
    }
    if (!confirm('Are you sure you want to delete this build?')) return;

    const result = await remove(id);
    if (result.ok) {
      const deletedId = result.value;
      if (formData.id === deletedId) {
        setIsDialogOpen(false);
        setFormData(createInitialBuildFormData());
        setActiveTab('general');
        clearSubmitError();
      }
    }
  };

  const handleAddNew = () => {
    if (isMutating) {
      return;
    }
    clearSubmitError();
    setActiveTab('general');
    setFormData(createInitialBuildFormData());
    setIsDialogOpen(true);
  };

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
              Builds Editor
            </h1>
            <p className="mt-1 text-landing-text-secondary">
              Manage complete builds (Runes + Items + Skill Order)
            </p>
          </div>
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
            Add Build
          </Button>
        </div>

        {status && (
          <div className="mb-6">
            <AdminStatusBanner status={status} />
          </div>
        )}

        <div className="space-y-4">
          {builds.length > 0 ? (
            builds.map((build) => (
              <Card
                key={build.id}
                className={`hex-card rounded-sm border-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold ${build.isRecommended ? 'ring-2 ring-hx-gold/50' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-sm ${build.color} p-3`}>
                        <Layers className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-hx-parchment">
                            {build.name}
                          </h3>
                          {build.isRecommended && (
                            <Badge className="rounded-sm border border-hx-gold/60 bg-hx-gold/15 text-hx-gold-bright">
                              <Star className="mr-1 h-3 w-3" />
                              Recommended
                            </Badge>
                          )}
                          {!build.isActive && (
                            <Badge
                              variant="outline"
                              className="rounded-sm border-red-400/40 text-red-300"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-landing-text-secondary">
                          {build.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 text-sm text-hx-gold/60">
                            <Sparkles className="h-4 w-4" />
                            <span>{build.runes.keystone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-hx-gold/60">
                            <Package className="h-4 w-4" />
                            <span>{build.items.core.length} core items</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-hx-gold/60">
                            <Target className="h-4 w-4" />
                            <span>{build.skillOrder.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(build)}
                        disabled={isMutating}
                        className="rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(build.id)}
                        disabled={isMutating}
                        className="rounded-sm border-red-400/40 text-red-300 hover:bg-red-500/10"
                      >
                        {deletingId === build.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1 h-3 w-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hex-card rounded-sm border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="mb-4 h-12 w-12 text-hx-gold/30" />
                <p className="mb-2 text-lg font-medium text-landing-text-secondary">
                  No builds yet
                </p>
                <p className="mb-4 text-sm text-hx-gold/60">
                  Create your first build to populate the live guide.
                </p>
                <Button
                  onClick={handleAddNew}
                  className="btn-hextech rounded-sm"
                  disabled={isMutating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Build
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent
            className="hex-card max-h-[90vh] max-w-4xl overflow-y-auto rounded-sm border-0 text-hx-parchment"
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
                {formData.id ? 'Edit Build' : 'Create New Build'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              {submitError && (
                <div className="mb-4">
                  <AdminStatusBanner
                    status={{ type: 'error', message: submitError }}
                  />
                </div>
              )}

              <div
                className={isSubmitting ? 'pointer-events-none opacity-70' : ''}
              >
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="mt-4"
                >
                  <TabsList className="hex-card mb-4 w-full rounded-sm p-1">
                    <TabsTrigger
                      value="general"
                      className="flex-1 rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
                    >
                      General
                    </TabsTrigger>
                    <TabsTrigger
                      value="runes"
                      className="flex-1 rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
                    >
                      Runes
                    </TabsTrigger>
                    <TabsTrigger
                      value="items"
                      className="flex-1 rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
                    >
                      Items
                    </TabsTrigger>
                    <TabsTrigger
                      value="skills"
                      className="flex-1 rounded-sm hex-title text-xs data-[state=active]:bg-hx-gold/15 data-[state=active]:text-hx-gold-bright"
                    >
                      Skill Order
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general">
                    <BuildGeneralTab
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </TabsContent>

                  <TabsContent value="runes">
                    <BuildRunesTab
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </TabsContent>

                  <TabsContent value="items">
                    <BuildItemsTab
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </TabsContent>

                  <TabsContent value="skills">
                    <BuildSkillsTab
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="mt-6 flex justify-end gap-2">
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
                  {formData.id ? 'Update Build' : 'Create Build'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
