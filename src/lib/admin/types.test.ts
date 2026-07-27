import { describe, expect, it } from 'vitest';
import {
  adminBuildPayloadSchema,
  adminDocumentIdSchema,
  adminItemPayloadSchema,
} from './types';

function validBuildPayload() {
  return {
    name: '  Aery Support  ',
    description: 'Standard support build',
    icon: 'Sparkles',
    color: 'text-blue-300',
    borderColor: 'border-blue-300',
    isRecommended: true,
    isActive: true,
    priority: 0,
    runes: {
      name: 'Aery',
      primaryTree: 'Sorcery',
      keystone: 'Summon Aery',
      primary: ['Manaflow Band', 'Transcendence', 'Scorch'],
      secondaryTree: 'Resolve',
      secondary: ['Font of Life', 'Revitalize'],
      shards: ['Ability Haste', 'Health Scaling', 'Health'],
    },
    items: {
      starter: [],
      core: [],
      situational: [],
    },
    skillOrder: {
      priority: 'E > Q > W',
      levels: [
        'e',
        'q',
        'e',
        'w',
        'e',
        'r',
        'e',
        'q',
        'e',
        'q',
        'r',
        'q',
        'q',
        'w',
        'w',
        'r',
        'w',
        'w',
      ],
      notes: '',
    },
  };
}

describe('admin API schemas', () => {
  it('normalizes valid item and build payloads', () => {
    expect(
      adminItemPayloadSchema.parse({
        name: '  Moonstone Renewer ',
        itemId: 6617,
        category: 'core',
        reason: '  Reliable healing ',
        priority: 1,
        isActive: true,
      })
    ).toEqual({
      name: 'Moonstone Renewer',
      itemId: 6617,
      category: 'core',
      reason: 'Reliable healing',
      priority: 1,
      isActive: true,
    });

    const build = adminBuildPayloadSchema.parse(validBuildPayload());
    expect(build.name).toBe('Aery Support');
    expect(build.skillOrder.levels[0]).toBe('E');
    expect(build.skillOrder.levels[5]).toBe('R');
  });

  it('rejects malformed item and nested build payloads', () => {
    expect(
      adminItemPayloadSchema.safeParse({
        name: 'Moonstone Renewer',
        itemId: '6617',
        category: 'core',
        reason: 'Reliable healing',
        priority: 1,
        isActive: true,
      }).success
    ).toBe(false);

    const malformedBuild = validBuildPayload();
    malformedBuild.runes.secondary = ['Revitalize'];
    expect(adminBuildPayloadSchema.safeParse(malformedBuild).success).toBe(
      false
    );

    const invalidSkillOrder = validBuildPayload();
    invalidSkillOrder.skillOrder.levels[0] = 'r';
    invalidSkillOrder.skillOrder.levels[5] = 'e';
    expect(adminBuildPayloadSchema.safeParse(invalidSkillOrder).success).toBe(
      false
    );
  });

  it('accepts only plausible base-32 Convex document ids', () => {
    expect(adminDocumentIdSchema.safeParse(null).success).toBe(false);
    expect(adminDocumentIdSchema.safeParse('not-a-convex-id').success).toBe(
      false
    );
    expect(adminDocumentIdSchema.safeParse('a'.repeat(32)).success).toBe(true);
  });
});
