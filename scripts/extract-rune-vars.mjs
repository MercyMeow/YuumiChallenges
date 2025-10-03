import https from 'https';

const url =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Request failed with status ${res.statusCode}`));
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function extractVars(perk) {
  const result = [];
  if (!Array.isArray(perk.endOfGameStatDescs)) return result;
  for (const desc of perk.endOfGameStatDescs) {
    if (typeof desc !== 'string') continue;
    const regex = /(.*?):\s*@eogvar(\d)@/gi;
    let match;
    while ((match = regex.exec(desc))) {
      const label = match[1]
        .trim()
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ');
      const varIndex = Number(match[2]);
      result[varIndex - 1] = label;
    }
  }
  return result;
}

function formatOutput(perk, labels) {
  return {
    id: perk.id,
    name: perk.name,
    labels: labels,
  };
}

const perkIdsOfInterest = [
  8005, 8008, 8021, 8010, 9101, 9111, 8009, 9104, 9105, 9103, 8014, 8017, 8299,
  8112, 8124, 8128, 9923, 8126, 8139, 8143, 8136, 8120, 8138, 8135, 8134, 8105,
  8106, 8214, 8229, 8230, 8224, 8226, 8275, 8210, 8234, 8233, 8237, 8232, 8236,
  8437, 8439, 8465, 8446, 8463, 8401, 8429, 8444, 8473, 8451, 8453, 8242, 8351,
  8360, 8369, 8306, 8304, 8313, 8321, 8316, 8345, 8347, 8410, 8352,
];

const formatTypeHints = {
  damage: ['Damage', 'Bonus Damage', 'Damage Dealt'],
  healing: ['Healing', 'Health Restored', 'Healing Done', 'Heal'],
  shielding: ['Shield', 'Shielding'],
  gold: ['Gold'],
  time: [
    'Time',
    'Cooldown Remaining',
    'Uptime',
    'Duration',
    'Seconds',
    'Minutes',
    'Hours',
    'Active',
  ],
  count: [
    'Procs',
    'Times',
    'Stacks',
    'Souls',
    'Uses',
    'Wards',
    'Poros',
    'Enemies Spotted',
    'Attacks',
    'Activations',
    'Mementos',
    'Items Gained',
    'Instant health restored',
    'Deep Wards',
    'Move Speed Increase',
  ],
  value: [
    'Mana',
    'Armor',
    'Magic Resist',
    'Max Health',
    'Adaptive Force',
    'Item Haste',
    'Summoner Haste',
    'Attack Speed',
    'Life Steal',
    'Ability Haste',
    'Swaps',
  ],
  cdr: ['Cooldown Reduced', 'Ability Haste', 'Ultimate Haste'],
  percent: ['%'],
};

function inferFormat(label) {
  const plain = label.toLowerCase();
  if (plain.includes('gold')) return 'gold';
  if (plain.includes('shield')) return 'shielding';
  if (plain.includes('heal')) return 'healing';
  if (plain.includes('damage')) return 'damage';
  if (
    plain.includes('time') ||
    plain.includes('seconds') ||
    plain.includes('uptime') ||
    plain.includes('duration') ||
    plain.includes('minutes')
  )
    return 'time';
  if (plain.includes('mana')) return 'value';
  if (
    plain.includes('armor') ||
    plain.includes('magic resist') ||
    plain.includes('max health') ||
    plain.includes('adaptive') ||
    plain.includes('attack speed') ||
    plain.includes('life steal') ||
    plain.includes('item haste') ||
    plain.includes('summoner haste') ||
    plain.includes('ability haste') ||
    plain.includes('resist')
  )
    return 'value';
  if (plain.includes('%')) return 'percent';
  if (
    plain.match(
      /(procs|times|stacks|souls|uses|wards|poros|enemies|attacks|activations|mementos|items gained|deep wards|hexflashed|swapped|biscuits received)/
    )
  )
    return 'count';
  if (plain.includes('cooldown reduced') || plain.includes('ultimate haste'))
    return 'cdr';
  return 'value';
}

(async () => {
  try {
    const perks = await fetchJson(url);
    const outputs = [];
    for (const perk of perks) {
      if (!perkIdsOfInterest.includes(perk.id)) continue;
      const labels = extractVars(perk);
      outputs.push(formatOutput(perk, labels));
    }

    const summary = outputs.map(({ id, name, labels }) => ({
      id,
      name,
      labels: labels.map((label, idx) => ({
        var: `var${idx + 1}`,
        label,
        format: label ? inferFormat(label) : null,
      })),
    }));

    console.log(JSON.stringify(summary, null, 2));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
