# 🐱 Yuumi Challenges Dashboard

<div align="center">

![Yuumi Banner](https://img.shields.io/badge/Yuumi-Challenges-FF69B4?style=for-the-badge&logo=riot-games&logoColor=white)

**The magical challenge platform for League of Legends Yuumi Mains**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Discord](https://img.shields.io/badge/Discord-Auth-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.com/)
[![Riot API](https://img.shields.io/badge/Riot_Games-API-D32936?style=flat-square&logo=riot-games&logoColor=white)](https://developer.riotgames.com/)

[🚀 Live Demo](https://yuumi-challenges.vercel.app) • [📖 Documentation](./docs/) • [💬 Discord Server](https://discord.gg/yuumi)

</div>

---

## ✨ Overview

Yuumi Challenges is a comprehensive web application designed specifically for the **Yuumi Mains Discord community**. It enables players to track their League of Legends progress, participate in community challenges, and compete on leaderboards while celebrating the magical support champion we all love! 🎯

### 🎮 Key Features

- **🔐 Discord Authentication** - Secure sign-in exclusive to Yuumi Mains Discord members
- **🎯 Challenge Tracking** - Complete exciting challenges and monitor your progress
- **🏆 Leaderboards** - Compete with other Yuumi players and climb community rankings  
- **📊 Game Analytics** - Detailed match history and gameplay statistics
- **⚡ Real-time Updates** - Live tracking of your League of Legends matches
- **🛡️ Role-Based Access** - Member, admin, and owner role management
- **📱 Responsive Design** - Beautiful UI that works on all devices

### 🎪 Challenge Types

- **KDA Challenges** - Achieve specific KDA ratios
- **Win Streak Challenges** - Maintain consecutive victories
- **Champion Mastery** - Demonstrate your Yuumi expertise
- **Ranked Climb** - Track your ranked progression

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icons

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time subscriptions
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication with Discord provider

### External APIs
- **[Discord API](https://discord.com/developers/docs)** - User verification and role management
- **[Riot Games API](https://developer.riotgames.com/)** - League of Legends data integration

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **Zod** - Runtime type validation
- **React Hook Form** - Form management

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.x or later)
- **npm** or **yarn**
- **Discord Application** with bot permissions
- **Supabase Project**
- **Riot Games API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/yuumi-challenges.git
   cd yuumi-challenges
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Discord
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_BOT_TOKEN=your_discord_bot_token
   YUUMI_DISCORD_SERVER_ID=your_discord_server_id
   
   # Riot Games
   RIOT_API_KEY=your_riot_api_key
   ```

4. **Run database migrations**
   ```bash
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
yuumi-challenges/
├── 📂 src/
│   ├── 📂 app/                    # Next.js App Router pages
│   │   ├── 📂 api/               # Backend API routes
│   │   ├── 📂 auth/              # Authentication pages
│   │   ├── 📂 dashboard/         # Main dashboard
│   │   └── 📄 layout.tsx         # Root layout
│   ├── 📂 components/            # Reusable React components
│   │   ├── 📂 auth/              # Authentication components
│   │   ├── 📂 dashboard/         # Dashboard components
│   │   └── 📂 ui/                # UI component library
│   └── 📂 lib/                   # Shared utilities
│       ├── 📂 apis/              # External API wrappers
│       ├── 📂 hooks/             # Custom React hooks
│       └── 📂 types/             # TypeScript type definitions
├── 📂 public/                    # Static assets
├── 📂 supabase/                  # Database migrations
├── 📂 docs/                      # Project documentation
└── 📄 package.json              # Dependencies and scripts
```

## 🎯 Usage

### Authentication Flow
1. Users sign in with their Discord account
2. Application verifies Discord server membership
3. User roles are synced from Discord server
4. Access granted to dashboard features

### Challenge Participation
1. Browse available challenges in the dashboard
2. Connect your League of Legends summoner account
3. Complete challenges through gameplay
4. Track progress in real-time
5. Compete on community leaderboards

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run db:generate` | Generate TypeScript types from Supabase |

## 📚 Documentation

- **[Environment Variables](./docs/environment-variables.md)** - Required configuration
- **[API Endpoints](./docs/api-endpoints.md)** - Backend API reference
- **[Database Schema](./docs/database-schema.md)** - Database structure
- **[Deployment Guide](./docs/deployment.md)** - Production deployment

## 🚀 Deployment

### Vercel (Recommended)

1. **Fork this repository**
2. **Connect to Vercel**
   - Import your GitHub repository
   - Configure environment variables
   - Deploy automatically

3. **Set up environment variables in Vercel**
   - Add all variables from `.env.local`
   - Configure production database URLs

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

We welcome contributions from the Yuumi Mains community! Here's how you can help:

### Getting Started
1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint
   npm run type-check
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Contribution Guidelines
- Follow the existing code style
- Add TypeScript types for new features
- Update documentation for API changes
- Test your changes thoroughly
- Keep commits focused and atomic

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? We'd love to hear from you!

- **[Report a Bug](https://github.com/yourusername/yuumi-challenges/issues/new?template=bug_report.md)**
- **[Request a Feature](https://github.com/yourusername/yuumi-challenges/issues/new?template=feature_request.md)**
- **[Join our Discord](https://discord.gg/yuumi)** for community discussions

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Riot Games** - For the amazing League of Legends API
- **Yuumi Mains Discord Community** - For inspiration and feedback
- **Next.js Team** - For the incredible React framework
- **Supabase** - For the fantastic backend-as-a-service platform
- **All Contributors** - Thank you for making this project better! ❤️

---

<div align="center">

**Made with 💜 for the Yuumi Mains community**

[🐱 Join Discord](https://discord.gg/yuumi) • [📧 Contact](mailto:support@yuumi-challenges.com) • [🌟 Star this repo](https://github.com/yourusername/yuumi-challenges)

</div>