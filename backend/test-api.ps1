# Job Search Agent API Test Script
Write-Host "🧪 Testing Job Search Agent API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:3001"

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    Write-Host "✅ Health check passed" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Create User Profile
Write-Host "2️⃣ Creating User Profile..." -ForegroundColor Yellow
$profileData = @{
    fullName = "John Doe"
    email = "john.doe@example.com"
    phone = "+1234567890"
    githubUrl = "https://github.com/johndoe"
    resumeText = "Experienced Full Stack Developer with 5+ years in React, Node.js, TypeScript, and PostgreSQL. Built scalable web applications and RESTful APIs. Strong problem-solving skills and passion for clean code."
    bio = "Passionate developer seeking new opportunities"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/profile" -Method Put -Body $profileData -ContentType "application/json"
    Write-Host "✅ Profile created successfully" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Profile creation failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get User Profile
Write-Host "3️⃣ Getting User Profile..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/profile" -Method Get
    Write-Host "✅ Profile retrieved successfully" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Profile retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get All Jobs
Write-Host "4️⃣ Getting All Jobs..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/jobs" -Method Get
    Write-Host "✅ Jobs retrieved successfully" -ForegroundColor Green
    Write-Host "Total jobs: $($response.Count)" -ForegroundColor Cyan
    if ($response.Count -gt 0) {
        $response | ConvertTo-Json
    } else {
        Write-Host "No jobs found. Run the background worker to scrape jobs." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Jobs retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Jobs with Status Filter
Write-Host "5️⃣ Getting Jobs with status=new..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/jobs?status=new" -Method Get
    Write-Host "✅ Filtered jobs retrieved successfully" -ForegroundColor Green
    Write-Host "New jobs: $($response.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Filtered jobs retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Automation Sessions
Write-Host "6️⃣ Getting Active Automation Sessions..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/automation/sessions" -Method Get
    Write-Host "✅ Sessions retrieved successfully" -ForegroundColor Green
    Write-Host "Active sessions: $($response.count)" -ForegroundColor Cyan
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Sessions retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ API Tests Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Run the background worker to scrape jobs: npm run worker" -ForegroundColor White
Write-Host "  - Test automation by approving a job" -ForegroundColor White
