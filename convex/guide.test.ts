import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

async function createGuideEditorSession(t: ReturnType<typeof convexTest>) {
  const sessionToken = 'guide-editor-session';
  await t.run(async (ctx) => {
    const userId = await ctx.db.insert('users', {
      username: 'editor',
      passwordHash: 'unused-in-guide-tests',
      role: 'editor',
      createdAt: Date.now(),
    });
    await ctx.db.insert('sessions', {
      userId,
      token: sessionToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });
  });
  return sessionToken;
}

function validBuild(sessionToken: string) {
  return {
    sessionToken,
    name: 'Aery Support',
    description: 'Standard support build',
    icon: 'star',
    color: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    isRecommended: true,
    isActive: true,
    priority: 0,
    runes: {
      name: 'Aery',
      primaryTree: 'Sorcery',
      keystone: 'SummonAery',
      primary: ['ManaflowBand', 'Transcendence', 'Scorch'],
      secondaryTree: 'Resolve',
      secondary: ['FontOfLife', 'Revitalize'],
      shards: ['AdaptiveForce', 'AdaptiveForce', 'Health'],
    },
    items: {
      starter: [
        {
          id: 3850,
          name: "Spellthief's Edge",
          reason: 'Starting support item',
        },
      ],
      core: [],
      situational: [],
    },
    skillOrder: {
      priority: 'E > W > Q',
      levels: [
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
      ],
      notes: '',
    },
  };
}

describe('guide mutation validation', () => {
  it('rejects a basic-skill rank before it is available', async () => {
    const t = convexTest(schema, modules);
    const sessionToken = await createGuideEditorSession(t);
    const build = validBuild(sessionToken);
    build.skillOrder.levels = [
      'Q',
      'Q',
      'Q',
      'Q',
      'Q',
      'R',
      'E',
      'E',
      'E',
      'E',
      'R',
      'E',
      'W',
      'W',
      'W',
      'R',
      'W',
      'W',
    ];

    await expect(t.mutation(api.guide.upsertBuild, build)).rejects.toThrow(
      'Q rank 2 is not available at level 2'
    );
  });

  it('requires build-item reasons at the mutation boundary', async () => {
    const t = convexTest(schema, modules);
    const sessionToken = await createGuideEditorSession(t);
    const build = validBuild(sessionToken);
    build.items.starter[0]!.reason = '   ';

    await expect(t.mutation(api.guide.upsertBuild, build)).rejects.toThrow(
      'Starter item 1 reason is required'
    );
  });

  it('rejects unsupported public build icons', async () => {
    const t = convexTest(schema, modules);
    const sessionToken = await createGuideEditorSession(t);
    const build = validBuild(sessionToken);
    build.icon = 'wand';

    await expect(t.mutation(api.guide.upsertBuild, build)).rejects.toThrow(
      'Build icon must be one of star, shield, or zap'
    );
  });

  it('rejects a build larger than the document storage budget', async () => {
    const t = convexTest(schema, modules);
    const sessionToken = await createGuideEditorSession(t);
    const baseBuild = validBuild(sessionToken);
    const build = {
      ...baseBuild,
      items: {
        ...baseBuild.items,
        core: [
          {
            id: 6617,
            name: 'Moonstone Renewer',
            reason: 'x'.repeat(910_000),
          },
        ],
      },
    };

    await expect(t.mutation(api.guide.upsertBuild, build)).rejects.toThrow(
      'Build exceeds the 900000 byte storage budget'
    );
  });

  it('normalizes a metadata key before lookup and storage', async () => {
    const t = convexTest(schema, modules);
    const sessionToken = await createGuideEditorSession(t);
    const existingId = await t.run(async (ctx) => {
      const firstId = await ctx.db.insert('guideMetadata', {
        key: 'seasonStart',
        value: 'old',
        updatedAt: Date.now(),
      });
      await ctx.db.insert('guideMetadata', {
        key: 'seasonStart',
        value: 'duplicate',
        updatedAt: Date.now(),
      });
      return firstId;
    });

    const updatedId = await t.mutation(api.guide.setMetadata, {
      sessionToken,
      key: '  seasonStart  ',
      value: 'new',
    });

    expect(updatedId).toBe(existingId);
    const metadata = await t.run(async (ctx) => {
      return await ctx.db.query('guideMetadata').collect();
    });
    expect(metadata).toHaveLength(1);
    expect(metadata[0]).toMatchObject({
      key: 'seasonStart',
      value: 'new',
    });
  });
});
