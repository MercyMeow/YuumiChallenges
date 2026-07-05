'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
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
  Loader2,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Layers,
  AlertCircle,
  Sparkles,
  Package,
  Target,
  Star,
} from 'lucide-react';
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

interface Build {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  isRecommended: boolean;
  isActive: boolean;
  priority: number;
  runes: {
    name: string;
    primaryTree: string;
    keystone: string;
    primary: string[];
    secondaryTree: string;
    secondary: string[];
    shards: string[];
  };
  items: {
    starter: BuildItem[];
    core: BuildItem[];
    situational: BuildItem[];
  };
  skillOrder: {
    priority: string;
    levels: string[];
    notes: string;
  };
}

export default function BuildsEditorPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BuildFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState('general');

  // Placeholder - builds will come from Convex when connected
  const builds: Build[] = [];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement with Convex when connected
    console.log('Submitting build:', formData);
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setActiveTab('general');
  };

  const handleEdit = (build: Build) => {
    setFormData({
      id: build.id,
      name: build.name,
      description: build.description,
      icon: build.icon,
      color: build.color,
      borderColor: build.borderColor,
      isRecommended: build.isRecommended,
      isActive: build.isActive,
      priority: build.priority,
      runes: { ...build.runes },
      items: {
        starter: [...build.items.starter],
        core: [...build.items.core],
        situational: [...build.items.situational],
      },
      skillOrder: { ...build.skillOrder },
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this build?')) return;
    // TODO: Implement with Convex when connected
    console.log('Delete build:', id);
  };

  const handleAddNew = () => {
    setFormData(initialFormData);
    setActiveTab('general');
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen hex-page-bg">
      <div className="container mx-auto max-w-7xl px-6 py-8 duration-500 animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
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
          <Button onClick={handleAddNew} className="btn-hextech rounded-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Build
          </Button>
        </div>

        {/* Convex Connection Notice */}
        <Card className="mb-6 rounded-sm border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-200">Connect Convex</h4>
              <p className="mt-1 text-sm text-yellow-200/80">
                Run{' '}
                <code className="rounded bg-black/30 px-1">npx convex dev</code>{' '}
                to connect your Convex database and enable build management.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Builds List */}
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
                        className="rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(build.id)}
                        className="rounded-sm border-red-400/40 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
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
                  Connect Convex and add your first build
                </p>
                <Button
                  onClick={handleAddNew}
                  className="btn-hextech rounded-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Build
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Build Editor Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="hex-card max-h-[90vh] max-w-4xl overflow-y-auto rounded-sm border-0 text-hx-parchment">
            <DialogHeader>
              <DialogTitle>
                {formData.id ? 'Edit Build' : 'Create New Build'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
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

                {/* General Tab */}
                <TabsContent value="general">
                  <BuildGeneralTab
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>

                {/* Runes Tab */}
                <TabsContent value="runes">
                  <BuildRunesTab
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>

                {/* Items Tab */}
                <TabsContent value="items">
                  <BuildItemsTab
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>

                {/* Skill Order Tab */}
                <TabsContent value="skills">
                  <BuildSkillsTab
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-sm border-hx-gold-dark/60 text-hx-gold hover:border-hx-gold hover:text-hx-gold-bright"
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-hextech rounded-sm">
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
