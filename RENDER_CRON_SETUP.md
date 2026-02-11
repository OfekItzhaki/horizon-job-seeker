# Render Cron Job Setup

Since your backend is deployed on Render, you can set up a cron job there to automatically scrape jobs.

## Option 1: Render Cron Jobs (Recommended for Hobby)

Render offers cron jobs on their free tier. Here's how to set it up:

1. Go to your Render Dashboard: https://dashboard.render.com
2. Click "New +" → "Cron Job"
3. Configure:
   - **Name**: `horizon-job-scraper`
   - **Environment**: Same as your backend service
   - **Command**: `curl -X POST https://api.horizon-jobs.ofeklabs.dev/api/automation/start -H "Content-Type: application/json" -d '{"searchQuery":"software engineer","maxJobs":50,"autoApply":false}'`
   - **Schedule**: `0 9 * * *` (runs once daily at 9 AM UTC)
   - Or use: `0 0 * * *` (runs once daily at midnight UTC)

## Option 2: Manual Trigger via Frontend

For now, you can manually trigger job searches from the frontend UI:
1. Go to your profile page
2. Set up your preferences
3. Click "Start Automation" to manually trigger a job search

## Option 3: External Cron Service (UptimeRobot)

Use UptimeRobot (free tier) to ping your automation endpoint:
1. Create a monitor at https://uptimerobot.com
2. Set monitor type to "HTTP(s)"
3. URL: `https://api.horizon-jobs.ofeklabs.dev/api/automation/start`
4. Method: POST
5. Interval: Once per day (1440 minutes)
6. Add POST data:
   ```json
   {
     "searchQuery": "software engineer",
     "maxJobs": 50,
     "autoApply": false
   }
   ```

## Recommended Schedule

For a hobby project looking for jobs:
- **Once daily at 9 AM**: `0 9 * * *` - Good for checking new postings during business hours
- **Once daily at midnight**: `0 0 * * *` - Good for overnight processing
- **Weekdays only at 9 AM**: `0 9 * * 1-5` - Only run Monday-Friday

## Environment Variables Needed

Make sure your Render backend service has these environment variables set:
- `DATABASE_URL` - Your Supabase PostgreSQL connection string
- `OPENAI_API_KEY` - For job scoring
- `GROQ_API_KEY` - Alternative AI provider
- `NODE_ENV=production`

## Testing the Cron Job

Test manually first:
```bash
curl -X POST https://api.horizon-jobs.ofeklabs.dev/api/automation/start \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "software engineer",
    "maxJobs": 10,
    "autoApply": false
  }'
```

## Future Enhancements

Once you upgrade from hobby tier or want more control:
- Add a settings page in the UI to configure cron frequency
- Store cron preferences in the database
- Use Render's environment variables to configure the schedule
- Add email notifications when new jobs are found
