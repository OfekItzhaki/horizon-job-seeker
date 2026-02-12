# Refresh Jobs Feature

## Overview

Added a "Refresh Jobs" button to the frontend that allows users to manually trigger job scraping without waiting for the daily cron job.

## What Was Added

### 1. Frontend Button (frontend/app/page.tsx)
- New "🔄 Refresh Jobs" button in the header
- Shows loading spinner while scraping
- Displays confirmation dialog before starting
- Shows statistics after completion (new jobs, duplicates)
- Automatically refreshes the job list after scraping

### 2. Backend Statistics (backend/src/worker/backgroundWorker.ts)
- `runScrapeJob()` now returns statistics:
  - `newJobsCount`: Number of new jobs added to database
  - `duplicatesCount`: Number of duplicate jobs skipped
  - `totalScraped`: Total number of jobs scraped from RSS feeds
- `scrapeFromSource()` tracks statistics per source
- `processJob()` returns status: 'new', 'duplicate', or 'error'

### 3. API Response (backend/src/api/automationRoutes.ts)
- `/api/automation/scrape` endpoint now returns statistics
- Response includes:
  ```json
  {
    "success": true,
    "message": "Job scraping completed successfully",
    "newJobsCount": 5,
    "duplicatesCount": 45,
    "totalScraped": 50,
    "timestamp": "2026-02-11T19:56:30.000Z"
  }
  ```

## User Experience

1. User clicks "🔄 Refresh Jobs" button
2. Confirmation dialog appears: "This will scrape new jobs from RSS feeds. It may take 1-2 minutes. Continue?"
3. Button shows loading spinner: "Refreshing..."
4. After completion, alert shows statistics:
   ```
   ✓ Job scraping completed!
   
   New jobs found: 5
   Duplicates skipped: 45
   ```
5. Job list automatically refreshes to show new jobs

## Technical Details

### Button States
- **Normal**: Green button with "🔄 Refresh Jobs" text
- **Loading**: Gray button with spinner and "Refreshing..." text
- **Disabled**: Cannot click while refreshing

### Error Handling
- Network errors: Shows "Failed to refresh jobs. Please try again."
- Server errors: Returns 500 with error details
- User cancellation: No action taken

### Performance
- Scraping takes 1-2 minutes (depends on RSS feed response times)
- Processes up to 50 jobs per run
- Skips duplicates automatically
- Scores jobs against user profile

## Testing

### Local Testing
```bash
# 1. Start backend
cd backend
npm run dev

# 2. Start frontend (in another terminal)
cd frontend
npm run dev

# 3. Open http://localhost:3000
# 4. Click "🔄 Refresh Jobs" button
# 5. Wait for completion and check statistics
```

### Production Testing
```bash
# Test the API endpoint directly
curl -X POST https://horizon-job-filer.onrender.com/api/automation/scrape

# Or use the button in the deployed frontend
# Visit: https://horizon-jobs.ofeklabs.dev
```

## Files Changed

1. `frontend/app/page.tsx`
   - Added `refreshing` state
   - Added `handleRefreshJobs()` function
   - Added "Refresh Jobs" button in header
   - Added loading spinner and disabled state

2. `backend/src/worker/backgroundWorker.ts`
   - Updated `runScrapeJob()` to return statistics
   - Updated `scrapeFromSource()` to track statistics
   - Updated `processJob()` to return status

3. `backend/src/api/automationRoutes.ts`
   - Updated `/api/automation/scrape` to return statistics

## Benefits

1. **User Control**: Users can refresh jobs anytime without waiting for cron
2. **Transparency**: Shows exactly how many new jobs were found
3. **Feedback**: Clear loading state and completion message
4. **Efficiency**: Skips duplicates automatically
5. **Reliability**: Error handling for network issues

## Future Improvements

1. Add progress indicator showing which RSS feed is being scraped
2. Allow users to select specific RSS feeds to scrape
3. Add option to clear old jobs before scraping
4. Show estimated time remaining during scraping
5. Add notification when scraping completes (if user navigates away)
6. Add rate limiting to prevent abuse (e.g., max 1 scrape per 5 minutes)

## Related Documents

- `FRESH_JOBS_SOLUTION.md` - How to get fresh jobs
- `RSS_FEED_GUIDE.md` - How to add more RSS feeds
- `RENDER_CRON_SETUP.md` - How to set up daily cron job
- `DEPLOYMENT_STATUS.md` - Current deployment status
