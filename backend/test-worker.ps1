# Test Background Worker Script
# This script runs the worker once for testing

Write-Host "Testing Background Worker..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with required environment variables." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Environment configured" -ForegroundColor Green
Write-Host ""
Write-Host "Running worker once (60 second interval for testing)..." -ForegroundColor Cyan
Write-Host "This will scrape jobs and add them to the database." -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop after first run completes" -ForegroundColor Yellow
Write-Host ""

# Run the worker with 60 second interval (will run immediately, then wait 60s)
npm run worker -- 60000
