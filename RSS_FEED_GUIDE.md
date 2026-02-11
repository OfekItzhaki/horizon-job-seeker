# RSS Feed Guide - Adding Job Sources

## What is RSS?

**RSS (Really Simple Syndication)** is a standardized format for publishing website updates. Think of it as a "subscribe to updates" feature for websites.

**How it works:**
1. Website publishes an RSS feed (XML file) at a specific URL
2. Your app fetches this feed periodically
3. Parse the XML to extract job listings
4. No web scraping, no bot detection, completely legal!

## Finding RSS Feeds

### Method 1: Look for RSS Icons
Many job boards have an RSS icon (🔶) or "RSS" link in their footer or sidebar.

### Method 2: Check Common URLs
Try these patterns:
- `https://example.com/rss`
- `https://example.com/feed`
- `https://example.com/jobs.rss`
- `https://example.com/jobs/feed`
- `https://example.com/rss/jobs.xml`

### Method 3: View Page Source
1. Go to the job board website
2. Right-click → "View Page Source"
3. Search for "rss" or "feed"
4. Look for `<link rel="alternate" type="application/rss+xml">`

### Method 4: Use RSS Discovery Tools
- **RSS Feed Finder**: Browser extensions that detect RSS feeds
- **Feedly**: Try adding the website URL - it will find feeds
- **RSS.app**: Can create RSS feeds from websites that don't have them

## Current Job Sources

### ✅ Working Sources (Confirmed)
- **We Work Remotely**: `https://weworkremotely.com/categories/remote-programming-jobs.rss`
- **Hacker News Jobs**: `https://hnrss.org/jobs`
- **Lobsters**: `https://lobste.rs/t/job.rss`

### ⚠️ Need Verification (Israeli Job Boards)
These URLs are examples - you need to verify the actual RSS feed URLs:

1. **AllJobs.co.il**
   - Try: `https://www.alljobs.co.il/rss/jobs.xml`
   - Or: `https://www.alljobs.co.il/feed`
   - Check their website for RSS link

2. **Drushim.co.il**
   - Try: `https://www.drushim.co.il/rss/jobs.xml`
   - Or: `https://www.drushim.co.il/feed`
   - May require account/API access

3. **JobMaster.co.il**
   - Try: `https://www.jobmaster.co.il/rss/jobs.xml`
   - Check their website footer for RSS

4. **Comeet**
   - Comeet is an ATS (Applicant Tracking System)
   - Individual companies using Comeet may have RSS feeds
   - Example: `https://company-name.comeet.com/feed`

### 🌐 Tech-Specific Sources

1. **Stack Overflow Jobs**
   - URL: `https://stackoverflow.com/jobs/feed?q=YOUR_SEARCH_QUERY`
   - Supports search parameters
   - Example: `https://stackoverflow.com/jobs/feed?q=react+developer`

2. **RemoteOK**
   - URL: `https://remoteok.com/remote-KEYWORD-jobs.rss`
   - Example: `https://remoteok.com/remote-developer-jobs.rss`
   - Supports location filters

3. **GitHub Jobs** (Deprecated)
   - GitHub Jobs was shut down in 2021
   - Remove from feed list

4. **AngelList/Wellfound**
   - No public RSS feed
   - Requires API access (paid)
   - Alternative: Use their website with Playwright scraper

5. **Authentic Jobs**
   - URL: `https://authenticjobs.com/rss/custom.php?terms=YOUR_SEARCH`
   - Example: `https://authenticjobs.com/rss/custom.php?terms=react`

## How to Add a New RSS Feed

### Step 1: Find the RSS Feed URL
Use the methods above to find the feed URL.

### Step 2: Test the Feed
```bash
curl "https://example.com/feed.rss"
```

You should see XML output with job listings.

### Step 3: Add to the Scraper

Edit `backend/src/scraper/rssJobScraper.ts`:

```typescript
const rssFeeds = [
  // ... existing feeds ...
  
  // Your new feed
  `https://example.com/jobs.rss`,
];
```

### Step 4: Test Locally
```bash
cd backend
npm run worker
```

Check the logs to see if jobs are being scraped from your new feed.

## RSS Feed Best Practices

### 1. Respect Rate Limits
Add delays between feed requests:
```typescript
await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
```

### 2. Handle Errors Gracefully
Don't let one failed feed stop the entire scraping process:
```typescript
try {
  const feed = await parser.parseURL(feedUrl);
  // Process feed
} catch (error) {
  console.error(`Error fetching ${feedUrl}:`, error);
  // Continue with next feed
}
```

### 3. Cache Feed Results
Avoid fetching the same feed multiple times:
- Store last fetch time
- Only refetch if > 1 hour old
- Use ETags if supported

### 4. Filter by Location
For Israeli jobs, filter by keywords:
```typescript
const hasIsraeliLocation = 
  description.includes('Israel') ||
  description.includes('Tel Aviv') ||
  title.includes('Israel');
```

## Alternative: API Access

Some job boards offer APIs instead of RSS:

### LinkedIn Jobs API
- **Status**: Restricted, requires partnership
- **Alternative**: Use LinkedIn's public job search (no API)
- **Note**: Web scraping LinkedIn violates ToS

### Indeed API
- **Status**: Available for partners
- **URL**: https://www.indeed.com/publisher
- **Note**: Requires approval and API key

### Glassdoor API
- **Status**: Available for partners
- **URL**: https://www.glassdoor.com/developer/index.htm
- **Note**: Requires approval

## Creating RSS Feeds from Websites

If a job board doesn't have RSS, you can create one:

### Option 1: RSS.app
- URL: https://rss.app
- Create RSS feeds from any website
- Free tier available
- Monitors website for changes

### Option 2: Feed43
- URL: https://feed43.com
- Extract data from HTML pages
- Convert to RSS feed
- Free for simple feeds

### Option 3: Custom Scraper
Build a custom scraper using Playwright:
1. Navigate to job board
2. Extract job listings
3. Convert to RSS format
4. Cache and serve

## Monitoring Feed Health

### Check Feed Freshness
```typescript
const lastItem = feed.items[0];
const lastUpdate = new Date(lastItem.pubDate);
const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

if (hoursSinceUpdate > 48) {
  console.warn(`Feed ${feedUrl} hasn't updated in ${hoursSinceUpdate} hours`);
}
```

### Track Success Rate
```typescript
const stats = {
  totalFeeds: rssFeeds.length,
  successfulFeeds: 0,
  failedFeeds: 0,
  totalJobs: 0,
};

// After scraping
console.log(`Success rate: ${(stats.successfulFeeds / stats.totalFeeds * 100).toFixed(1)}%`);
```

## Troubleshooting

### Feed Returns 404
- URL might have changed
- Feed might be discontinued
- Check website for new RSS link

### Feed Returns Empty
- Feed might require authentication
- Feed might be rate-limited
- Try accessing from browser first

### Feed Has Invalid XML
- Some feeds have malformed XML
- Use a lenient XML parser
- Report issue to website owner

### Feed Has Old Jobs
- Some feeds only update daily
- Check `pubDate` to filter old jobs
- Consider using multiple sources

## Next Steps

1. **Verify Israeli Job Board RSS URLs**
   - Visit each website
   - Look for RSS links
   - Test the feeds

2. **Add More Sources**
   - Israeli tech communities
   - Local startup job boards
   - University career pages

3. **Implement Feed Management UI**
   - Add/remove feeds from dashboard
   - Enable/disable specific feeds
   - View feed statistics

4. **Add Location Filtering**
   - Filter by city (Tel Aviv, Jerusalem, etc.)
   - Filter by country (Israel)
   - Support remote jobs

5. **Implement Feed Caching**
   - Cache feed results for 1 hour
   - Reduce API calls
   - Improve performance
