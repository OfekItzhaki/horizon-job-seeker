# Technology Stack

## Overview

The Job Search Agent uses modern, production-ready technologies across the full stack.

## Frontend Stack

### Core Framework
- **Next.js 16.1.0**
  - App Router architecture
  - Server and client components
  - Built-in routing
  - Optimized production builds
  - Hot module replacement (HMR)

### Language
- **TypeScript 5.x**
  - Strong typing
  - IntelliSense support
  - Compile-time error checking
  - Better refactoring

### Styling
- **Tailwind CSS 4.0.0**
  - Utility-first CSS
  - Responsive design
  - Dark mode support
  - Custom configuration
  - JIT (Just-In-Time) compilation

### State Management
- **React Hooks**
  - useState for local state
  - useEffect for side effects
  - useRef for WebSocket connection
  - Custom hooks for reusable logic

### Real-Time Communication
- **Native WebSocket API**
  - Browser-native implementation
  - Auto-reconnect logic
  - Event-driven updates
  - Low latency

### HTTP Client
- **Fetch API**
  - Native browser API
  - Promise-based
  - Async/await support
  - JSON handling

## Backend Stack

### Runtime & Framework
- **Node.js 18+**
  - JavaScript runtime
  - Event-driven architecture
  - Non-blocking I/O
  - NPM ecosystem

- **Express.js 4.21.2**
  - Minimal web framework
  - Middleware support
  - Routing
  - HTTP utilities

### Language
- **TypeScript 5.x**
  - Type safety
  - ES modules support
  - Async/await
  - Decorators

### Database
- **PostgreSQL 14+**
  - Relational database
  - ACID compliance
  - JSON support
  - Full-text search
  - Hosted on Supabase

- **Drizzle ORM 0.38.3**
  - Type-safe queries
  - Schema migrations
  - Connection pooling
  - Query builder

### Real-Time
- **ws 8.18.0**
  - WebSocket server
  - Event broadcasting
  - Connection management
  - Low overhead

### Browser Automation
- **Playwright 1.49.1**
  - Cross-browser support
  - Headless/headed modes
  - Network interception
  - Screenshot capabilities
  - Form interaction

### AI Integration
- **Groq SDK 0.12.0**
  - Free tier access
  - Llama 3.3 70B model
  - Fast inference (10x faster than OpenAI)
  - Generous rate limits (30/min, 14,400/day)
  - JSON mode support

### PDF Generation
- **pdfkit 0.15.1**
  - PDF creation
  - Text formatting
  - Document generation
  - Buffer output

### Utilities
- **dotenv 16.4.7**
  - Environment variable management
  - Configuration loading
  - Secret management

## Database Stack

### Primary Database
- **PostgreSQL 14+**
  - Hosted on Supabase
  - Connection pooler (6543)
  - SSL encryption
  - Automatic backups

### Schema Management
- **Drizzle Kit**
  - Migration generation
  - Schema introspection
  - Migration runner
  - Version control

### Tables
1. **jobs**
   - Job listings
   - Match scores
   - Status tracking
   - Timestamps

2. **user_profile**
   - User information
   - Resume data
   - Structured profile
   - Job preferences

## Development Tools

### Package Management
- **npm**
  - Dependency management
  - Script runner
  - Version locking

### Build Tools
- **TypeScript Compiler (tsc)**
  - Type checking
  - ES module output
  - Source maps

- **Next.js Build**
  - Production optimization
  - Code splitting
  - Static generation

### Testing
- **Vitest 2.1.8**
  - Unit testing
  - Integration testing
  - Fast execution
  - TypeScript support

- **fast-check 3.24.2**
  - Property-based testing
  - Random test generation
  - Edge case discovery

### Code Quality
- **ESLint**
  - Code linting
  - Style enforcement
  - Error detection

- **Prettier** (via Tailwind)
  - Code formatting
  - Consistent style

## External Services

### AI Provider
- **Groq**
  - Model: llama-3.3-70b-versatile
  - Free tier
  - Fast inference
  - High accuracy

### Database Hosting
- **Supabase**
  - PostgreSQL hosting
  - Connection pooling
  - Real-time subscriptions
  - Authentication (future)

### Job Sources
- **LinkedIn**
  - Job listings
  - Company information
  - Job descriptions

- **Indeed**
  - Job listings
  - Salary information
  - Application links

## Infrastructure

### Development
- **Local Development**
  - Backend: http://localhost:3001
  - Frontend: http://localhost:3000
  - WebSocket: ws://localhost:3001/ws

### Production (Ready)
- **Frontend**: Vercel, Netlify, or static hosting
- **Backend**: Railway, Render, Heroku, or Node.js hosting
- **Database**: Supabase (already configured)

## Version Requirements

### Minimum Versions
- Node.js: 18.0.0+
- npm: 9.0.0+
- PostgreSQL: 14.0+

### Recommended Versions
- Node.js: 20.x LTS
- npm: 10.x
- PostgreSQL: 15.x

## Dependencies Summary

### Frontend Dependencies
```json
{
  "next": "16.1.0",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "tailwindcss": "4.0.0"
}
```

### Backend Dependencies
```json
{
  "express": "4.21.2",
  "drizzle-orm": "0.38.3",
  "playwright": "1.49.1",
  "groq-sdk": "0.12.0",
  "ws": "8.18.0",
  "pdfkit": "0.15.1",
  "dotenv": "16.4.7"
}
```

### Dev Dependencies
```json
{
  "typescript": "5.x",
  "vitest": "2.1.8",
  "fast-check": "3.24.2",
  "drizzle-kit": "0.30.1"
}
```

## Technology Choices Rationale

### Why Next.js?
- Server-side rendering
- Excellent developer experience
- Built-in routing
- Production optimizations
- Large ecosystem

### Why Express.js?
- Minimal and flexible
- Large middleware ecosystem
- Well-documented
- Industry standard
- Easy to learn

### Why Drizzle ORM?
- Type-safe queries
- Lightweight
- SQL-like syntax
- Great TypeScript support
- No runtime overhead

### Why Groq?
- **Free tier** (no cost)
- **10x faster** than OpenAI
- **High quality** (Llama 3.3 70B)
- **Generous limits** (14,400/day)
- **No credit card** required

### Why Playwright?
- Cross-browser support
- Modern API
- Reliable automation
- Active development
- Great documentation

### Why WebSocket?
- Real-time updates
- Low latency
- Bidirectional communication
- Native browser support
- Efficient protocol

## Future Technology Considerations

### Potential Additions
- **Redis**: Caching and session storage
- **BullMQ**: Distributed job queue
- **Sentry**: Error tracking
- **Prometheus**: Metrics collection
- **Docker**: Containerization
- **Kubernetes**: Orchestration

### Potential Upgrades
- **GraphQL**: Alternative to REST
- **tRPC**: Type-safe API layer
- **Prisma**: Alternative ORM
- **Turborepo**: Monorepo management
- **Nx**: Build system
