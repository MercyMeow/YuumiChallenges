import { z } from 'zod';

export type AdminRole = 'admin' | 'editor';

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
}

export interface AdminBuildItem {
  id: number;
  name: string;
  reason: string;
}

export interface AdminBuild {
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
    starter: AdminBuildItem[];
    core: AdminBuildItem[];
    situational: AdminBuildItem[];
  };
  skillOrder: {
    priority: string;
    levels: string[];
    notes: string;
  };
  updatedAt: number;
}

export interface AdminBuildPayload extends Omit<
  AdminBuild,
  'id' | 'updatedAt'
> {
  id?: string;
}

export type AdminItemCategory = 'starter' | 'early' | 'core' | 'situational';

export interface AdminItem {
  id: string;
  name: string;
  itemId: number;
  category: AdminItemCategory;
  reason: string;
  priority: number;
  isActive: boolean;
  updatedAt: number;
}

export interface AdminItemPayload extends Omit<AdminItem, 'id' | 'updatedAt'> {
  id?: string;
}

const MAX_ADMIN_TEXT_LENGTH = 10_000;
const requiredShortTextSchema = z.string().trim().min(1).max(256);
const requiredLongTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ADMIN_TEXT_LENGTH);
const optionalLongTextSchema = z.string().trim().max(MAX_ADMIN_TEXT_LENGTH);
const prioritySchema = z.number().int().min(0).max(1_000_000);
const itemIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const buildItemSchema = z
  .object({
    id: itemIdSchema,
    name: requiredShortTextSchema,
    reason: requiredLongTextSchema,
  })
  .strict();
const skillLevelSchema = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .pipe(z.enum(['Q', 'W', 'E', 'R']));
const skillOrderSchema = z
  .object({
    priority: requiredShortTextSchema,
    levels: z.array(skillLevelSchema).length(18),
    notes: optionalLongTextSchema,
  })
  .strict()
  .superRefine(({ levels }, context) => {
    if (levels.length !== 18) {
      return;
    }

    const counts = { Q: 0, W: 0, E: 0, R: 0 };
    const ultimateIndices = new Set([5, 10, 15]);
    levels.forEach((level, index) => {
      counts[level] += 1;
      if (level === 'R' && !ultimateIndices.has(index)) {
        context.addIssue({
          code: 'custom',
          path: ['levels', index],
          message: 'Ultimate can only be assigned at levels 6, 11, and 16',
        });
      }
    });

    if (counts.R !== 3) {
      context.addIssue({
        code: 'custom',
        path: ['levels'],
        message: 'Skill order must include exactly 3 ultimate levels',
      });
    }
    if (counts.Q > 5 || counts.W > 5 || counts.E > 5) {
      context.addIssue({
        code: 'custom',
        path: ['levels'],
        message: 'Q, W, and E can each be leveled at most 5 times',
      });
    }
  });

export const adminDocumentIdSchema = z
  .string()
  .trim()
  .min(20)
  .max(64)
  .regex(/^[a-z0-9]+$/i);

export const adminItemPayloadSchema = z
  .object({
    id: adminDocumentIdSchema.optional(),
    name: requiredShortTextSchema,
    itemId: itemIdSchema,
    category: z.enum(['starter', 'early', 'core', 'situational']),
    reason: requiredLongTextSchema,
    priority: prioritySchema,
    isActive: z.boolean(),
  })
  .strict();

export const adminBuildPayloadSchema = z
  .object({
    id: adminDocumentIdSchema.optional(),
    name: requiredShortTextSchema,
    description: requiredLongTextSchema,
    icon: requiredShortTextSchema,
    color: requiredShortTextSchema,
    borderColor: requiredShortTextSchema,
    isRecommended: z.boolean(),
    isActive: z.boolean(),
    priority: prioritySchema,
    runes: z
      .object({
        name: requiredShortTextSchema,
        primaryTree: requiredShortTextSchema,
        keystone: requiredShortTextSchema,
        primary: z.array(requiredShortTextSchema).length(3),
        secondaryTree: requiredShortTextSchema,
        secondary: z.array(requiredShortTextSchema).length(2),
        shards: z.array(requiredShortTextSchema).length(3),
      })
      .strict(),
    items: z
      .object({
        starter: z.array(buildItemSchema).max(50),
        core: z.array(buildItemSchema).max(50),
        situational: z.array(buildItemSchema).max(50),
      })
      .strict(),
    skillOrder: skillOrderSchema,
  })
  .strict();
