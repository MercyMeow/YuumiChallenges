'use client';

// Tab panels for the builds editor dialog. Each takes the shared form state and
// owns any state that is local to it (the Items tab's draft item, the Skills
// tab's per-level edits), keeping page.tsx focused on the list + dialog shell.

import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ItemSlot } from '@/components/match-history/item-slots';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  ICONS,
  KEYSTONES,
  RUNE_TREES,
  type BuildFormData,
  type ItemCategory,
  type NewItemState,
} from './build-form';

type SetForm = Dispatch<SetStateAction<BuildFormData>>;

const SKILL_CAPS = { Q: 5, W: 5, E: 5, R: 3 } as const;
type SkillKey = keyof typeof SKILL_CAPS;

/** Split comma-separated admin input, dropping empty tokens from trailing commas. */
function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True when assigning `skill` at `index` would stay within rank caps. */
function canAssignSkill(levels: string[], index: number, skill: string): boolean {
  if (!(skill in SKILL_CAPS)) return false;
  const counts: Record<SkillKey, number> = { Q: 0, W: 0, E: 0, R: 0 };
  levels.forEach((s, i) => {
    if (i !== index && s in counts) counts[s as SkillKey]++;
  });
  return counts[skill as SkillKey] < SKILL_CAPS[skill as SkillKey];
}

/** Shared hextech styling for form controls in the editor. */
const FIELD_CLASS = 'hex-input rounded-sm';

/** Label + control stacked with the standard spacing. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function BuildGeneralTab({
  formData,
  setFormData,
}: {
  formData: BuildFormData;
  setFormData: SetForm;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Build Name">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={FIELD_CLASS}
            placeholder="e.g., Standard Aery"
            required
          />
        </Field>
        <Field label="Priority (lower = first)">
          <Input
            type="number"
            value={formData.priority}
            onChange={(e) =>
              setFormData({
                ...formData,
                priority: parseInt(e.target.value) || 0,
              })
            }
            className={FIELD_CLASS}
          />
        </Field>
      </div>
      <Field label="Description">
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className={FIELD_CLASS}
          rows={2}
          placeholder="Brief description of when to use this build..."
          required
        />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Icon">
          <Select
            value={formData.icon}
            onValueChange={(v) => setFormData({ ...formData, icon: v })}
          >
            <SelectTrigger className={FIELD_CLASS}>
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
        </Field>
        <Field label="Color Class">
          <Input
            value={formData.color}
            onChange={(e) =>
              setFormData({ ...formData, color: e.target.value })
            }
            className={FIELD_CLASS}
            placeholder="bg-purple-500/20"
          />
        </Field>
        <Field label="Border Class">
          <Input
            value={formData.borderColor}
            onChange={(e) =>
              setFormData({ ...formData, borderColor: e.target.value })
            }
            className={FIELD_CLASS}
            placeholder="border-purple-500/50"
          />
        </Field>
      </div>
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRecommended"
            checked={formData.isRecommended}
            onChange={(e) =>
              setFormData({ ...formData, isRecommended: e.target.checked })
            }
            className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60"
          />
          <Label htmlFor="isRecommended">Recommended Build</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="rounded-sm border-hx-gold-dark/60 bg-hx-black/60"
          />
          <Label htmlFor="isActive">Active (show in guide)</Label>
        </div>
      </div>
    </div>
  );
}

export function BuildRunesTab({
  formData,
  setFormData,
}: {
  formData: BuildFormData;
  setFormData: SetForm;
}) {
  const setRunes = (patch: Partial<BuildFormData['runes']>) =>
    setFormData({ ...formData, runes: { ...formData.runes, ...patch } });

  return (
    <div className="space-y-4">
      <Field label="Rune Page Name">
        <Input
          value={formData.runes.name}
          onChange={(e) => setRunes({ name: e.target.value })}
          className={FIELD_CLASS}
          placeholder="e.g., Standard Aery"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary Tree">
          <Select
            value={formData.runes.primaryTree}
            onValueChange={(v) => {
              const secondaryTree =
                formData.runes.secondaryTree === v
                  ? (RUNE_TREES.find((t) => t !== v) ?? '')
                  : formData.runes.secondaryTree;
              setRunes({
                primaryTree: v,
                keystone: KEYSTONES[v]?.[0] ?? '',
                secondaryTree,
              });
            }}
          >
            <SelectTrigger className={FIELD_CLASS}>
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
        </Field>
        <Field label="Keystone">
          <Select
            value={formData.runes.keystone}
            onValueChange={(v) => setRunes({ keystone: v })}
          >
            <SelectTrigger className={FIELD_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(KEYSTONES[formData.runes.primaryTree] ?? []).map((keystone) => (
                <SelectItem key={keystone} value={keystone}>
                  {keystone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Primary Runes (comma-separated)">
        <Input
          value={formData.runes.primary.join(', ')}
          onChange={(e) =>
            setRunes({
              primary: splitCsv(e.target.value),
            })
          }
          className={FIELD_CLASS}
          placeholder="ManaflowBand, Transcendence, Scorch"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Secondary Tree">
          <Select
            value={formData.runes.secondaryTree}
            onValueChange={(v) => setRunes({ secondaryTree: v })}
          >
            <SelectTrigger className={FIELD_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RUNE_TREES.filter((t) => t !== formData.runes.primaryTree).map(
                (tree) => (
                  <SelectItem key={tree} value={tree}>
                    {tree}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Secondary Runes (comma-separated)">
          <Input
            value={formData.runes.secondary.join(', ')}
            onChange={(e) =>
              setRunes({
                secondary: splitCsv(e.target.value),
              })
            }
            className={FIELD_CLASS}
            placeholder="FontOfLife, Revitalize"
          />
        </Field>
      </div>
      <Field label="Stat Shards (comma-separated)">
        <Input
          value={formData.runes.shards.join(', ')}
          onChange={(e) =>
            setRunes({ shards: splitCsv(e.target.value) })
          }
          className={FIELD_CLASS}
          placeholder="AdaptiveForce, AdaptiveForce, Health"
        />
      </Field>
    </div>
  );
}

export function BuildItemsTab({
  formData,
  setFormData,
}: {
  formData: BuildFormData;
  setFormData: SetForm;
}) {
  const [newItem, setNewItem] = useState<NewItemState>({
    category: 'core',
    id: 0,
    name: '',
    reason: '',
  });

  const addItem = () => {
    if (!newItem.name || newItem.id <= 0) return;
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

  const removeItem = (category: ItemCategory, index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: prev.items[category].filter((_, i) => i !== index),
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Add Item Form */}
      <Card className="hex-card rounded-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="hex-title text-sm text-hx-gold">
            Add New Item
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={newItem.category}
                onValueChange={(v: ItemCategory) =>
                  setNewItem({ ...newItem, category: v })
                }
              >
                <SelectTrigger className={FIELD_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="situational">Situational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Item ID</Label>
              <Input
                type="number"
                value={newItem.id || ''}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  setNewItem({
                    ...newItem,
                    id:
                      Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
                  });
                }}
                className={FIELD_CLASS}
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
                className={FIELD_CLASS}
                placeholder="Item name"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addItem}
                className="btn-hextech w-full rounded-sm"
                disabled={!newItem.name || newItem.id <= 0}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
          <Input
            value={newItem.reason}
            onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
            className={FIELD_CLASS}
            placeholder="Reason for this item..."
          />
        </CardContent>
      </Card>

      {/* Item Lists */}
      {(['starter', 'core', 'situational'] as const).map((category) => (
        <div key={category} className="space-y-2">
          <Label className="capitalize">{category} Items</Label>
          {formData.items[category].length > 0 ? (
            <div className="space-y-2">
              {formData.items[category].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-sm border border-hx-gold-dark/40 bg-hx-black/40 p-3"
                >
                  <GripVertical className="h-4 w-4 text-hx-gold/60" />
                  <ItemSlot itemId={item.id} size="sm" />
                  <div className="flex-1">
                    <div className="font-medium text-hx-parchment">
                      {item.name}
                    </div>
                    <div className="text-xs text-landing-text-secondary">
                      {item.reason}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(category, idx)}
                    className="text-red-300 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-sm border border-dashed border-hx-gold-dark/40 p-4 text-center text-sm text-hx-gold/60">
              No {category} items yet
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function BuildSkillsTab({
  formData,
  setFormData,
}: {
  formData: BuildFormData;
  setFormData: SetForm;
}) {
  const setLevel = (index: number, skill: string) =>
    setFormData((prev) => ({
      ...prev,
      skillOrder: {
        ...prev.skillOrder,
        levels: prev.skillOrder.levels.map((s, i) => (i === index ? skill : s)),
      },
    }));

  return (
    <div className="space-y-4">
      <Field label="Skill Priority">
        <Input
          value={formData.skillOrder.priority}
          onChange={(e) =>
            setFormData({
              ...formData,
              skillOrder: { ...formData.skillOrder, priority: e.target.value },
            })
          }
          className={FIELD_CLASS}
          placeholder="E > W > Q"
        />
      </Field>
      <div className="space-y-2">
        <Label>Level-by-Level Order</Label>
        <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] gap-1">
          {formData.skillOrder.levels.map((skill, idx) => (
            <div key={idx} className="text-center">
              <div className="mb-1 text-xs text-hx-gold/60">{idx + 1}</div>
              <Select value={skill} onValueChange={(v) => setLevel(idx, v)}>
                <SelectTrigger className="hex-input h-8 w-full rounded-sm px-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Q', 'W', 'E'] as const).map(
                    (key) =>
                      canAssignSkill(
                        formData.skillOrder.levels,
                        idx,
                        key
                      ) && (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      )
                  )}
                  {(idx === 5 || idx === 10 || idx === 15) &&
                    canAssignSkill(formData.skillOrder.levels, idx, 'R') && (
                      <SelectItem value="R">R</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
      <Field label="Notes">
        <Textarea
          value={formData.skillOrder.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              skillOrder: { ...formData.skillOrder, notes: e.target.value },
            })
          }
          className={FIELD_CLASS}
          rows={2}
          placeholder="Any notes about skill order variations..."
        />
      </Field>
    </div>
  );
}
