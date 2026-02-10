# Architecture Overview

## System Architecture

The Job Search Agent is a full-stack application with a clear separation between frontend, backend, and database layers.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    Next.js 16 + React                        │
│                   http://localhost:3000                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API + WebSocket
                     │
┌────────────────────▼────────────────────────────────────────┐
│                         Backend                              │
│                  Node.js + Express.js                        │
│                   http://localhost:3001                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   REST API   │  │  WebSocket   │  │   Worker     │     │
│  │  Endpoints   │  │    Server    │  │   Process    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Drizzle ORM
                     │
┌────────────────────▼────────────────────────────────────────┐
│                       Database                               │
│                PostgreSQL (Supabase)                         │
└──────────────────────────────────────────────────────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Groq AI    │  │  Playwright  │  │ Job Sites    │
│ (Free Tier)  │  │  Automation  │  │ (LinkedIn,   │
│              │  │              │  │  Indeed)     │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Real-Time**: Native WebSocket API
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Real-Time**: ws (WebSocket library)
- **Automation**: Playwright
- **AI Integration**: Groq SDK (free tier)
- **PDF Generation**: pdfkit

### Database
- **Database**: PostgreSQL
- **Hosting**: Supabase (connection pooler)
- **Migrations**: Drizzle Kit

### External Services
- **AI Provider**: Groq (Llama 3.3 70B model)
- **Job Sources**: LinkedIn, Indeed
- **Browser Automation**: Playwright (Chromium)

## Core Components

### 1. Database Layer (`backend/src/db/`)
- **schema.ts**: Database schema definitions
- **index.ts**: Database connection and client
- **migrate.ts**: Migration runner

### 2. API Layer (`backend/src/api/`)
- **jobRoutes.ts**: Job management endpoints
- **profileRoutes.ts**: User profile endpoints
- **automationRoutes.ts**: Automation control endpoints

### 3. Services Layer (`backend/src/services/`)
- **jobService.ts**: Job business logic
- **scoringService.ts**: AI-powered job scoring

### 4. Automation Layer (`backend/src/automation/`)
- **automationEngine.ts**: Playwright automation orchestration

### 5. Scraper Layer (`backend/src/scraper/`)
- **baseScraper.ts**: Base scraper with rate limiting
- **linkedinScraper.ts**: LinkedIn job scraper
- **indeedScraper.ts**: Indeed job scraper

### 6. Worker Layer (`backend/src/worker/`)
- **backgroundWorker.ts**: Periodic job scraping and scoring

### 7. WebSocket Layer (`backend/src/websocket/`)
- **websocketServer.ts**: Real-time status updates

### 8. Utilities (`backend/src/utils/`)
- **resumeParser.ts**: AI-powered resume parsing
- **canonicalId.ts**: Job deduplication
- **robotsParser.ts**: Robots.txt compliance

## Data Flow

### Job Discovery Flow
```
1. Background Worker (Periodic)
   ↓
2. Scraper (LinkedIn/Indeed)
   ↓
3. Canonical ID Generation
   ↓
4. Duplicate Check
   ↓
5. Store in Database (status: 'new')
   ↓
6. AI Scoring (Groq)
   ↓
7. Update match_score
   ↓
8. Display in Frontend
```

### Profile Creation Flow
```
1. User pastes resume
   ↓
2. Frontend → POST /api/profile/parse-resume
   ↓
3. Backend → Groq AI
   ↓
4. Extract structured data
   ↓
5. Return to Frontend
   ↓
6. User reviews and saves
   ↓
7. Store in Database
```

### Job Application Flow
```
1. User clicks "Proceed" (approve job)
   ↓
2. Frontend → PATCH /api/jobs/:id/status
   ↓
3. Status: 'new' → 'approved'
   ↓
4. User triggers automation
   ↓
5. Backend → Playwright launches browser
   ↓
6. Navigate to job URL
   ↓
7. AI detects form fields
   ↓
8. Fill form with profile data
   ↓
9. Pause at submit button
   ↓
10. WebSocket → Frontend (status: 'paused')
    ↓
11. User reviews and confirms
    ↓
12. Click submit button
    ↓
13. Status: 'approved' → 'applied'
    ↓
14. Close browser
```

## Security Architecture

### Authentication
- Currently single-user (no authentication)
- Ready for JWT/OAuth integration

### API Security
- CORS enabled for localhost
- Rate limiting on scraper (30s delays)
- Robots.txt compliance
- User-Agent identification

### Data Security
- Environment variables for secrets
- No API keys in code
- Database connection pooling
- Prepared statements (SQL injection prevention)

### Automation Security
- Human-in-the-loop (never auto-submits)
- Kill switch for emergency stop
- Browser crash recovery
- Session timeout handling

## Scalability Considerations

### Current Architecture
- Single-user design
- Local browser automation
- Periodic background worker

### Future Scalability
- Multi-user support (add authentication)
- Distributed job queue (BullMQ)
- Horizontal scaling (multiple workers)
- Caching layer (Redis)
- CDN for static assets

## Performance Optimizations

### Frontend
- Next.js App Router (server components)
- WebSocket for real-time updates (no polling)
- Lazy loading components
- Optimized images

### Backend
- Connection pooling (Supabase pooler)
- Indexed database queries
- Async/await throughout
- Efficient ORM queries (Drizzle)

### AI Integration
- Groq (10x faster than OpenAI)
- Streaming responses
- Timeout handling
- Retry logic

## Monitoring & Observability

### Logging
- Console logging (structured)
- Error tracking
- Automation event logging
- Kill switch activation logging

### Health Checks
- GET /health endpoint
- Database connectivity check
- Service status monitoring

### Metrics
- Job scraping rate
- AI scoring performance
- Automation success rate
- WebSocket connection status
