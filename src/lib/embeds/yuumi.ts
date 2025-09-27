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

export const yuumiDiscordEmbed: DiscordEmbedPayload = {
  content:
    "_Evercat's patch 15.18 cheatsheet is live—take the lane, hold the zoomies._",
  embeds: [
    {
      title: 'Yuumi · Patch 15.18 Quick Guide',
      description:
        'Dawncore → Dream Maker into utility pivots. Haste, cleanse, sustain—keep your carry enchanted and the enemy muted.',
      url: 'https://github.com/MercyMeow/YuumiChallenges/blob/dev/docs/yuumi-15.18.md',
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
          name: 'Core Path',
          value:
            "• Dawncore → Dream Maker\n• Mikael's Blessing (into CC)\n• Redemption (teamfight sustain)",
          inline: true,
        },
        {
          name: 'Situational Tech',
          value:
            "• Ardent Censer / Staff of Flowing Water\n• Chemtech Putrifier (early anti-heal)\n• Shurelya's, Locket, Knight's Vow, Wardstone",
          inline: true,
        },
        {
          name: 'Starter & Economy',
          value: 'World Atlas → Runic Compass → Bounty of Worlds',
          inline: true,
        },
        {
          name: 'Runes & Spells',
          value:
            'Primary: Summon Aery + Manaflow Band + Transcendence + Gathering Storm.\nSecondary: Biscuit Delivery + Cosmic Insight.\nSpells: Flash + Exhaust (Swap to Ignite if lane kill pressure).',
        },
        {
          name: 'Key Notes',
          value:
            "Delay boots unless tempo demands haste. Slot Chemtech Putrifier second into sustain lanes. Align Ardent vs Staff with your carry's damage profile.",
        },
      ],
      footer: {
        text: 'Data: Lolalytics 15.18 · Maintained by Yuumi Challenges',
        icon_url:
          'https://raw.githubusercontent.com/MercyMeow/YuumiChallenges/dev/public/rule1.gif',
      },
      timestamp: '2025-09-27T00:00:00.000Z',
    },
  ],
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: 'Full Guide',
          url: 'https://github.com/MercyMeow/YuumiChallenges/blob/dev/docs/yuumi-15.18.md',
          emoji: {
            name: '📘',
          },
        },
        {
          type: 2,
          style: 5,
          label: 'Live Stats',
          url: 'https://lolalytics.com/lol/yuumi/build/',
          emoji: {
            name: '✨',
          },
        },
      ],
    },
  ],
};
