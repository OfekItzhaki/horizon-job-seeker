# Modular Scraper System

## Overview

The job scraper system is now fully modular and configuration-driven. You can easily enable/disable scrapers, add new ones, and configure priorities without touching the worker code.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  BackgroundWorker                        │
│  (Orchestrates scraping, doesn't know about scrapers)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              scraperConfig.ts                            │
│  (Defines which scrapers are enabled and their config)  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             scraperFactory.ts                            │
│  (Creates scraper instances dynamically)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Individual Scrapers                         │
│  • LinkedInPublicScraper                                │
│  • AdzunaScraper                                        │
│  • RSSJobScraper                                        │
│  • LinkedInScraper (disabled)                           │
│  • IndeedScraper (disabled)                             │
└─────────────────────────────────────────────────────────┘
```

## Configuration File

All scraper configuration is in: `backend/src/config/scraperConfig.ts`

### Scraper Config Structure

```typescript
{
  id: 'linkedin-public',           // Unique identifier
  name: 'LinkedIn Public API',     // Display name
  enabled: true,                   // Enable/disable scraper
  priority: 1,                     // Lower = runs first
  maxJobs: 100,                    // Max jobs to fetch
  description: '...',              // What this scraper does
  requiresAuth: false,             // Needs credentials?
  authEnvVars: ['VAR1', 'VAR2']   // Required env vars
}
```

## Current Scrapers

### 1. LinkedIn Public API (Priority 1) ✅
- **Status**: Enabled
- **Auth**: None required
- **Freshness**: Last 24 hours
- **Expected**: 50-100 jobs/day
- **Locations**: Tel Aviv, Israel, Remote

### 2. Adzuna API (Priority 2) ✅
- **Status**: Enabled
- **Auth**: Required (ADZUNA_APP_ID, ADZUNA_API_KEY)
- **Freshness**: Last 3 days
- **Expected**: 100-200 jobs/day
- **Countries**: Israel, US, UK

### 3. RSS Feeds (Priority 3) ✅
- **Status**: Enabled
- **Auth**: None required
- **Freshness**: Last 3 days
- **Expected**: 10-20 jobs/day
- **Sources**: RemoteOK, Hacker News, We Work Remotely

### 4. LinkedIn Scraper (Priority 10) ❌
- **Status**: Disabled (risky, requires login)
- **Auth**: Required (LINKEDIN_EMAIL, LINKEDIN_PASSWORD)
- **Note**: Enable at your own risk

### 5. Indeed Scraper (Priority 11) ❌
- **Status**: Disabled (has bot detection)
- **Auth**: None required
- **Note**: Often fails due to bot detection

## How to Enable/Disable Scrapers

Edit `backend/src/config/scraperConfig.ts`:

```typescript
{
  id: 'adzuna',
  name: 'Adzuna API',
  enabled: true,  // Change to false to disable
  priority: 2,
  // ... rest of config
}
```

## How to Add a New Scraper

### Step 1: Create the Scraper Class

Create `backend/src/scraper/yourScraper.ts`:

```typescript
import { BaseScraper, type ScrapedJob } from './baseScraper.js';

export class YourScraper extends BaseScraper {
  async scrapeJobs(searchQuery: string, maxJobs: number): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    
    // Your scraping logic here
    
    return jobs;
  }

  async init(): Promise<void> {
    console.log('Your Scraper initialized');
  }

  async close(): Promise<void> {
    console.log('Your Scraper closed');
  }
}
```

### Step 2: Add to Factory

Edit `backend/src/scraper/scraperFactory.ts`:

```typescript
import { YourScraper } from './yourScraper.js';

export function createScraper(scraperId: string): BaseScraper | null {
  switch (scraperId) {
    // ... existing cases
    
    case 'your-scraper':
      return new YourScraper();
    
    default:
      return null;
  }
}
```

### Step 3: Add to Config

Edit `backend/src/config/scraperConfig.ts`:

```typescript
export const scraperConfig: ScraperSourceConfig[] = [
  // ... existing scrapers
  
  {
    id: 'your-scraper',
    name: 'Your Scraper Name',
    enabled: true,
    priority: 4,
    maxJobs: 50,
    description: 'What your scraper does',
    requiresAuth: false,
  },
];
```

That's it! The system will automatically use your new scraper.

## How to Change Priority

Lower priority number = runs first (gets fresh jobs first).

Edit `backend/src/config/scraperConfig.ts`:

```typescript
{
  id: 'adzuna',
  priority: 1,  // Change this number
  // ...
}
```

Current priorities:
- 1: LinkedIn Public (freshest - 24 hours)
- 2: Adzuna (fresh - 3 days)
- 3: RSS (fallback - 3 days)
- 10+: Disabled scrapers

## API Endpoints

### Get Scraper Status

```bash
GET /api/automation/scrapers
```

Response:
```json
{
  "stats": {
    "total": 5,
    "enabled": 3,
    "available": 3,
    "missingAuth": []
  },
  "scrapers": [
    {
      "id": "linkedin-public",
      "name": "LinkedIn Public API",
      "enabled": true,
      "priority": 1,
      "maxJobs": 100,
      "description": "...",
      "requiresAuth": false,
      "authEnvVars": []
    }
  ]
}
```

## Environment Variables

### Required for Adzuna
```env
ADZUNA_APP_ID=your_app_id
ADZUNA_API_KEY=your_api_key
```

### Optional (for disabled scrapers)
```env
LINKEDIN_EMAIL=your_email
LINKEDIN_PASSWORD=your_password
```

## Logging

When you run the scraper, you'll see:

```
=== Starting scrape job ===

Scraper Status:
  Total configured: 5
  Enabled: 3
  Available (with auth): 3

Running 3 scrapers:

--- Scraping from LinkedIn Public API (priority: 1) ---
LinkedIn Public Scraper initialized (using public API)
Found 50 jobs from LinkedIn Public API
Processed 50 jobs from LinkedIn Public API

--- Scraping from Adzuna API (priority: 2) ---
Adzuna Scraper initialized (using official API)
Found 100 jobs from Adzuna API
Processed 100 jobs from Adzuna API

--- Scraping from RSS Feeds (priority: 3) ---
RSS Scraper initialized (no browser needed)
Found 10 jobs from RSS Feeds
Processed 10 jobs from RSS Feeds

=== Scrape job completed in 45000ms ===
Stats: 120 new, 40 duplicates, 160 total scraped
```

## Benefits of Modular System

1. **Easy to Enable/Disable**: Just change `enabled: true/false`
2. **Easy to Add New Scrapers**: 3 simple steps
3. **Priority Control**: Control which scrapers run first
4. **Auth Management**: Automatic checking of required credentials
5. **No Code Changes**: Worker code never needs to change
6. **Statistics**: See which scrapers are working
7. **Maintainable**: Each scraper is independent

## Testing

### Test All Enabled Scrapers
```bash
cd backend
npm run scrape
```

### Test Specific Scraper
Temporarily disable others in config, then:
```bash
npm run scrape
```

### Check Scraper Status
```bash
curl http://localhost:3001/api/automation/scrapers
```

## Troubleshooting

### Scraper Not Running
1. Check if it's enabled in config
2. Check if auth credentials are set (if required)
3. Check logs for errors

### Missing Auth Warning
If you see:
```
Missing auth for:
  - Adzuna API: needs ADZUNA_APP_ID, ADZUNA_API_KEY
```

Add the required environment variables to `.env`.

### Scraper Failing
1. Check internet connection
2. Check API rate limits
3. Check if API credentials are valid
4. Check scraper logs for specific errors

## Future Scrapers to Add

Potential scrapers you could add:

1. **The Muse API** (FREE)
   - Tech-focused jobs
   - https://www.themuse.com/developers/api/v2

2. **GitHub Jobs API** (FREE)
   - Tech jobs only
   - https://jobs.github.com/api

3. **Reed.co.uk API** (FREE)
   - UK jobs
   - https://www.reed.co.uk/developers

4. **Israeli Job Boards**
   - Drushim.co.il (web scraping)
   - AllJobs.co.il (web scraping)
   - JobMaster.co.il (RSS or scraping)

5. **RapidAPI LinkedIn Jobs** ($10-50/month)
   - Real-time LinkedIn data
   - https://rapidapi.com/rockapis-rockapis-default/api/linkedin-jobs-search

## Files in Modular System

- `backend/src/config/scraperConfig.ts` - Configuration
- `backend/src/scraper/scraperFactory.ts` - Factory pattern
- `backend/src/worker/backgroundWorker.ts` - Orchestrator
- `backend/src/scraper/linkedinPublicScraper.ts` - LinkedIn scraper
- `backend/src/scraper/adzunaScraper.ts` - Adzuna scraper
- `backend/src/scraper/rssJobScraper.ts` - RSS scraper
- `backend/src/scraper/linkedinScraper.ts` - LinkedIn web scraper (disabled)
- `backend/src/scraper/indeedScraper.ts` - Indeed scraper (disabled)

## Related Documents

- `MULTIPLE_JOB_SOURCES.md` - Overview of job sources
- `FRESH_JOBS_SOLUTION.md` - 3-day filter explanation
- `REFRESH_JOBS_FEATURE.md` - How to use refresh button
