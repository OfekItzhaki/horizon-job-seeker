# 🐳 Docker Setup Guide - Horizon Job Filer

Complete guide for running Horizon Job Filer with Docker.

---

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- 4GB+ RAM available
- 10GB+ disk space

---

## 🚀 Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/yourusername/horizon-job-filer.git
cd horizon-job-filer

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
# Required: GROQ_API_KEY or OPENAI_API_KEY
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                   (horizon-network)                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Frontend │  │ Backend  │  │  Worker  │  │Postgres│ │
│  │  :3000   │  │  :3001   │  │          │  │ :5432  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│       │             │              │             │      │
│       └─────────────┴──────────────┴─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Services

### Frontend (Next.js)
- **Port**: 3000
- **Image**: Built from `frontend/Dockerfile`
- **Health Check**: HTTP GET /
- **Dependencies**: Backend

### Backend (Express)
- **Port**: 3001
- **Image**: Built from `backend/Dockerfile`
- **Health Check**: HTTP GET /health
- **Dependencies**: PostgreSQL

### Worker (Background Jobs)
- **No exposed ports**
- **Image**: Same as Backend
- **Command**: `node dist/worker/index.js`
- **Dependencies**: PostgreSQL, Backend

### PostgreSQL
- **Port**: 5432
- **Image**: postgres:15-alpine
- **Volume**: `postgres_data`
- **Health Check**: `pg_isready`

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# AI Provider (groq or openai)
AI_PROVIDER=groq

# Groq API Key (free tier)
GROQ_API_KEY=your_groq_api_key_here

# OpenAI API Key (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Database (automatically configured in Docker)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/job_search_agent
```

### Docker Compose Override

For development, create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  backend:
    volumes:
      - ./backend/src:/app/src:ro
    environment:
      NODE_ENV: development
    command: ["npm", "run", "dev"]

  frontend:
    volumes:
      - ./frontend/app:/app/app:ro
    environment:
      NODE_ENV: development
    command: ["npm", "run", "dev"]
```

---

## 📝 Common Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with logs
docker-compose up
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Rebuild Services
```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Execute Commands
```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# Access database
docker-compose exec postgres psql -U postgres -d job_search_agent

# Shell access
docker-compose exec backend sh
```

---

## 🔍 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check service status
docker-compose ps

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check database health
docker-compose exec postgres pg_isready -U postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Port Conflicts

If ports 3000, 3001, or 5432 are already in use:

```yaml
# Edit docker-compose.yml
services:
  frontend:
    ports:
      - "3010:3000"  # Change host port
  backend:
    ports:
      - "3011:3001"
  postgres:
    ports:
      - "5433:5432"
```

### Build Failures

```bash
# Clean build cache
docker-compose build --no-cache

# Remove old images
docker image prune -a

# Check disk space
docker system df
```

---

## 🧪 Testing in Docker

### Run Tests
```bash
# Backend tests
docker-compose exec backend npm test

# With coverage
docker-compose exec backend npm test -- --coverage
```

### Run Linting
```bash
# Backend
docker-compose exec backend npm run lint

# Frontend
docker-compose exec frontend npm run lint
```

---

## 📊 Monitoring

### Health Checks

All services have health checks configured:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect horizon-backend | grep -A 10 Health
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific service
docker stats horizon-backend
```

---

## 🔒 Security

### Production Considerations

1. **Change default passwords**
   ```yaml
   postgres:
     environment:
       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
   ```

2. **Use secrets management**
   ```yaml
   services:
     backend:
       secrets:
         - groq_api_key
   secrets:
     groq_api_key:
       file: ./secrets/groq_api_key.txt
   ```

3. **Enable TLS**
   - Use reverse proxy (nginx, traefik)
   - Configure SSL certificates
   - Update CORS settings

4. **Limit resource usage**
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```

---

## 🚀 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml horizon

# View services
docker service ls

# Scale services
docker service scale horizon_worker=3
```

### Using Kubernetes

```bash
# Convert to Kubernetes
kompose convert -f docker-compose.yml

# Apply to cluster
kubectl apply -f .

# View pods
kubectl get pods
```

---

## 📈 Performance Optimization

### Build Optimization

```dockerfile
# Use multi-stage builds (already implemented)
# Use .dockerignore (already implemented)
# Use layer caching
```

### Runtime Optimization

```yaml
services:
  backend:
    environment:
      NODE_ENV: production
      NODE_OPTIONS: --max-old-space-size=512
```

---

## 🔄 Updates and Maintenance

### Update Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest
docker-compose build --pull

# Restart services
docker-compose up -d
```

### Backup Database

```bash
# Backup
docker-compose exec postgres pg_dump -U postgres job_search_agent > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres job_search_agent < backup.sql
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Check health: `docker-compose ps`
4. Review documentation
5. Open an issue on GitHub

---

**Built with ❤️ using Docker and The Horizon Standard**

*Last Updated: February 2026*
