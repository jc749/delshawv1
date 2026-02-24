# Del Shaw — Talent Intelligence Dashboard v2.0

A live, Notion-powered talent agency dashboard for Sloan Whiteside-Munteanu. All content pulls from real Notion databases — no hallucinated news.

## Architecture

```
Notion (source of truth)
  ├── Hollywood News Hub DB          → Industry Pulse, Sloan's Desk
  ├── Hollywood Podcast Transcripts  → Podcast section, AI context
  ├── Del Shaw — Client Profiles     → Client data, lookalike lists
  └── Del Shaw — Talent Radar        → Extracted + manual prospects

Vercel API Routes (serverless, keeps secrets safe)
  ├── /api/articles       → Fetches articles from Notion
  ├── /api/podcasts       → Fetches podcast episodes from Notion
  ├── /api/clients        → Fetches client profiles + page content
  ├── /api/analyze        → Claude AI analysis (negotiation, news, strategy)
  ├── /api/talent-radar   → GET: fetch prospects | POST: run AI scan
  └── /api/talent-radar-add → Add manual prospect to Notion

React Frontend
  ├── Sloan's Desk        → Real headlines from Notion + AI-written LinkedIn posts
  ├── Talent Radar        → AI-extracted prospects + manual additions
  └── Client Profiles     → Joy Sunday, Quinta Brunson, Kelly Rowland + more
```

## Deploy to Vercel

### 1. Push to GitHub
```bash
cd del-shaw-v2
git init
git add .
git commit -m "Del Shaw dashboard v2"
gh repo create del-shaw-dashboard --private --push
```

### 2. Connect to Vercel
- Go to vercel.com → New Project → Import your repo
- Framework: Vite

### 3. Add Environment Variables in Vercel
Go to Project → Settings → Environment Variables and add:

| Variable | Value |
|----------|-------|
| `NOTION_TOKEN` | Your Notion integration secret |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `NOTION_ARTICLES_DB_ID` | `301eef71c27780148ba5f048398047ec` |
| `NOTION_PODCASTS_DB_ID` | `300eef71c27780adb33ce0af8fd04623` |
| `NOTION_CLIENTS_DB_ID` | `396ab9c920fa4aa889d633a97e24e6bb` |
| `NOTION_TALENT_RADAR_DB_ID` | `c84b0577e4f844fcbf33d309276ed279` |

### 4. Share your Notion integration with the databases
In Notion, open each database → "..." menu → Connections → Add your integration.

### 5. Redeploy
Vercel auto-deploys on push. Or trigger manually in the dashboard.

## Local Dev

```bash
npm install
# Create .env.local from .env.example and fill in your values
# Start a local API server (Vercel CLI recommended):
npm install -g vercel
vercel dev
```

## Adding Client Files to Notion

Go to **Del Shaw — Client Profiles** in Notion and open any client's page.
Paste the lookalike/similar audience section from your Modash or Spotter report into the **"Similar Audiences / Lookalike Names"** section.
The Talent Radar AI scan will read this content automatically.

## Talent Radar — How It Works

1. Click **"Run AI Scan"** on the Talent Radar page
2. The app sends your recent Notion articles + podcast content + client lookalike data to Claude
3. Claude extracts emerging talent names, scores them against Sloan's ICP, and returns structured prospects
4. Results are saved back to the **Del Shaw — Talent Radar** Notion DB
5. Future scans skip already-saved names (no duplicates)
6. You can also manually add prospects via the **"Add Manual"** button

## Updating Client Data

Edit client profiles directly in Notion → **Del Shaw — Client Profiles**. 
The dashboard pulls live data on every load.
