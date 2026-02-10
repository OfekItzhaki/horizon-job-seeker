# Start All Services Script
# This script starts the backend, frontend, and optionally the background worker

Write-Host "🚀 Job Search Agent - Starting All Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host '🚀 $Name' -ForegroundColor Cyan; $Command"
}

# Start Backend
Write-Host "1️⃣  Starting Backend Server (Port 3001)..." -ForegroundColor Green
Start-Service -Name "Backend Server" -Path "$PSScriptRoot\backend" -Command "npm run dev"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "2️⃣  Starting Frontend Server (Port 3000)..." -ForegroundColor Green
Start-Service -Name "Frontend Server" -Path "$PSScriptRoot\frontend" -Command "npm run dev"
Start-Sleep -Seconds 2

# Ask about background worker
Write-Host ""
$startWorker = Read-Host "Do you want to start the Background Worker? (y/n)"
if ($startWorker -eq "y" -or $startWorker -eq "Y") {
    Write-Host "3️⃣  Starting Background Worker..." -ForegroundColor Green
    Start-Service -Name "Background Worker" -Path "$PSScriptRoot\backend" -Command "npm run worker"
} else {
    Write-Host "⏭️  Skipping Background Worker" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "   WebSocket: ws://localhost:3001/ws" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Close the PowerShell windows to stop the services" -ForegroundColor Yellow
Write-Host ""
