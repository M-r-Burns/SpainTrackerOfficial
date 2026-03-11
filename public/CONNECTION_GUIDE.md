# Connection Guide

## 1. Google Cloud Console Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project called "Valencia Tracker"
3. Enable the **Google Sheets API**:
   - APIs & Services → Library → search "Google Sheets API" → Enable
4. Create OAuth 2.0 credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: **Web application**
   - Authorised JavaScript origins: `http://localhost:5173` (dev) and your production URL
   - Authorised redirect URIs: `http://localhost:5173/` and your production URL
   - Copy the **Client ID** → paste into `VITE_GOOGLE_CLIENT_ID` in `.env.local`

## 2. Google Sheets Setup

1. Create a new Google Sheet
2. Copy the **Sheet ID** from the URL: `docs.google.com/spreadsheets/d/**SHEET_ID**/edit`
3. Paste into `VITE_SHEET_ID` in `.env.local` (or enter it in Settings)
4. Create two tabs named exactly:
   - `Config`
   - `DailyLog`
5. Import `TAB1_CONFIG.csv` into the **Config** tab (row 1 = headers, row 2-17 = data)
6. Set the **start date** in `Config!D2` (format: YYYY-MM-DD)
7. Import `TAB2_DAILY_LOG.csv` into the **DailyLog** tab (row 1 = headers, rows 2-113 = data)

## 3. Share the Sheet

Share the Google Sheet with your Google account (the one you use to sign in).
Editor access is required for writing daily logs.

## 4. First Launch

1. Open the app
2. If you are not logged in, the app now shows a dedicated **Sign in with Google** screen first
   (no need to open Settings just to authenticate).
3. Tap **Sign in with Google**
4. Grant access to Google Sheets
5. Return to **Today** view — data should load automatically

## 5. Cloudflare Pages variables (recommended)

For Cloudflare Pages, set these as environment variables/secrets in your Pages project:

- `GOOGLE_CLIENT_ID` (or `VITE_GOOGLE_CLIENT_ID`)
- `GOOGLE_CLIENT_SECRET`
- `SHEET_ID` (or `VITE_SHEET_ID`)

The app fetches these from `/api/config` at runtime on startup, so:

- Google OAuth always gets `client_id`
- The sheet ID is auto-applied (no manual entry required)

After editing Pages variables, redeploy your site.

## Troubleshooting

- **"OAuth state mismatch"**: Clear localStorage and try again
- **"Sheets read error 403"**: Check Sheet ID and sharing permissions
- **"Token exchange failed"**: Verify Client ID and redirect URI in Google Cloud Console
