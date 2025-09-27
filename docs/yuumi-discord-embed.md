# Yuumi Patch 15.18 Discord Embed

Use the payload below to post a rich Discord embed that highlights the Yuumi 15.18 guide with a modern, clean, and on-brand aesthetic. The embed leans into soft astral blues, rounded emoji accents, and concise copy so it stays readable on mobile and desktop.

## Quick Usage

1. Copy the JSON payload.
2. Paste it into your bot/message builder (e.g., [Discohook](https://discohook.org/) or a custom bot).
3. Update the `timestamp` and any URLs if you publish a new revision.

## Embed Payload

```json
{
  "content": "_Evercat's patch 15.18 cheatsheet is live—take the lane, hold the zoomies._",
  "embeds": [
    {
      "title": "Yuumi · Patch 15.18 Quick Guide",
      "description": "Dawncore → Dream Maker into utility pivots. Haste, cleanse, sustain—keep your carry enchanted and the enemy muted.",
      "url": "https://github.com/MercyMeow/YuumiChallenges/blob/dev/docs/yuumi-15.18.md",
      "color": 8045823,
      "author": {
        "name": "Yuumi Challenges",
        "url": "https://github.com/MercyMeow/YuumiChallenges"
      },
      "thumbnail": {
        "url": "https://raw.githubusercontent.com/MercyMeow/YuumiChallenges/dev/public/images/ranked/diamond.png"
      },
      "image": {
        "url": "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yuumi_2.jpg"
      },
      "fields": [
        {
          "name": "Core Path",
          "value": "• Dawncore → Dream Maker\n• Mikael's Blessing (into CC)\n• Redemption (teamfight sustain)",
          "inline": true
        },
        {
          "name": "Situational Tech",
          "value": "• Ardent Censer / Staff of Flowing Water\n• Chemtech Putrifier (early anti-heal)\n• Shurelya's, Locket, Knight's Vow, Wardstone",
          "inline": true
        },
        {
          "name": "Starter & Economy",
          "value": "World Atlas → Runic Compass → Bounty of Worlds",
          "inline": true
        },
        {
          "name": "Runes & Spells",
          "value": "Primary: Summon Aery + Manaflow Band + Transcendence + Gathering Storm.\nSecondary: Biscuit Delivery + Cosmic Insight.\nSpells: Flash + Exhaust (Swap to Ignite if lane kill pressure)."
        },
        {
          "name": "Key Notes",
          "value": "Delay boots unless tempo demands haste. Slot Chemtech Putrifier second into sustain lanes. Align Ardent vs Staff with your carry's damage profile."
        }
      ],
      "footer": {
        "text": "Data: Lolalytics 15.18 · Maintained by Yuumi Challenges",
        "icon_url": "https://raw.githubusercontent.com/MercyMeow/YuumiChallenges/dev/public/rule1.gif"
      },
      "timestamp": "2025-09-27T00:00:00.000Z"
    }
  ],
  "components": [
    {
      "type": 1,
      "components": [
        {
          "type": 2,
          "style": 5,
          "label": "Full Guide",
          "url": "https://github.com/MercyMeow/YuumiChallenges/blob/dev/docs/yuumi-15.18.md",
          "emoji": {
            "name": "📘"
          }
        },
        {
          "type": 2,
          "style": 5,
          "label": "Live Stats",
          "url": "https://lolalytics.com/lol/yuumi/build/",
          "emoji": {
            "name": "✨"
          }
        }
      ]
    }
  ]
}
```

## Customization Tips

- **Palette:** Adjust the `color` property (currently set to `#7AC4FF`) if you want to match a different accent.
- **Imagery:** Swap `thumbnail` or `image` URLs for seasonal splash art. Square or 16:9 crops work best.
- **Copy:** Keep field values under 1024 characters and the description under 4096 to stay within Discord limits.
- **Buttons:** Add or remove buttons in `components` to point at other resources, scrims, or community links.

Happy zoomies! 🐾
