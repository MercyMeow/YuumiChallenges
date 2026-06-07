const RIOT_TAG_CLASS_MAP: Record<string, string> = {
  attention: 'attention',
  keywordmajor: 'keywordmajor',
  keywordstealth: 'keywordstealth',
  rules: 'rules',
  scale: 'scale',
  status: 'status',
  stats: 'stats',
};

const ALLOWED_TAGS = new Set([
  'b',
  'br',
  'em',
  'i',
  'li',
  'ol',
  'span',
  'strong',
  'u',
  'ul',
]);

const SAFE_CLASS_PATTERN = /^[a-z0-9_:\/\[\]\.-]+$/i;
const SAFE_COLOR_PATTERN = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

function sanitizeAttributes(tagName: string, rawAttributes: string): string {
  if (tagName !== 'span') {
    return '';
  }

  const attributes: string[] = [];
  const classMatch = rawAttributes.match(
    /(?:^|[\s/])class\s*=\s*(["'])(.*?)\1/i
  );
  const classNames = classMatch?.[2]
    ?.split(/\s+/)
    .filter((className) => SAFE_CLASS_PATTERN.test(className))
    .join(' ');

  if (classNames) {
    attributes.push(`class="${classNames}"`);
  }

  const styleMatch = rawAttributes.match(
    /(?:^|[\s/])style\s*=\s*(["'])(.*?)\1/i
  );
  const colorMatch = styleMatch?.[2]?.match(
    /^\s*color\s*:\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\s*;?\s*$/i
  );

  if (colorMatch?.[1] && SAFE_COLOR_PATTERN.test(colorMatch[1])) {
    attributes.push(`style="color: ${colorMatch[1]}"`);
  }

  return attributes.length ? ` ${attributes.join(' ')}` : '';
}

function sanitizeTag(tag: string): string {
  const closingMatch = tag.match(/^<\s*\/\s*([a-z0-9]+)\s*>$/i);
  if (closingMatch?.[1]) {
    const tagName = closingMatch[1].toLowerCase();
    return ALLOWED_TAGS.has(tagName) && tagName !== 'br' ? `</${tagName}>` : '';
  }

  const openingMatch = tag.match(/^<\s*([a-z0-9]+)([^>]*)>$/i);
  if (!openingMatch?.[1]) {
    return '';
  }

  const tagName = openingMatch[1].toLowerCase();
  if (!ALLOWED_TAGS.has(tagName)) {
    return '';
  }

  if (tagName === 'br') {
    return '<br/>';
  }

  return `<${tagName}${sanitizeAttributes(tagName, openingMatch[2] ?? '')}>`;
}

/** Sanitizes Riot/Data Dragon description HTML while preserving known display tags. */
export function sanitizeRiotHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    const customTagPattern = Object.keys(RIOT_TAG_CLASS_MAP).join('|');
    let html = input.replace(/<br\s*\/?>/gi, '<br/>');

    html = html.replace(
      new RegExp(`<(${customTagPattern})(?:\\s[^>]*)?>`, 'gi'),
      (_match, tag: string) =>
        `<span class="${RIOT_TAG_CLASS_MAP[tag.toLowerCase()]}">`
    );
    html = html.replace(
      new RegExp(`</(${customTagPattern})>`, 'gi'),
      '</span>'
    );

    return html.replace(/<[^>]*>/g, sanitizeTag);
  } catch {
    return '';
  }
}
