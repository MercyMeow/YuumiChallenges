<!-- ✦ ─────────────────────────────────────────────────────────────── ✦ -->

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:010A13,45:091428,100:0A323C&height=230&section=header&text=yuumi.quest&fontSize=72&fontColor=C8AA6E&fontAlignY=36&desc=The%20Magical%20Cat%E2%80%99s%20grimoire%20%E2%80%94%20builds%2C%20matchups%20%26%20match%20analysis&descAlignY=58&descSize=17&animation=fadeIn" width="100%" alt="yuumi.quest banner" />

<a href="https://yuumi.quest">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=21&duration=3200&pause=900&color=C8AA6E&center=true&vCenter=true&width=760&lines=Builds+that+update+themselves+%E2%80%94+scraped+daily%2C+stamped+hourly.;Ability+guide+%E2%9C%A6+matchup+scrolls+%E2%9C%A6+mythic+shop+timers.;Paste+any+%7BREGION%7D_%7BMATCH_ID%7D+and+go+deep." alt="Typing intro" />
</a>

<br/><br/>

<!-- Tech badges — forged in hextech gold -->
<a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-C8AA6E?style=for-the-badge&logo=nextdotjs&logoColor=C8AA6E&labelColor=010A13" alt="Next.js 16" /></a>
<a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-C8AA6E?style=for-the-badge&logo=react&logoColor=C8AA6E&labelColor=010A13" alt="React 19" /></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6-C8AA6E?style=for-the-badge&logo=typescript&logoColor=C8AA6E&labelColor=010A13" alt="TypeScript 6" /></a>
<a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-4-C8AA6E?style=for-the-badge&logo=tailwindcss&logoColor=C8AA6E&labelColor=010A13" alt="Tailwind CSS 4" /></a>
<a href="https://convex.dev/"><img src="https://img.shields.io/badge/Convex-realtime-0AC8B9?style=for-the-badge&logo=convex&logoColor=0AC8B9&labelColor=010A13" alt="Convex" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-E8D6A8?style=for-the-badge&labelColor=010A13" alt="MIT License" /></a>

<br/>

<a href="https://yuumi.quest"><img src="https://img.shields.io/badge/✦_Live-yuumi.quest-0AC8B9?style=flat-square&labelColor=010A13" alt="Live site" /></a>
<a href="https://discord.gg/yuumi"><img src="https://img.shields.io/badge/💬_Discord-join_the_bandlewood-C8AA6E?style=flat-square&labelColor=010A13" alt="Discord" /></a>
<a href="https://github.com/MercyMeow/YuumiChallenges"><img src="https://img.shields.io/github/stars/MercyMeow/YuumiChallenges?style=flat-square&color=C8AA6E&labelColor=010A13&label=✦%20Stars" alt="Stars" /></a>

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Overview

> **yuumi.quest** is a League of Legends companion for Yuumi mains, styled after the old LoL client's hextech magic — dark navy plates, forged-gold frames, glowing teal accents. It pairs a **self-updating Yuumi guide** with a timeline-aware **match viewer** and a real-time **Convex** backend.

The guide's recommended build refreshes itself on a daily cron and shows exactly when it was last forged. Ability tips, matchup scrolls, and synergy notes are curated against the current patch and rendered with live Data Dragon spell icons, cooldowns, and keyword highlighting — no text walls allowed in the bandlewood.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Features

<table>
<tr>
<td width="50%" valign="top">

### 📘 Yuumi Guide

`/` (home)

- **Live builds** — daily auto-scrape with a "last updated" stamp; curated fallback when offline
- **Ability guide** — interactive spell selector with Data Dragon icons, live cooldown/mana chips, wiki-verified tips
- **Matchup & synergy scrolls** — every enemy support / ally ADC with their full kit icons, highlighted tips, rune & item adjustments
- **Scroll-spy nav** — the client-style rails track the section you're reading

</td>
<td width="50%" valign="top">

### 🔭 Match Viewer

`/match/{REGION}_{MATCH_ID}`

- **Overview** — rosters, objective control, support-item timing
- **Detailed stats** — damage, vision & gold side-by-side
- **Runes** — full pages with derived variable metrics
- **Timeline** — swap combat ⇄ item timelines on the fly
- **Challenges** — Riot progress + community **Yuumi Challenges**

</td>
</tr>
<tr>
<td width="50%" valign="top">

### ✨ Reset Timers

site-wide banner

- Live UTC Mythic Shop reset countdowns (daily / weekly / bi-weekly / featured)

</td>
<td width="50%" valign="top">

### 🖼️ Rule Gallery &nbsp;·&nbsp; 🛠️ Admin

`/gallery` · `/admin`

- Discord-shareable rule GIFs with rich embeds
- Auth-gated content management for builds, items & sections
- Data scraper for external build imports

</td>
</tr>
</table>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Architecture

```mermaid
flowchart LR
  subgraph Client [Next.js 16 App Router]
    Guide[Yuumi Guide]
    Viewer[Match Viewer]
    Shop[Mythic Shop]
    Admin[Admin Panel]
  end
  subgraph API [API Routes]
    MatchAPI["/api/match-details"]
  end
  subgraph Convex [Convex Realtime DB]
    Builds[guideBuilds · guideMatchups]
    Meta[guideMetadata · autoBuild]
    Cron[daily scraper cron]
  end
  subgraph External [External Data]
    Riot[Riot Match & Timeline V5]
    DDragon[Data Dragon CDN]
    Stats[Live build stats]
  end

  Viewer --> MatchAPI --> Riot
  Guide --> Builds
  Guide --> DDragon
  Cron --> Stats
  Cron --> Meta
  Admin --> Builds
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Quick Start

```bash
# 1 — Clone
git clone https://github.com/MercyMeow/YuumiChallenges.git
cd YuumiChallenges

# 2 — Install
npm install

# 3 — Configure (add your keys)
cp .env.example .env.local   # Windows: Copy-Item .env.example .env.local

# 4 — Launch (Next.js + Convex together)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and you're flying. 🪶

**First deployment?** Seed the guide tables and pull the first live build:

```bash
npx convex deploy                        # push schema & functions
npx convex run seed:seedAll              # seed builds, matchups, sections
npx convex run scraper:autoUpdateBuild   # fetch the current live build
```

> The site degrades gracefully — without Convex it falls back to the same static data the seeder uses, so DB and fallback never drift.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Configuration

<details>
<summary><b>Environment variables (.env.local)</b></summary>

<br/>

| Variable | Required | Purpose |
| --- | :---: | --- |
| `RIOT_API_KEY` | live match data | Server-side Riot API access |
| `NEXT_PUBLIC_CONVEX_URL` | ✅ | Convex deployment URL |
| `CONVEX_SELF_HOSTED_URL` | self-hosting | Self-hosted Convex endpoint |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | self-hosting | Self-hosted Convex admin key |
| `CONVEX_DEPLOY_KEY` | cloud prod | Convex cloud deploy key |
| `NEXT_PUBLIC_SITE_URL` | prod | Canonical & Open Graph URLs |
| `NEXT_PUBLIC_USE_EXAMPLE_DATA` | optional | Serve bundled example match payloads |

Grab a development key from the [Riot Developer Portal](https://developer.riotgames.com/). Convex runs in the cloud **or fully self-hosted** — both are supported.

</details>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Project Structure

```text
YuumiChallenges/
├── src/
│   ├── app/               # App Router routes + hextech design system (globals.css)
│   │   ├── api/           # match-details proxy
│   │   ├── admin/         # auth-gated CMS + scraper tools
│   │   ├── gallery/       # rule GIF gallery
│   │   ├── match/         # match viewer
│   │   └── rule[id].gif/  # Discord-embeddable rule routes
│   ├── components/
│   │   ├── guide/         # ability guide, matchup visuals, rail panels
│   │   ├── match-history/ # match viewer tabs & widgets
│   │   ├── shell/         # LoL-client chrome (TopNav, SideRail)
│   │   └── ui/            # hextech primitives (panels, Data Dragon images)
│   └── lib/               # builds, matchups, runes, Data Dragon clients, hooks
├── convex/                # schema, guide CRUD, auth, seeding, scraper + cron
├── data/                  # Yuumi challenge definitions
├── docs/                  # feature & data-source notes
└── public/                # static assets + rule GIFs
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Tech Stack

<div align="center">

| Layer | Technology |
| :---: | :--- |
| **Framework** | Next.js 16 App Router · Turbopack |
| **Language** | React 19 · TypeScript 6 (strict, `noUncheckedIndexedAccess`) |
| **Backend** | Convex — realtime DB, functions & crons (cloud or self-hosted) |
| **Styling** | Tailwind CSS 4 (CSS-first `@theme`) · Radix UI · CVA |
| **Tooling** | Zod 4 · Lucide icons · ESLint · Prettier |

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js (Turbopack) + Convex dev servers |
| `npm run dev:next` | Next.js only (Convex-less, static fallbacks) |
| `npm run build` | Production build (deploys Convex first) |
| `npm run lint` / `lint:fix` | ESLint (and auto-fix) |
| `npm run format` / `format:check` | Prettier write / check |
| `npm run type-check` | TypeScript diagnostics, no emit |

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Contributing

Contributions are welcome! Before opening a PR:

1. Follow **Conventional Commits** (`feat:`, `fix:`, `chore:`).
2. Run `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm run build`.
3. Link related issues (`Closes #123`) and include UI captures for visual changes.
4. If you touch guide data under `src/lib/`, re-run `npx convex run seed:seedAll` so the database matches.

See [`AGENTS.md`](AGENTS.md) for coding standards and [`docs/`](docs/) for rune internals.

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:785A28,50:C8AA6E,100:785A28&height=3" width="100%" alt="" />

## ✦ Disclaimer & License

> yuumi.quest is an **unofficial, community project** and is **not endorsed by or affiliated with Riot Games**. League of Legends and all related assets are trademarks of Riot Games, Inc. API use must comply with the [Riot API Terms of Service](https://developer.riotgames.com/).

Released under the **[MIT License](LICENSE)**.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0A323C,55:091428,100:010A13&height=130&section=footer&text=%E2%80%9CWe%E2%80%99ll%20be%20the%20best%20of%20friends%2C%20forever%20and%20ever!%E2%80%9D&fontSize=17&fontColor=C8AA6E&fontAlignY=72" width="100%" alt="footer" />

**Made with ♥ for Yuumi mains worldwide**

<a href="https://yuumi.quest"><b>Visit the site</b></a> · <a href="https://discord.gg/yuumi"><b>Join the Discord</b></a>

</div>
