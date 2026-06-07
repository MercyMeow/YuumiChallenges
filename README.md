# 🐱 Yuumi Match Viewer

<div align="center">

![Yuumi Banner](https://img.shields.io/badge/Yuumi-Match_Viewer-7ac4ff?style=for-the-badge&logo=riot-games&logoColor=white)

**Inspect every Yuumi game detail with a single match URL.**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://typescriptlang.org/badge)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## ✨ Overview

Yuumi Match Viewer is a focused Next.js application that renders deep, timeline-aware match breakdowns for League of Legends support mains. Paste any <code>{REGION}_{MATCH_ID}</code> and review objective control, kill chains, rune pacing, support quest progress, and more.

### 🎮 Highlights

- **📊 Match Details** – Detailed participant panes, rune stats, objectives, and combat summaries
- **⏱️ Timeline Views** – Swap between combat and item timelines processed on the fly

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.x or later)
- **npm**

### Installation

1. **Clone the repository**

        git clone https://github.com/yourusername/yuumi-challenges.git
        cd yuumi-challenges

2. **Install dependencies**

        npm install

3. **Create local environment**

        New-Item .env.local -ItemType File

   Add RIOT_API_KEY before fetching live match data.

4. **Start the development server**

        npm run dev

5. **Open your browser**

   Navigate to http://localhost:3000

## 📁 Project Structure

<pre><code>
yuumi-match-viewer/
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── api/               # Server routes (Data Dragon proxy, match details)
│   │   ├── match/             # Match details page
│   │   └── page.tsx           # Landing page with match-id launcher
│   ├── components/            # Reusable React components (match details, UI)
│   └── lib/                   # Shared utilities & helpers
├── public/                    # Static assets (images, icons)
└── package.json               # Dependencies and scripts
</code></pre>

## 🎯 Usage

### Viewing Matches

- **Live Riot API data** – Set <code>RIOT_API_KEY</code> in <code>.env.local</code>, then open <code>/match/{REGION}_{MATCH_ID}</code>
- Toggle queues, compare players, and inspect rune metrics directly on the page

### Landing Page Launcher

The root route <code>/</code> lets you choose a region, enter a numeric match ID, and jump straight into the viewer. You can also paste a full <code>{REGION}_{MATCH_ID}</code> value.

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start development server |
| npm run build | Build for production |
| npm run start | Serve the production build |
| npm run lint | Run ESLint |

## ⚙️ Configuration

All runtime configuration lives in <code>.env.local</code>:

- <code>NEXT_PUBLIC_SITE_URL</code> – Base URL for metadata and Open Graph tags
- <code>RIOT_API_KEY</code> – Required when fetching live match data through the API route

## 📚 Data Sources

Match insights are generated from Riot Match/V5 and Timeline/V5 payloads.

## 🤝 Contributing

1. Sync or capture new match data
2. Update UI or processing helpers in <code>src/components/match-details</code> or <code>src/lib</code>
3. Run <code>npm run lint</code>, <code>npm run format</code>, and <code>npm run type-check</code>
4. Open a PR following Conventional Commits and link your issue

## 📄 License

License details have not been published yet.

---

<div align="center">

**Made with 💜 for Yuumi mains everywhere**

</div>
