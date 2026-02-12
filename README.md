# Horizon Job Filer

An intelligent job search automation tool that scrapes, scores, and helps you apply to relevant job postings.

## Features

- **Multi-Source Job Scraping**: Aggregates jobs from LinkedIn, Adzuna, and RSS feeds
- **AI-Powered Matching**: Scores jobs against your resume using AI
- **Smart Filtering**: Only shows jobs posted within the last 24-72 hours
- **Automated Application**: Helps fill out job applications automatically
- **Real-Time Updates**: WebSocket-based live updates during automation

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Supabase)
- **AI**: Groq API for job scoring
- **Deployment**: Vercel (frontend), Render (backend)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Groq API key (free at https://console.groq.com)
- Adzuna API key (free at https://developer.adzuna.com)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/OfekItzhaki/horizon-job-seeker.git
cd horizon-job-seeker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Backend `.env`:
```env
DATABASE_URL=your_postgres_url
GROQ_API_KEY=your_groq_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
PORT=3001
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Run database migrations:
```bash
cd backend
npm run db:migrate
```

5. Start the development servers:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

6. Open http://localhost:3000

## Usage

1. **Set Up Profile**: Upload your resume and fill in your details
2. **Refresh Jobs**: Click the "� Refresh Jobs" button to scrape fresh jobs
3. **Review Jobs**: Browse jobs sorted by match score
4. **Apply**: Click "Proceed" on interesting jobs to start automation

## Job Sources

- **LinkedIn Public API**: Last 24 hours, 50-100 jobs/day
- **Adzuna API**: Last 3 days, 100-200 jobs/day (20+ sources)
- **RSS Feeds**: Last 3 days, 10-20 jobs/day

Expected: **160-320 fresh jobs per day**

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │─────▶│   Express   │─────▶│  PostgreSQL │
│  Frontend   │      │   Backend   │      │  Database   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Scrapers  │
                     │  (Modular)  │
                     └─────────────┘
```

## Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [Deployment Guide](docs/DEPLOYMENT_STATUS.md)
- [Modular Scraper System](docs/MODULAR_SCRAPER_SYSTEM.md)
- [Adding Job Sources](docs/MULTIPLE_JOB_SOURCES.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Tech Stack Details](docs/TECH_STACK.md)

## Development

### Project Structure

```
├── backend/
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── automation/   # Job application automation
│   │   ├── config/       # Configuration files
│   │   ├── db/           # Database schema and migrations
│   │   ├── scraper/      # Job scrapers (modular)
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utilities
│   │   ├── websocket/    # WebSocket server
│   │   └── worker/       # Background job worker
│   └── drizzle/          # Database migrations
├── frontend/
│   └── app/
│       ├── components/   # React components
│       ├── lib/          # API client and hooks
│       └── profile/      # Profile page
└── docs/                 # Documentation
```

### Adding a New Job Scraper

See [Modular Scraper System](docs/MODULAR_SCRAPER_SYSTEM.md) for detailed instructions.

Quick steps:
1. Create scraper class in `backend/src/scraper/`
2. Add to factory in `scraperFactory.ts`
3. Add config in `scraperConfig.ts`

### Running Tests

```bash
cd backend
npm test
```

## Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL`

### Backend (Render)

1. Create new Web Service
2. Build command: `cd backend && npm install && npm run build`
3. Start command: `cd backend && npm run start:production`
4. Add environment variables (see `.env.example`)

See [Deployment Guide](docs/DEPLOYMENT_STATUS.md) for details.

## Contributing

This is a personal project, but suggestions are welcome!

## License

MIT

## Author

Ofek Itzhaki
