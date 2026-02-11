# Add Test Jobs Script
# This script adds multiple test jobs to the database

Write-Host "Adding Test Jobs to Database..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Environment configured" -ForegroundColor Green
Write-Host ""

# Run the script
npx tsx add-test-jobs.ts

Write-Host ""
Write-Host "Done! Refresh your browser to see the new jobs." -ForegroundColor Green
