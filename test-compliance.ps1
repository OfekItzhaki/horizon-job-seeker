#!/usr/bin/env pwsh
# Horizon Standard Compliance Test Script
# Tests all aspects of the project against HORIZON_STANDARD requirements

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HORIZON STANDARD COMPLIANCE TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0
$PassCount = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [string]$WorkingDirectory = "."
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor Yellow
    
    try {
        Push-Location $WorkingDirectory
        $output = & $Command 2>&1
        $exitCode = $LASTEXITCODE
        Pop-Location
        
        if ($exitCode -eq 0) {
            Write-Host "  PASS" -ForegroundColor Green
            $script:PassCount++
            return $true
        } else {
            Write-Host "  FAIL" -ForegroundColor Red
            Write-Host "  Output: $output" -ForegroundColor Gray
            $script:ErrorCount++
            return $false
        }
    } catch {
        Pop-Location
        Write-Host "  ERROR: $_" -ForegroundColor Red
        $script:ErrorCount++
        return $false
    }
}

function Test-Warning {
    param(
        [string]$Name,
        [scriptblock]$Command,
        [string]$WorkingDirectory = "."
    )
    
    Write-Host "Checking: $Name..." -ForegroundColor Yellow
    
    try {
        Push-Location $WorkingDirectory
        $output = & $Command 2>&1
        $exitCode = $LASTEXITCODE
        Pop-Location
        
        if ($exitCode -eq 0) {
            Write-Host "  PASS" -ForegroundColor Green
            $script:PassCount++
            return $true
        } else {
            Write-Host "  WARNING" -ForegroundColor DarkYellow
            Write-Host "  Output: $output" -ForegroundColor Gray
            $script:WarningCount++
            return $false
        }
    } catch {
        Pop-Location
        Write-Host "  WARNING: $_" -ForegroundColor DarkYellow
        $script:WarningCount++
        return $false
    }
}

# Phase 1: Frontend Tests
Write-Host ""
Write-Host "=== FRONTEND TESTS ===" -ForegroundColor Cyan
Write-Host ""

Test-Step "Frontend - Linting" { npm run lint } "frontend"
Test-Step "Frontend - Build" { npm run build } "frontend"

# Phase 2: Backend Tests
Write-Host ""
Write-Host "=== BACKEND TESTS ===" -ForegroundColor Cyan
Write-Host ""

Test-Step "Backend - Linting" { npm run lint } "backend"
Test-Step "Backend - TypeScript Build" { npm run build } "backend"
Test-Step "Backend - Unit Tests" { npm test } "backend"

# Phase 3: Code Quality Checks
Write-Host ""
Write-Host "=== CODE QUALITY CHECKS ===" -ForegroundColor Cyan
Write-Host ""

# Check for 'any' types in TypeScript files
Write-Host "Checking: TypeScript 'any' types..." -ForegroundColor Yellow
$anyCount = (Get-ChildItem -Path "." -Include "*.ts","*.tsx" -Recurse -File | 
    Select-String -Pattern ": any" | 
    Where-Object { $_.Line -notmatch "eslint-disable" }).Count

if ($anyCount -eq 0) {
    Write-Host "  PASS - No 'any' types found" -ForegroundColor Green
    $PassCount++
} else {
    Write-Host "  WARNING - Found $anyCount 'any' types" -ForegroundColor DarkYellow
    $WarningCount++
}

# Check for console.log in production code
Write-Host "Checking: Console.log statements..." -ForegroundColor Yellow
$consoleCount = (Get-ChildItem -Path "." -Include "*.ts","*.tsx" -Recurse -File | 
    Where-Object { $_.FullName -notmatch "test" } |
    Select-String -Pattern "console\.log" | 
    Where-Object { $_.Line -notmatch "//" }).Count

if ($consoleCount -eq 0) {
    Write-Host "  PASS - No console.log found" -ForegroundColor Green
    $PassCount++
} else {
    Write-Host "  WARNING - Found $consoleCount console.log statements" -ForegroundColor DarkYellow
    $WarningCount++
}

# Phase 4: Documentation Checks
Write-Host ""
Write-Host "=== DOCUMENTATION CHECKS ===" -ForegroundColor Cyan
Write-Host ""

$requiredDocs = @(
    "README.md",
    "HORIZON_STANDARD.md",
    "docs/ARCHITECTURE.md",
    "docs/TECH_STACK.md"
)

foreach ($doc in $requiredDocs) {
    if (Test-Path $doc) {
        Write-Host "  PASS - $doc exists" -ForegroundColor Green
        $PassCount++
    } else {
        Write-Host "  FAIL - $doc missing" -ForegroundColor Red
        $ErrorCount++
    }
}

# Phase 5: Infrastructure Checks
Write-Host ""
Write-Host "=== INFRASTRUCTURE CHECKS ===" -ForegroundColor Cyan
Write-Host ""

$infraFiles = @(
    @{ Name = "Dockerfile (backend)"; Path = "backend/Dockerfile"; Required = $false },
    @{ Name = "Dockerfile (frontend)"; Path = "frontend/Dockerfile"; Required = $false },
    @{ Name = "docker-compose.yml"; Path = "docker-compose.yml"; Required = $false },
    @{ Name = ".env.example"; Path = ".env.example"; Required = $true },
    @{ Name = "package.json"; Path = "package.json"; Required = $true }
)

foreach ($file in $infraFiles) {
    if (Test-Path $file.Path) {
        Write-Host "  PASS - $($file.Name) exists" -ForegroundColor Green
        $PassCount++
    } else {
        if ($file.Required) {
            Write-Host "  FAIL - $($file.Name) missing" -ForegroundColor Red
            $ErrorCount++
        } else {
            Write-Host "  WARNING - $($file.Name) missing (recommended)" -ForegroundColor DarkYellow
            $WarningCount++
        }
    }
}

# Phase 6: Security Checks
Write-Host ""
Write-Host "=== SECURITY CHECKS ===" -ForegroundColor Cyan
Write-Host ""

# Check for hardcoded secrets
Write-Host "Checking: Hardcoded secrets..." -ForegroundColor Yellow
$secretPatterns = @('password\s*=\s*[''"]', 'api_key\s*=\s*[''"]', 'secret\s*=\s*[''"]')
$secretCount = 0

foreach ($pattern in $secretPatterns) {
    $matches = Get-ChildItem -Path "." -Include "*.ts","*.tsx","*.js" -Recurse -File | 
        Where-Object { $_.FullName -notmatch "node_modules" } |
        Select-String -Pattern $pattern
    $secretCount += $matches.Count
}

if ($secretCount -eq 0) {
    Write-Host "  PASS - No hardcoded secrets found" -ForegroundColor Green
    $PassCount++
} else {
    Write-Host "  FAIL - Found $secretCount potential hardcoded secrets" -ForegroundColor Red
    $ErrorCount++
}

# Check for .env in .gitignore
Write-Host "Checking: .env in .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "  PASS - .env is in .gitignore" -ForegroundColor Green
        $PassCount++
    } else {
        Write-Host "  FAIL - .env not in .gitignore" -ForegroundColor Red
        $ErrorCount++
    }
} else {
    Write-Host "  FAIL - .gitignore missing" -ForegroundColor Red
    $ErrorCount++
}

# Final Report
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed:   $PassCount" -ForegroundColor Green
Write-Host "  Warnings: $WarningCount" -ForegroundColor DarkYellow
Write-Host "  Errors:   $ErrorCount" -ForegroundColor Red
Write-Host ""

$TotalTests = $PassCount + $WarningCount + $ErrorCount
$PassPercentage = [math]::Round(($PassCount / $TotalTests) * 100, 1)

Write-Host "  Pass Rate: $PassPercentage%" -ForegroundColor $(if ($PassPercentage -ge 80) { "Green" } elseif ($PassPercentage -ge 60) { "DarkYellow" } else { "Red" })
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "  STATUS: FULL COMPLIANCE" -ForegroundColor Green
    Write-Host ""
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "  STATUS: PARTIAL COMPLIANCE (Warnings Only)" -ForegroundColor DarkYellow
    Write-Host ""
    exit 0
} else {
    Write-Host "  STATUS: NON-COMPLIANT (Errors Present)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please review HORIZON_COMPLIANCE_REPORT.md for details" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
