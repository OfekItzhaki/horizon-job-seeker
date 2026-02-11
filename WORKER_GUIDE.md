# Background Worker Guide

## Overview

The background worker is designed to automatically scrape job postings from LinkedIn and Indeed, score them against your resume, and add them to your database.

## Current Status

⚠️ **Important**: The background worker uses web scraping with Playwright, which has limitations:

1. **LinkedIn**: Requires authentication and has strict anti-scraping measures
2. **Indeed**: Has bot detection and rate limiting
3. **Both**: Frequently change their HTML structure, breaking scrapers

## Why You're Not Getting New Jobs

The scrapers are likely failing silently due to:
- Authentication requirements (LinkedIn)
- Bot detection (both platforms)
- Changed page structures
- Rate limiting

## Solutions

### Option 1: Use Test Jobs (Recommended for Development)

We've created a script to add realistic test jobs:

```powershell
cd backend
.\add-test-jobs.ps1
```

This adds 5 test jobs from major tech companies with realistic descriptions and match scores.

### Option 2: Manual Job Entry

You can manually add jobs through the API:

```powershell
$body = @{
    jobUrl = "https://example.com/job/123"
    company = "Company Name"
    title = "Job Title"
    description = "Job description..."
    matchScore = 85
    status = "new"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/jobs" -Method POST -Body $body -ContentType "application/json"
```

### Option 3: Use Job Board APIs (Production)

For production use, consider:

1. **LinkedIn Jobs API** (requires partnership)
   - Official API with proper authentication
   - Reliable and legal
   - Costs money

2. **Indeed API** (requires approval)
   - Publisher API for job listings
   - Free tier available
   - Requires application approval

3. **Third-Party Services**
   - **Apify**: Pre-built scrapers for LinkedIn/Indeed
   - **ScraperAPI**: Handles proxies and bot detection
   - **RapidAPI**: Various job board APIs

4. **RSS Feeds**
   - Many job boards offer RSS feeds
   - Easy to parse
   - No authentication needed

## Testing the Worker

To test if the worker is running:

```powershell
cd backend
npm run worker
```

You'll see output like:
```
=== Starting scrape job ===
--- Scraping from linkedin ---
LinkedIn scraping error: [error details]
--- Scraping from indeed ---
Indeed scraping error: [error details]
=== Scrape job completed in 5000ms ===
```

The errors are expected without proper authentication/API access.

## Recommended Workflow

For development and testing:

1. **Add test jobs** using `add-test-jobs.ps1`
2. **Test the full workflow**:
   - View jobs in the dashboard
   - Approve jobs
   - Test automation
   - Review and submit applications

3. **For production**, integrate with:
   - Official APIs (LinkedIn, Indeed)
   - Third-party services (Apify, ScraperAPI)
   - RSS feeds from job boards

## Worker Configuration

The worker runs every hour by default. You can change the interval:

```powershell
# Run every 5 minutes (for testing)
npm run worker -- 300000

# Run every 30 minutes
npm run worker -- 1800000

# Run every hour (default)
npm run worker
```

## Monitoring

Check worker logs to see:
- When it runs
- How many jobs it finds
- Any errors encountered
- Jobs added to database

## Future Improvements

To make the worker production-ready:

1. **Integrate official APIs**
   - LinkedIn Jobs API
   - Indeed Publisher API
   - Other job board APIs

2. **Add proxy rotation**
   - Use services like ScraperAPI
   - Rotate user agents
   - Handle rate limiting

3. **Implement authentication**
   - Store LinkedIn credentials securely
   - Handle session management
   - Implement CAPTCHA solving

4. **Add monitoring**
   - Log scraping success/failure rates
   - Alert on repeated failures
   - Track job discovery metrics

5. **Improve scoring**
   - Use better AI models
   - Consider job location
   - Factor in salary ranges
   - Match against multiple criteria

## Summary

The background worker is a proof-of-concept that demonstrates the automation workflow. For development, use the test job scripts. For production, integrate with official APIs or third-party services.

**Quick Commands:**

```powershell
# Add 5 test jobs
cd backend
.\add-test-jobs.ps1

# Check current jobs
Invoke-RestMethod -Uri "http://localhost:3001/api/jobs" -Method GET

# Start worker (will likely fail without API access)
npm run worker
```
