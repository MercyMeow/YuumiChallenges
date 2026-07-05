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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ItemSlot } from '@/components/match-history/item-slots';
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
  GripVertical,
} from 'lucide-react';

interface BuildItem {
  id: number;
  name: string;
  reason: string;
}

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

interface BuildFormData {
  id?: string;
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

const DEFAULT_SKILL_LEVELS = [
  'E',
  'W',
  'Q',
  'E',
  'E',
  'R',
  'E',
  'W',
  'E',
  'W',
  'R',
  'W',
  'W',
  'Q',
  'Q',
  'R',
  'Q',
  'Q',
];

const RUNE_TREES = [
  'Sorcery',
  'Resolve',
  'Domination',
  'Precision',
  'Inspiration',
];

const KEYSTONES: Record<string, string[]> = {
  Sorcery: ['SummonAery', 'ArcaneComet', 'PhaseRush'],
  Resolve: ['GraspOfTheUndying', 'Aftershock', 'Guardian'],
  Domination: ['Electrocute', 'Predator', 'DarkHarvest', 'HailOfBlades'],
  Precision: ['PressTheAttack', 'LethalTempo', 'FleetFootwork', 'Conqueror'],
  Inspiration: ['GlacialAugment', 'UnsealedSpellbook', 'FirstStrike'],
};

const ICONS = [
  'wand',
  'shield',
  'flame',
  'zap',
  'star',
  'heart',
  'target',
  'sparkles',
];

const initialFormData: BuildFormData = {
  name: '',
  description: '',
  icon: 'wand',
  color: 'bg-purple-500/20',
  borderColor: 'border-purple-500/50',
  isRecommended: false,
  isActive: true,
  priority: 0,
  runes: {
    name: 'New Rune Page',
    primaryTree: 'Sorcery',
    keystone: 'SummonAery',
    primary: ['ManaflowBand', 'Transcendence', 'Scorch'],
    secondaryTree: 'Resolve',
    secondary: ['FontOfLife', 'Revitalize'],
    shards: ['AdaptiveForce', 'AdaptiveForce', 'Health'],
  },
  items: {
    starter: [
      { id: 3850, name: "Spellthief's Edge", reason: 'Starting support item' },
    ],
    core: [],
    situational: [],
  },
  skillOrder: {
    priority: 'E > W > Q',
    levels: [...DEFAULT_SKILL_LEVELS],
    notes: '',
  },
};

export default function BuildsEditorPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BuildFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState('general');
  const [newItem, setNewItem] = useState<{
    category: 'starter' | 'core' | 'situational';
    id: number;
    name: string;
    reason: string;
  }>({
    category: 'core',
    id: 0,
    name: '',
    reason: '',
  });

  // Placeholder - builds will come from Convex when connected
  const builds: Build[] = [];

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

  const handleAddItem = () => {
    if (!newItem.name || !newItem.id) return;
    setFormData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [newItem.category]: [
          ...prev.items[newItem.category],
          { id: newItem.id, name: newItem.name, reason: newItem.reason },
        ],
      },
    }));
    setNewItem({ category: newItem.category, id: 0, name: '', reason: '' });
  };

  const handleRemoveItem = (
    category: 'starter' | 'core' | 'situational',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: prev.items[category].filter((_, i) => i !== index),
      },
    }));
  };

  const handleSkillLevelChange = (index: number, skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillOrder: {
        ...prev.skillOrder,
        levels: prev.skillOrder.levels.map((s, i) => (i === index ? skill : s)),
      },
    }));
  };

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
              Builds Editor
            </h1>
            <p className="mt-1 text-white/60">
              Manage complete builds (Runes + Items + Skill Order)
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white transition-opacity hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Build
          </Button>
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
                className={`border-white/10 bg-black/30 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-black/40 ${build.isRecommended ? 'ring-2 ring-yuumi-purple/50' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-lg ${build.color} p-3`}>
                        <Layers className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {build.name}
                          </h3>
                          {build.isRecommended && (
                            <Badge className="bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white">
                              <Star className="mr-1 h-3 w-3" />
                              Recommended
                            </Badge>
                          )}
                          {!build.isActive && (
                            <Badge
                              variant="outline"
                              className="border-red-400/40 text-red-300"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-white/60">
                          {build.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 text-sm text-white/40">
                            <Sparkles className="h-4 w-4" />
                            <span>{build.runes.keystone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-white/40">
                            <Package className="h-4 w-4" />
                            <span>{build.items.core.length} core items</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-white/40">
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
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(build.id)}
                        className="border-red-400/40 text-red-300 hover:bg-red-500/10"
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
            <Card className="border-white/10 bg-black/30 backdrop-blur-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="mb-4 h-12 w-12 text-white/20" />
                <p className="mb-2 text-lg font-medium text-white/60">
                  No builds yet
                </p>
                <p className="mb-4 text-sm text-white/40">
                  Connect Convex and add your first build
                </p>
                <Button
                  onClick={handleAddNew}
                  className="bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white transition-opacity hover:opacity-90"
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
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-white/10 bg-black/30 text-white backdrop-blur-md">
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
                <TabsList className="mb-4 w-full bg-black/30">
                  <TabsTrigger value="general" className="flex-1">
                    General
                  </TabsTrigger>
                  <TabsTrigger value="runes" className="flex-1">
                    Runes
                  </TabsTrigger>
                  <TabsTrigger value="items" className="flex-1">
                    Items
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="flex-1">
                    Skill Order
                  </TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Build Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                        placeholder="e.g., Standard Aery"
                        required
                      />
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
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      rows={2}
                      placeholder="Brief description of when to use this build..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(v) =>
                          setFormData({ ...formData, icon: v })
                        }
                      >
                        <SelectTrigger className="border-white/20 bg-white/5 text-white placeholder:text-white/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICONS.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color Class</Label>
                      <Input
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                        placeholder="bg-purple-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Border Class</Label>
                      <Input
                        value={formData.borderColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            borderColor: e.target.value,
                          })
                        }
                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                        placeholder="border-purple-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isRecommended"
                        checked={formData.isRecommended}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isRecommended: e.target.checked,
                          })
                        }
                        className="rounded border-white/20 bg-white/5"
                      />
                      <Label htmlFor="isRecommended">Recommended Build</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded border-white/20 bg-white/5"
                      />
                      <Label htmlFor="isActive">Active (show in guide)</Label>
                    </div>
                  </div>
                </TabsContent>

                {/* Runes Tab */}
                <TabsContent value="runes" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rune Page Name</Label>
                    <Input
                      value={formData.runes.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          runes: { ...formData.runes, name: e.target.value },
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      placeholder="e.g., Standard Aery"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Tree</Label>
                      <Select
                        value={formData.runes.primaryTree}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            runes: {
                              ...formData.runes,
                              primaryTree: v,
                              keystone: KEYSTONES[v]?.[0] ?? '',
                            },
                          })
                        }
                      >
                        <SelectTrigger className="border-white/20 bg-white/5 text-white placeholder:text-white/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RUNE_TREES.map((tree) => (
                            <SelectItem key={tree} value={tree}>
                              {tree}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Keystone</Label>
                      <Select
                        value={formData.runes.keystone}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            runes: { ...formData.runes, keystone: v },
                          })
                        }
                      >
                        <SelectTrigger className="border-white/20 bg-white/5 text-white placeholder:text-white/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(KEYSTONES[formData.runes.primaryTree] ?? []).map(
                            (keystone) => (
                              <SelectItem key={keystone} value={keystone}>
                                {keystone}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Runes (comma-separated)</Label>
                    <Input
                      value={formData.runes.primary.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          runes: {
                            ...formData.runes,
                            primary: e.target.value
                              .split(',')
                              .map((s) => s.trim()),
                          },
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      placeholder="ManaflowBand, Transcendence, Scorch"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Secondary Tree</Label>
                      <Select
                        value={formData.runes.secondaryTree}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            runes: { ...formData.runes, secondaryTree: v },
                          })
                        }
                      >
                        <SelectTrigger className="border-white/20 bg-white/5 text-white placeholder:text-white/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RUNE_TREES.filter(
                            (t) => t !== formData.runes.primaryTree
                          ).map((tree) => (
                            <SelectItem key={tree} value={tree}>
                              {tree}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Runes (comma-separated)</Label>
                      <Input
                        value={formData.runes.secondary.join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            runes: {
                              ...formData.runes,
                              secondary: e.target.value
                                .split(',')
                                .map((s) => s.trim()),
                            },
                          })
                        }
                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                        placeholder="FontOfLife, Revitalize"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stat Shards (comma-separated)</Label>
                    <Input
                      value={formData.runes.shards.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          runes: {
                            ...formData.runes,
                            shards: e.target.value
                              .split(',')
                              .map((s) => s.trim()),
                          },
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      placeholder="AdaptiveForce, AdaptiveForce, Health"
                    />
                  </div>
                </TabsContent>

                {/* Items Tab */}
                <TabsContent value="items" className="space-y-6">
                  {/* Add Item Form */}
                  <Card className="border-white/10 bg-black/30 backdrop-blur-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-white/80">
                        Add New Item
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={newItem.category}
                            onValueChange={(
                              v: 'starter' | 'core' | 'situational'
                            ) => setNewItem({ ...newItem, category: v })}
                          >
                            <SelectTrigger className="border-white/20 bg-white/5 text-white placeholder:text-white/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="starter">Starter</SelectItem>
                              <SelectItem value="core">Core</SelectItem>
                              <SelectItem value="situational">
                                Situational
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Item ID</Label>
                          <Input
                            type="number"
                            value={newItem.id || ''}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                id: parseInt(e.target.value) || 0,
                              })
                            }
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                            placeholder="3850"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={newItem.name}
                            onChange={(e) =>
                              setNewItem({ ...newItem, name: e.target.value })
                            }
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                            placeholder="Item name"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full bg-gradient-to-r from-yuumi-purple to-yuumi-blue text-white transition-opacity hover:opacity-90"
                            disabled={!newItem.name || !newItem.id}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      </div>
                      <Input
                        value={newItem.reason}
                        onChange={(e) =>
                          setNewItem({ ...newItem, reason: e.target.value })
                        }
                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                        placeholder="Reason for this item..."
                      />
                    </CardContent>
                  </Card>

                  {/* Item Lists */}
                  {(['starter', 'core', 'situational'] as const).map(
                    (category) => (
                      <div key={category} className="space-y-2">
                        <Label className="capitalize">{category} Items</Label>
                        {formData.items[category].length > 0 ? (
                          <div className="space-y-2">
                            {formData.items[category].map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                              >
                                <GripVertical className="h-4 w-4 text-white/40" />
                                <ItemSlot itemId={item.id} size="sm" />
                                <div className="flex-1">
                                  <div className="font-medium text-white">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {item.reason}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRemoveItem(category, idx)
                                  }
                                  className="text-red-300 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-lg border border-dashed border-white/20 p-4 text-center text-sm text-white/40">
                            No {category} items yet
                          </p>
                        )}
                      </div>
                    )
                  )}
                </TabsContent>

                {/* Skill Order Tab */}
                <TabsContent value="skills" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Skill Priority</Label>
                    <Input
                      value={formData.skillOrder.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          skillOrder: {
                            ...formData.skillOrder,
                            priority: e.target.value,
                          },
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      placeholder="E > W > Q"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Level-by-Level Order</Label>
                    <div className="grid-cols-18 grid gap-1">
                      {formData.skillOrder.levels.map((skill, idx) => (
                        <div key={idx} className="text-center">
                          <div className="mb-1 text-xs text-white/40">
                            {idx + 1}
                          </div>
                          <Select
                            value={skill}
                            onValueChange={(v) =>
                              handleSkillLevelChange(idx, v)
                            }
                          >
                            <SelectTrigger className="h-8 w-full border-white/20 bg-white/5 px-1 text-xs text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Q">Q</SelectItem>
                              <SelectItem value="W">W</SelectItem>
                              <SelectItem value="E">E</SelectItem>
                              {(idx === 5 || idx === 10 || idx === 15) && (
                                <SelectItem value="R">R</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.skillOrder.notes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          skillOrder: {
                            ...formData.skillOrder,
                            notes: e.target.value,
                          },
                        })
                      }
                      className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
                      rows={2}
                      placeholder="Any notes about skill order variations..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex justify-end gap-2">
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
