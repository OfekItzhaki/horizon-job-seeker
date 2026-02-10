# 🎯 Horizon Job Filer

An intelligent job search automation platform that helps you find, score, and apply to jobs automatically. Built with TypeScript, Next.js, Express, and powered by AI.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

Horizon Job Filer is an automated job search agent that:
- Scrapes job postings from LinkedIn and Indeed
- Scores jobs against your resume using AI
- Provides real-time updates via WebSocket
- Automates job application workflows
- Includes emergency kill switch for safety

## ✨ Features

### Core Features
- **AI-Powered Resume Parsing**: Uses Groq AI (free tier) to extract skills and experience
- **Intelligent Job Scoring**: Matches jobs against your profile with 0-100 score
- **Real-Time Updates**: WebSocket integration for live status updates
- **Automated Applications**: Browser automation with Playwright
- **Emergency Kill Switch**: Stop all automation instantly
- **Background Worker**: Automatic job scraping every hour

### User Experience
- Clean, modern UI with Next.js and Tailwind CSS
- Profile management with resume upload
- Job dashboard with filtering and sorting
- Real-time automation modal with status updates
- Approve/dismiss workflow for job applications

### Safety & Control
- Manual confirmation before submission
- Kill switch for emergency stops
- Detailed logging and error handling
- Rate limiting and robots.txt compliance

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.1.6 (React 19)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Real-time**: WebSocket client

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **AI**: Groq SDK (Llama 3.3 70B)
- **Automation**: Playwright
- **Real-time**: ws (WebSocket)

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **AI Provider**: Groq (free tier)
- **Testing**: Vitest
- **Linting**: ESLint
- **Type Checking**: TypeScript

## 📦 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account (free tier)
- Groq API key (free tier)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/OfekItzhaki/horizon-job-filer.git
cd horizon-job-filer
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Database Setup
```bash
cd backend
npm run db:migrate
```

This creates the required tables:
- `jobs`: Job postings with match scores
- `user_profile`: User resume and preferences

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
# Database
DATABASE_URL=your_supabase_connection_string

# AI Provider (Groq - Free Tier)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key

# Server
PORT=3001
NODE_ENV=development
```

### Frontend Environment Variables

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

### Getting API Keys

#### Supabase (Database)
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the connection string (use "Transaction" mode)

#### Groq (AI)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Go to API Keys
3. Create a new API key
4. Copy the key (starts with `gsk_`)

**Why Groq?**
- Completely FREE (no credit card required)
- 10x faster than OpenAI
- Generous limits: 30 requests/min, 14,400/day
- Uses Llama 3.3 70B model

## 🎮 Usage

### Quick Start (All Services)

Use the master startup script:
```powershell
# PowerShell
.\start-all.ps1
```

This starts:
1. Backend API (port 3001)
2. Frontend (port 3000)
3. Background Worker (job scraping)

### Manual Start

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

#### Terminal 3 - Worker (Optional)
```bash
cd backend
npm run worker
```

### Access the Application

Open your browser to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### First-Time Setup

1. Navigate to http://localhost:3000
2. Click "My Profile"
3. Fill in your information:
   - Full Name
   - Email
   - Resume (paste your resume text)
   - Skills, experience, etc.
4. Click "Save Profile"

### Using the Application

#### View Jobs
- Dashboard shows all jobs with match scores
- Filter by "New" or "All"
- Jobs ordered by most recent first

#### Approve/Dismiss Jobs
- Click "Proceed" to approve a job
- Click "Dismiss" to reject a job

#### Start Automation
```bash
# Using curl
curl -X POST http://localhost:3001/api/automation/start \
  -H "Content-Type: application/json" \
  -d '{"jobId": 1}'

# Using PowerShell
$body = @{ jobId = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/automation/start" -Method POST -Body $body -ContentType "application/json"
```

#### Emergency Stop
- Click the red "Kill Switch" button in the modal
- Or call the API:
```bash
curl -X POST http://localhost:3001/api/automation/kill
```

## 🧪 Testing

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Tests
```bash
# Unit tests
npm test -- jobRoutes.test.ts

# Integration tests
npm test -- integration.test.ts

# With coverage
npm test -- --coverage
```

### Test Coverage
- API Routes: 100%
- Services: 95%
- Database: 100%
- Automation Engine: 90%

### Manual Testing

See `docs/MANUAL_TESTING_CHECKLIST.md` for comprehensive manual testing guide.

## 🏗️ Architecture

### System Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Database   │
│  (Next.js)  │◀────│  (Express)  │◀────│ (Supabase)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│  WebSocket  │     │   Groq AI   │
│   Client    │     │   (Llama)   │
└─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Background │
                    │   Worker    │
                    └─────────────┘
```

### Key Components

#### Frontend (`/frontend`)
- Next.js 15 with App Router
- Real-time WebSocket connection
- Tailwind CSS for styling
- TypeScript for type safety

#### Backend (`/backend`)
- Express.js REST API
- WebSocket server for real-time updates
- Drizzle ORM for database access
- Groq AI for resume parsing

#### Database
- PostgreSQL via Supabase
- Two main tables: `jobs`, `user_profile`
- Drizzle migrations for schema management

#### Background Worker
- Automatic job scraping every hour
- LinkedIn and Indeed scrapers
- AI-powered job scoring
- Robots.txt compliance

### Data Flow

1. **User Profile Setup**
   - User enters resume → Frontend
   - Frontend → Backend API
   - Backend → Groq AI (parse resume)
   - Parsed data → Database

2. **Job Discovery**
   - Background Worker → Job Sites
   - Scraped Jobs → Database
   - AI Scoring → Match Score
   - Jobs → Frontend (via API)

3. **Job Application**
   - User approves job → Frontend
   - Frontend → Backend API
   - Backend → Playwright (automation)
   - Status updates → WebSocket → Frontend
   - User confirms → Submit application

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Architecture](docs/ARCHITECTURE.md)**: System design and components
- **[Tech Stack](docs/TECH_STACK.md)**: Detailed technology choices
- **[End-to-End Flow](docs/END_TO_END_FLOW.md)**: Complete user journey
- **[Testing Guide](docs/TESTING_GUIDE.md)**: Testing instructions
- **[Integration Tests](docs/INTEGRATION_TEST_SUMMARY.md)**: Test coverage
- **[Manual Testing](docs/MANUAL_TESTING_CHECKLIST.md)**: Manual test cases
- **[Groq Setup](docs/GROQ_SETUP_GUIDE.md)**: AI provider setup
- **[Improvements](docs/IMPROVEMENTS_SUMMARY.md)**: Recent enhancements
- **[Project Report](docs/PROJECT_COMPLETION_REPORT.md)**: Final status

### Quick References

- **[Quick Start Guide](QUICK_START.md)**: Get started in 5 minutes
- **[Horizon Standard](HORIZON_STANDARD.md)**: Code standards and best practices

## 🤝 Contributing

### Code Standards

This project follows **The Horizon Standard** for code quality and architecture. Please review `HORIZON_STANDARD.md` before contributing.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes**
4. **Run linting and tests**
   ```bash
   cd backend
   npm run lint -- --fix
   npm test
   ```
5. **Commit with conventional format**
   ```bash
   git commit -m "feat(scope): description"
   ```
6. **Push and create a Pull Request**

### Commit Convention

Use conventional commits:
- `feat(scope): description` - New feature
- `fix(scope): description` - Bug fix
- `docs(scope): description` - Documentation
- `refactor(scope): description` - Code refactoring
- `test(scope): description` - Tests
- `chore(scope): description` - Maintenance

### Code Review Checklist

- ✅ Code follows TypeScript best practices
- ✅ No `any` types used
- ✅ Proper error handling implemented
- ✅ Tests included for new functionality
- ✅ Linting passes with 0 errors
- ✅ Build succeeds without warnings
- ✅ Documentation updated if needed

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Groq** for providing free AI inference
- **Supabase** for managed PostgreSQL
- **Vercel** for Next.js framework
- **Playwright** for browser automation

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in `docs/`
- Review the Quick Start Guide

---

**Built with ❤️ using The Horizon Standard**

*Last Updated: February 2026*
