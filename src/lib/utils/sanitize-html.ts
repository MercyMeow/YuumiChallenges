const RIOT_TAG_CLASS_MAP: Record<string, string> = {
  attention: 'attention',
  keywordmajor: 'keywordmajor',
  keywordstealth: 'keywordstealth',
  rules: 'rules',
  scale: 'scale',
  status: 'status',
  stats: 'stats',
};

/** Sanitizes Riot/Data Dragon description HTML while preserving known display tags. */
export function sanitizeRiotHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    const customTagPattern = Object.keys(RIOT_TAG_CLASS_MAP).join('|');
    let html = input.replace(/<br\s*\/?>/gi, '<br/>');

    html = html.replace(
      new RegExp(`<(${customTagPattern})>`, 'gi'),
      (_match, tag: string) =>
        `<span class="${RIOT_TAG_CLASS_MAP[tag.toLowerCase()]}">`
    );
    html = html.replace(
      new RegExp(`</(${customTagPattern})>`, 'gi'),
      '</span>'
    );

    html = html.replace(
      /<(?!\/?(b|i|u|em|strong|br|ul|ol|li|span)\b)[^>]*>/gi,
      ''
    );
    html = html.replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
    html = html.replace(
      /\shref=("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi,
      ''
    );
    html = html.replace(/\sstyle=("[^"]*"|'[^']*'|[^\s>]*)/gi, '');

    return html;
  } catch {
    return '';
  }
}
