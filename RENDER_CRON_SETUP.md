# Render Cron Job Setup - Daily Job Scraping

Your backend is deployed on Render, and we've set up a daily automated job scraping system.

## ✅ Recommended Setup: Render Cron Job (Once Daily at 11 AM)

Render offers cron jobs on their free tier. Here's how to set it up:

### Step 1: Create the Cron Job

1. Go to your Render Dashboard: https://dashboard.render.com
2. Click "New +" → "Cron Job"
3. Configure:
   - **Name**: `horizon-job-scraper`
   - **Environment**: Same as your backend service (or create new)
   - **Command**: 
     ```bash
     curl -X POST https://api.horizon-jobs.ofeklabs.dev/api/automation/scrape
     ```
   - **Schedule**: `0 11 * * *` (runs daily at 11:00 AM UTC)
     - For 11 AM EST: `0 16 * * *`
     - For 11 AM PST: `0 19 * * *`
   - **Region**: Same as your backend service

### Step 2: Test the Endpoint

Before setting up the cron, test it manually:

```bash
curl -X POST https://api.horizon-jobs.ofeklabs.dev/api/automation/scrape
```

Expected response:
```json
{
  "success": true,
  "message": "Job scraping completed successfully",
  "timestamp": "2026-02-11T11:00:00.000Z"
}
```

## Alternative Schedules

Choose a time when job boards are most active:

- **11 AM UTC** (6 AM EST / 3 AM PST): `0 11 * * *` - Early morning US time
- **2 PM UTC** (9 AM EST / 6 AM PST): `0 14 * * *` - Start of US business day
- **6 PM UTC** (1 PM EST / 10 AM PST): `0 18 * * *` - Mid-day US time
- **Weekdays only at 11 AM**: `0 11 * * 1-5` - Monday-Friday only

## Manual Trigger from UI

You can also manually trigger job scraping from the frontend:

1. Go to your dashboard
2. Click "Scrape Jobs Now" button (if implemented)
3. Or use the automation controls to start a search

## How It Works

1. **Cron job triggers** at 11 AM daily
2. **Endpoint called**: `POST /api/automation/scrape`
3. **Worker runs**: Scrapes jobs from RSS feeds, LinkedIn, Indeed
4. **Jobs scored**: Each job is scored against your profile
5. **Database updated**: New jobs appear in your dashboard
6. **You review**: Check dashboard for new matches

## What Gets Scraped

The worker scrapes from multiple sources:
- **RSS Feeds** (most reliable, always enabled)
- **LinkedIn** (optional, requires auth)
- **Indeed** (optional, has bot detection)

Default search query: "Full Stack Developer"
Max jobs per run: 10

## Monitoring

Check if the cron job is working:

1. **Render Dashboard**: View cron job logs
2. **Backend Logs**: Check your Render service logs for "Starting scrape job"
3. **Database**: Check if new jobs appear in your dashboard
4. **API Test**: Call the endpoint manually to verify it works

## Environment Variables Needed

Make sure your Render backend service has:
- `DATABASE_URL` - Your Supabase PostgreSQL connection string
- `OPENAI_API_KEY` - For job scoring (optional but recommended)
- `GROQ_API_KEY` - Alternative AI provider (optional)
- `NODE_ENV=production`

## Troubleshooting

**Cron job not running?**
- Check Render dashboard for error logs
- Verify the endpoint URL is correct
- Test the endpoint manually with curl

**No new jobs appearing?**
- Check backend logs for scraping errors
- Verify DATABASE_URL is set correctly
- Check if RSS feeds are accessible

**Jobs not scored?**
- Verify OPENAI_API_KEY or GROQ_API_KEY is set
- Check backend logs for scoring errors

## Future Enhancements

- Add UI controls to configure scraping frequency
- Store search preferences in database
- Add email notifications for high-scoring jobs
- Support multiple search queries
- Add more job board sources
