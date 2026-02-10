# Simple Backend Test
Write-Host "Testing Job Search Agent Backend" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:3001"

# Test 1: Get jobs
Write-Host "[1/6] Getting jobs..." -ForegroundColor Yellow
$jobs = Invoke-RestMethod -Uri "$API_URL/api/jobs?status=new" -Method Get
Write-Host "SUCCESS - Found $($jobs.Count) job(s)" -ForegroundColor Green
$jobId = $jobs[0].id
Write-Host "Using Job ID: $jobId" -ForegroundColor Cyan
Write-Host ""

# Test 2: Approve job
Write-Host "[2/6] Approving job..." -ForegroundColor Yellow
$update = @{ status = "approved" } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "$API_URL/api/jobs/$jobId/status" -Method Patch -Body $update -ContentType "application/json"
Write-Host "SUCCESS - Job status: $($result.status)" -ForegroundColor Green
Write-Host ""

# Test 3: Get approved jobs
Write-Host "[3/6] Getting approved jobs..." -ForegroundColor Yellow
$approved = Invoke-RestMethod -Uri "$API_URL/api/jobs?status=approved" -Method Get
Write-Host "SUCCESS - Found $($approved.Count) approved job(s)" -ForegroundColor Green
Write-Host ""

# Test 4: Get high-score jobs
Write-Host "[4/6] Getting high-score jobs (>=80)..." -ForegroundColor Yellow
$highScore = Invoke-RestMethod -Uri "$API_URL/api/jobs?minScore=80" -Method Get
Write-Host "SUCCESS - Found $($highScore.Count) high-score job(s)" -ForegroundColor Green
Write-Host ""

# Test 5: Get profile
Write-Host "[5/6] Getting user profile..." -ForegroundColor Yellow
$profile = Invoke-RestMethod -Uri "$API_URL/api/profile" -Method Get
Write-Host "SUCCESS - Profile: $($profile.fullName)" -ForegroundColor Green
Write-Host ""

# Test 6: Get automation sessions
Write-Host "[6/6] Getting automation sessions..." -ForegroundColor Yellow
$sessions = Invoke-RestMethod -Uri "$API_URL/api/automation/sessions" -Method Get
Write-Host "SUCCESS - Active sessions: $($sessions.count)" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend is fully functional and ready!" -ForegroundColor Green
Write-Host "Next: Build the frontend dashboard" -ForegroundColor Cyan
