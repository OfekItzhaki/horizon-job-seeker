# Background Worker Startup Script
# This script starts the background worker for job scraping and scoring

Write-Host "Starting Job Search Agent Background Worker..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with required environment variables." -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] Environment configured" -ForegroundColor Green
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "Starting background worker..." -ForegroundColor Cyan
Write-Host "   - Scraping jobs from LinkedIn and Indeed" -ForegroundColor Gray
Write-Host "   - Scoring jobs with Groq AI (Llama 3.3 70B)" -ForegroundColor Gray
Write-Host "   - Running every hour" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the worker" -ForegroundColor Yellow
Write-Host ""

# Start the worker
npm run worker
