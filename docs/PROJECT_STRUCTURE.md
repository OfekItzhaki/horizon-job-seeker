# Project Structure

## Root Directory

```
horizon-job-filer/
├── backend/              # Backend API and worker
├── frontend/             # Next.js frontend
├── docs/                 # Documentation
├── .github/              # GitHub Actions CI/CD
├── docker-compose.yml    # Docker setup
├── package.json          # Root package.json (npm workspaces)
├── start-all.ps1         # Start all services (Windows)
└── README.md             # Main documentation
```

## Backend Structure

```
backend/
├── src/
│   ├── api/              # Express API routes
│   │   ├── automationRoutes.ts    # Automation endpoints
│   │   ├── jobRoutes.ts           # Job CRUD endpoints
│   │   └── profileRoutes.ts       # Profile endpoints
│   │
│   ├── automation/       # Job application automation
│   │   ├── automationEngine.ts    # Main automation logic
│   │   └── killSwitch.test.ts     # Kill switch tests
│   │
│   ├── config/           # Configuration files
│   │   └── scraperConfig.ts       # Scraper configuration
│   │
│   ├── db/               # Database layer
│   │   ├── index.ts               # Database connection
│   │   ├── schema.ts              # Drizzle ORM schema
│   │   └── migrate.ts             # Migration runner
│   │
│   ├── scraper/          # Job scrapers (modular)
│   │   ├── baseScraper.ts         # Base scraper class
│   │   ├── scraperFactory.ts     # Factory pattern
│   │   ├── linkedinPublicScraper.ts
│   │   ├── adzunaScraper.ts
│   │   ├── rssJobScraper.ts
│   │   ├── linkedinScraper.ts     # (disabled)
│   │   └── indeedScraper.ts       # (disabled)
│   │
│   ├── services/         # Business logic
│   │   ├── jobService.ts          # Job operations
│   │   └── scoringService.ts      # AI job scoring
│   │
│   ├── utils/            # Utilities
│   │   ├── canonicalId.ts         # ID generation
│   │   ├── resumeParser.ts        # Resume parsing
│   │   └── robotsParser.ts        # robots.txt parser
│   │
│   ├── websocket/        # WebSocket server
│   │   └── websocketServer.ts     # Real-time updates
│   │
│   ├── worker/           # Background job worker
│   │   ├── backgroundWorker.ts    # Main worker
│   │   └── index.ts               # Worker entry point
│   │
│   ├── index.ts          # Express server entry
│   └── swagger.ts        # API documentation
│
├── drizzle/              # Database migrations
│   ├── 0000_*.sql
│   ├── 0001_*.sql
│   └── meta/
│
├── trigger-scraper.ts    # Manual scraper trigger
├── start-production.js   # Production startup script
├── package.json          # Backend dependencies
├── tsconfig.json         # TypeScript config
├── vitest.config.ts      # Test config
└── Dockerfile            # Docker image
```

## Frontend Structure

```
frontend/
├── app/
│   ├── components/       # React components
│   │   └── AutomationModal.tsx
│   │
│   ├── lib/              # Client libraries
│   │   ├── api.ts                 # API client
│   │   └── hooks.ts               # React Query hooks
│   │
│   ├── profile/          # Profile page
│   │   └── page.tsx
│   │
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page (job list)
│   ├── providers.tsx     # React Query provider
│   └── globals.css       # Global styles
│
├── public/               # Static assets
├── package.json          # Frontend dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind CSS config
├── next.config.ts        # Next.js config
└── Dockerfile            # Docker image
```

## Documentation Structure

```
docs/
├── ARCHITECTURE.md                # System architecture
├── TECH_STACK.md                  # Technology choices
├── DEPLOYMENT_STATUS.md           # Deployment guide
├── MODULAR_SCRAPER_SYSTEM.md      # Scraper system docs
├── MULTIPLE_JOB_SOURCES.md        # Job sources overview
├── FRESH_JOBS_SOLUTION.md         # Date filtering
├── REFRESH_JOBS_FEATURE.md        # Refresh button
├── RSS_FEED_GUIDE.md              # Adding RSS feeds
├── RENDER_CRON_SETUP.md           # Daily automation
├── USER_WORKFLOW.md               # User guide
├── QUICK_START.md                 # Getting started
├── TESTING_GUIDE.md               # Testing docs
└── PROJECT_STRUCTURE.md           # This file
```

## Key Files

### Configuration
- `backend/.env` - Backend environment variables
- `frontend/.env.local` - Frontend environment variables
- `backend/src/config/scraperConfig.ts` - Scraper configuration
- `backend/drizzle.config.ts` - Database configuration

### Entry Points
- `backend/src/index.ts` - Express server
- `backend/src/worker/index.ts` - Background worker
- `backend/start-production.js` - Production (server + worker)
- `frontend/app/page.tsx` - Frontend home page

### Database
- `backend/src/db/schema.ts` - Database schema
- `backend/drizzle/*.sql` - Migrations

### API
- `backend/src/api/jobRoutes.ts` - Job endpoints
- `backend/src/api/profileRoutes.ts` - Profile endpoints
- `backend/src/api/automationRoutes.ts` - Automation endpoints

### Scrapers
- `backend/src/scraper/linkedinPublicScraper.ts` - LinkedIn (24h)
- `backend/src/scraper/adzunaScraper.ts` - Adzuna (3d)
- `backend/src/scraper/rssJobScraper.ts` - RSS (3d)

## Scripts

### Backend
```bash
npm run dev          # Development server
npm run build        # Build TypeScript
npm run start        # Production server only
npm run start:production  # Server + worker
npm run worker       # Worker only
npm run scrape       # Manual scraper trigger
npm run test         # Run tests
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

### Root
```bash
npm install          # Install all dependencies
npm run dev          # Start all services
```

## Environment Variables

### Backend Required
```env
DATABASE_URL         # PostgreSQL connection string
GROQ_API_KEY        # Groq AI API key
ADZUNA_APP_ID       # Adzuna API app ID
ADZUNA_API_KEY      # Adzuna API key
PORT                # Server port (default: 3001)
```

### Frontend Required
```env
NEXT_PUBLIC_API_URL  # Backend API URL
```

## Database Schema

### Tables
- `jobs` - Job listings
- `application_submissions` - Application history
- `user_profile` - User profile and resume

### Enums
- `job_status` - new, rejected, approved, applied

## API Endpoints

### Jobs
- `GET /api/jobs` - List jobs
- `GET /api/jobs/applied` - List applied jobs
- `GET /api/jobs/:id` - Get job details
- `PATCH /api/jobs/:id/status` - Update job status

### Profile
- `GET /api/profile` - Get profile
- `POST /api/profile` - Create/update profile
- `POST /api/profile/upload-resume` - Upload resume

### Automation
- `POST /api/automation/start` - Start automation
- `POST /api/automation/confirm` - Confirm submission
- `POST /api/automation/cancel` - Cancel automation
- `POST /api/automation/kill` - Kill all sessions
- `POST /api/automation/scrape` - Trigger scraping
- `GET /api/automation/sessions` - List sessions
- `GET /api/automation/scrapers` - Scraper status

## WebSocket Events

- `connected` - Connection established
- `automation_started` - Automation began
- `automation_filling` - Filling form
- `automation_paused` - Paused at submit
- `automation_submitted` - Application submitted
- `automation_cancelled` - Automation cancelled
- `automation_error` - Error occurred

## Testing

### Unit Tests
- `backend/src/db/schema.test.ts` - Schema tests
- `backend/src/utils/canonicalId.test.ts` - ID tests
- `backend/src/automation/killSwitch.test.ts` - Kill switch tests

### Integration Tests
- `backend/src/integration.test.ts` - Full workflow tests
- `backend/src/api/*.test.ts` - API endpoint tests

### Manual Testing
- `backend/trigger-scraper.ts` - Test scraper manually
- `start-all.ps1` - Test full stack locally

## Deployment

### Frontend (Vercel)
- Build: `cd frontend && npm run build`
- Output: `.next/`
- Environment: `NEXT_PUBLIC_API_URL`

### Backend (Render)
- Build: `cd backend && npm install && npm run build`
- Start: `cd backend && npm run start:production`
- Environment: All backend env vars

## Development Workflow

1. **Local Development**
   ```bash
   npm install
   npm run dev
   ```

2. **Make Changes**
   - Edit code in `backend/src/` or `frontend/app/`
   - Hot reload is enabled

3. **Test**
   ```bash
   cd backend
   npm test
   ```

4. **Build**
   ```bash
   cd backend && npm run build
   cd frontend && npm run build
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "feat: description"
   git push origin main
   ```

## Adding Features

### Add a New Scraper
1. Create `backend/src/scraper/yourScraper.ts`
2. Add to `backend/src/scraper/scraperFactory.ts`
3. Add config to `backend/src/config/scraperConfig.ts`

### Add a New API Endpoint
1. Add route to `backend/src/api/yourRoutes.ts`
2. Register in `backend/src/index.ts`
3. Add Swagger docs

### Add a New Frontend Page
1. Create `frontend/app/your-page/page.tsx`
2. Add navigation link
3. Create API hooks if needed

## Troubleshooting

### Build Errors
- Check TypeScript errors: `npm run build`
- Check linting: `npm run lint`

### Database Issues
- Check connection: `npm run db:studio`
- Run migrations: `npm run db:migrate`

### Scraper Issues
- Check logs in console
- Test manually: `npm run scrape`
- Check API credentials in `.env`

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [React Query Docs](https://tanstack.com/query/latest)
