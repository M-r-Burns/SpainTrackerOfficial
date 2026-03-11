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
- Vercel: `vercel.json` is pre-configured for SPA routing.
- Cloudflare Pages: supported with runtime config endpoint at `/api/config`.

### Cloudflare Pages setup
Set these environment variables/secrets in your Pages project and redeploy:

- `GOOGLE_CLIENT_ID` (or `VITE_GOOGLE_CLIENT_ID`)
- `SHEET_ID` (or `VITE_SHEET_ID`)

The app reads them at runtime via Pages Functions, auto-loads the sheet ID, and uses the
client ID for OAuth so users can sign in immediately from the login screen.

## Environment Variables
| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID (build-time fallback) |
| `VITE_SHEET_ID` | Google Sheets spreadsheet ID (build-time fallback) |
| `GOOGLE_CLIENT_ID` | Cloudflare Pages runtime variable/secret for OAuth client ID |
| `SHEET_ID` | Cloudflare Pages runtime variable/secret for spreadsheet ID |
