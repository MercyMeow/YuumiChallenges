const BASIC_SKILLS = ['Q', 'W', 'E'] as const;
const ALL_SKILLS = [...BASIC_SKILLS, 'R'] as const;
const ULTIMATE_LEVEL_INDICES = new Set([5, 10, 15]);

type Skill = (typeof ALL_SKILLS)[number];

function isSkill(value: string): value is Skill {
  return ALL_SKILLS.includes(value as Skill);
}

/**
 * Validates a complete level-by-level League skill order.
 *
 * Basic abilities unlock another rank every other champion level (ranks one
 * through five at levels 1, 3, 5, 7, and 9). Yuumi's ultimate is learned at
 * levels 6, 11, and 16.
 */
export function getSkillOrderValidationError(
  rawLevels: readonly string[]
): string | null {
  if (rawLevels.length !== 18) {
    return 'Skill order must have exactly 18 levels.';
  }

  const counts: Record<Skill, number> = { Q: 0, W: 0, E: 0, R: 0 };

  for (const [index, rawLevel] of rawLevels.entries()) {
    const skill = rawLevel.trim().toUpperCase();
    if (!isSkill(skill)) {
      return `Skill level ${index + 1} must be Q, W, E, or R.`;
    }

    counts[skill] += 1;
    if (skill === 'R') {
      if (!ULTIMATE_LEVEL_INDICES.has(index)) {
        return 'Ultimate can only be assigned at levels 6, 11, and 16.';
      }
      continue;
    }

    const championLevel = index + 1;
    const availableRanks = Math.min(5, Math.ceil(championLevel / 2));
    if (counts[skill] > availableRanks) {
      return `${skill} rank ${counts[skill]} is not available at level ${championLevel}.`;
    }
  }

  if (counts.R !== 3) {
    return 'Skill order must include exactly 3 ultimate levels.';
  }
  if (counts.Q !== 5 || counts.W !== 5 || counts.E !== 5) {
    return 'Q, W, and E must each be leveled exactly 5 times.';
  }

  return null;
}

export function canAssignSkillAtLevel(
  levels: readonly string[],
  index: number,
  skill: string
): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= levels.length) {
    return false;
  }

  const normalizedSkill = skill.trim().toUpperCase();
  if (!isSkill(normalizedSkill)) {
    return false;
  }
  if (ULTIMATE_LEVEL_INDICES.has(index)) {
    return normalizedSkill === 'R';
  }
  if (normalizedSkill === 'R') {
    return false;
  }

  const priorRanks = levels
    .slice(0, index)
    .filter((value) => value.trim().toUpperCase() === normalizedSkill).length;
  const championLevel = index + 1;
  const availableRanks = Math.min(5, Math.ceil(championLevel / 2));
  return priorRanks + 1 <= availableRanks;
}
