# Resume Parser Test Script
Write-Host "Testing Resume Parser" -ForegroundColor Cyan
Write-Host ""

$resumeText = "John Doe`nSenior Full Stack Developer`n`nWORK EXPERIENCE`n`nSenior Full Stack Developer at TechCorp`nJan 2020 - Present`n`nResponsibilities:`n- Led development of microservices`n- Mentored junior developers`n`nAchievements:`n- Reduced API response time by 40%`n- Implemented CI/CD pipeline`n`nSKILLS`n`nReact, Node.js, TypeScript, PostgreSQL, Docker, AWS`n`nEDUCATION`n`nBachelor of Science in Computer Science`nUniversity of California, 2018`nGPA: 3.8/4.0"

$body = @{ resumeText = $resumeText } | ConvertTo-Json

Write-Host "Sending resume to parser..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/profile/parse-resume" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "Resume parsed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Work Experience: $($response.structuredData.workExperience.Count) positions" -ForegroundColor Yellow
    Write-Host "Skills: $($response.structuredData.skills.Count) skills" -ForegroundColor Yellow
    Write-Host "Education: $($response.structuredData.education.Count) degrees" -ForegroundColor Yellow
    Write-Host "Suggested Job Titles: $($response.desiredJobTitles -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Test PASSED!" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure backend is running: cd backend; npm run dev" -ForegroundColor Yellow
    exit 1
}
