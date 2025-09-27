# 🐱 Yuumi Guide & Match Viewer

<div align="center">

![Yuumi Banner](https://img.shields.io/badge/Yuumi-Guide-FF69B4?style=for-the-badge&logo=riot-games&logoColor=white)

**A clean, modern Yuumi support guide for League of Legends Patch 25.18**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://typescriptlang.org/badge)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## ✨ Overview

This is a streamlined web application featuring a comprehensive, code-editable Yuumi support guide for League of Legends Patch 25.18, along with a rule GIF gallery and detailed match viewer. The entire experience runs on static and proxied game data—no database or authentication required.

### 🎮 Features

- **🐾 Yuumi Guide** – Up-to-date runes, items, skill order, matchups, and synergies for Patch 25.18
- **🎯 Rule Gallery** – Browse and share Discord-ready rule GIFs
- **📊 Match Details** – In-depth match analysis with timeline data using example payloads or the Riot API
- **🎨 Modern UI** – Clean, responsive design with magical Yuumi-themed styling

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.x or later)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/yuumi-guide.git
   cd yuumi-guide
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy environment template**
   ```powershell
   Copy-Item .env.example .env.local
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
yuumi-guide/
├── 📂 src/
│   ├── 📂 app/                    # Next.js App Router routes
│   │   ├── 📂 api/               # Server routes (Data Dragon proxy, match details)
│   │   ├── 📂 gallery/           # Rule GIF gallery
│   │   ├── 📂 match/             # Match details viewer
│   │   └── 📄 page.tsx           # Yuumi guide (editable)
│   ├── 📂 components/            # Reusable React components
│   └── 📂 lib/                   # Shared utilities & helpers
├── 📂 public/                    # Static assets (GIFs, images)
├── 📄 exampleMatchData.json      # Demo match response
├── 📄 exampleTimelineData.json   # Demo timeline response
└── 📄 package.json              # Dependencies and scripts
```

## 🎯 Usage

### Editing the Yuumi Guide

The guide is completely code-editable. To update runes, items, matchups, or any content:

1. Open `src/app/page.tsx`
2. Modify the constants at the top of the file:
   - `PATCH` – Current patch version
   - `runes` – Rune configuration
   - `items` – Item build
   - `skillOrder` – Ability leveling priority
   - `toughMatchups` – Hard counter champions
   - `goodSynergies` – Best ADC/midlaner synergies
3. Save and the changes will be reflected immediately

### Viewing Matches

- **Use built-in example data** – Enable `NEXT_PUBLIC_USE_EXAMPLE_DATA=true` in `.env.local`, then visit `/match/NA1_12345`
- **Live Riot API data** – Set `NEXT_PUBLIC_USE_EXAMPLE_DATA=false`, provide a valid `RIOT_API_KEY`, and open `/match/{REGION}_{MATCH_ID}`
- Example payloads live in `exampleMatchData.json` and `exampleTimelineData.json` for quick iteration

### Rule Gallery

- Visit `/gallery` to browse the curated rule GIFs from `public/rule*.gif`
- Click any rule to copy its Discord-friendly link

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## ⚙️ Configuration

All runtime configuration lives in `.env.local` (see `.env.example`):

- `NEXT_PUBLIC_SITE_URL` – Base URL used for link generation.
- `NEXT_PUBLIC_USE_EXAMPLE_DATA` – Toggle between static example match data and live Riot API requests.
- `RIOT_API_KEY` – Required only when pulling live match data via the Riot API route.

## 📚 Data Sources

- Yuumi guide constants are curated from Mobalytics, Lolalytics, pro builds, and community consensus for Patch 25.18.

## 🤝 Contributing

To update the guide with new patch data:

1. Research current meta from reliable sources
2. Update the constants in `src/app/page.tsx`
3. Test the changes locally
4. Commit with a descriptive message

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Made with 💜 for Yuumi mains everywhere**

</div>