export interface DiscordEmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedFooter {
  text: string;
  icon_url?: string;
}

export interface DiscordEmbedImage {
  url: string;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  url?: string;
  color?: number;
  author?: DiscordEmbedAuthor;
  thumbnail?: DiscordEmbedImage;
  image?: DiscordEmbedImage;
  fields?: DiscordEmbedField[];
  footer?: DiscordEmbedFooter;
  timestamp?: string;
}

export interface DiscordComponentEmoji {
  name: string;
  id?: string;
  animated?: boolean;
}

export interface DiscordComponentButton {
  type: 2;
  style: 5 | 1 | 2 | 3 | 4;
  label: string;
  url?: string;
  custom_id?: string;
  emoji?: DiscordComponentEmoji;
  disabled?: boolean;
}

export interface DiscordComponentActionRow {
  type: 1;
  components: DiscordComponentButton[];
}

export interface DiscordEmbedPayload {
  content?: string;
  embeds: DiscordEmbed[];
  components?: DiscordComponentActionRow[];
}

const exampleMatchId = 'EUW1_7481411158';

export const yuumiDiscordEmbed: DiscordEmbedPayload = {
  content:
    'Review your Yuumi games with a timeline-aware, role-specific match breakdown.',
  embeds: [
    {
      title: 'Yuumi Match Viewer',
      description:
        'Paste any {REGION}_{MATCH_ID} to inspect gold swings, rune usage, support quest timing, and combat moments for both teams.',
      url: 'https://yuumi.quest',
      color: 0x7ac4ff,
      author: {
        name: 'Yuumi Challenges',
        url: 'https://github.com/MercyMeow/YuumiChallenges',
      },
      thumbnail: {
        url: 'https://raw.githubusercontent.com/MercyMeow/YuumiChallenges/dev/public/images/ranked/diamond.png',
      },
      image: {
        url: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_2.jpg',
      },
      fields: [
        {
          name: 'Highlights',
          value:
            '• Lane and team-fight timeline with kill chains\n• Item spikes, quest completion, and rune metrics\n• Team damage, vision, objectives, and dividend breakdowns',
        },
        {
          name: 'Try It',
          value:
            'Open yuumi.quest/match/' +
            exampleMatchId +
            '?useExample=1 to load the bundled sample payload.',
        },
      ],
      footer: {
        text: 'Data: Riot Match/V5 · Maintained by Yuumi Challenges',
      },
    },
  ],
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: 'Open Match Viewer',
          url: 'https://yuumi.quest',
          emoji: {
            name: '🔎',
          },
        },
        {
          type: 2,
          style: 5,
          label: 'Example Match',
          url: 'https://yuumi.quest/match/' + exampleMatchId + '?useExample=1',
          emoji: {
            name: '📊',
          },
        },
      ],
    },
  ],
};
