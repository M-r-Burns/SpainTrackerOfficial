# Valencia Tracker 🇪🇸

A Progressive Web App for tracking a 4-month immersive experience in Valencia, Spain.

## Features
- 📅 Daily log with checklist and number inputs
- 📊 Weekly progress vs targets
- 🌍 Overall 16-week journey view
- 📆 Streak heatmap calendar
- ☁️ Google Sheets backend (no database needed)
- 📱 Installable PWA with offline support

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Zustand state management
- Google Sheets API v4
- Google OAuth 2.0 PKCE
- Workbox / vite-plugin-pwa

## Quick Start

1. Clone and install:
   \`\`\`bash
   npm install
   \`\`\`

2. Copy \`.env.example\` to \`.env.local\` and fill in your credentials:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Set up Google Sheets (see [CONNECTION_GUIDE.md](CONNECTION_GUIDE.md))

4. Run dev server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

## Deployment
Deploy to Vercel — \`vercel.json\` is pre-configured for SPA routing.

## Environment Variables
| Variable | Description |
|----------|-------------|
| \`VITE_GOOGLE_CLIENT_ID\` | Google OAuth 2.0 Client ID |
| \`VITE_SHEET_ID\` | Google Sheets spreadsheet ID |
