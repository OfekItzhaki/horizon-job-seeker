# Remove Test Jobs Script
# This script removes test jobs from the database

Write-Host "Removing Test Jobs from Database..." -ForegroundColor Cyan
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
npx tsx remove-test-jobs.ts

Write-Host ""
Write-Host "Done! Refresh your browser to see only real jobs." -ForegroundColor Green
