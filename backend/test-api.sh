#!/bin/bash

echo "🧪 Testing Job Search Agent API"
echo "================================"
echo ""

API_URL="http://localhost:3001"

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
curl -s $API_URL/health | jq .
echo ""

# Test 2: Create User Profile
echo "2️⃣ Creating User Profile..."
curl -s -X PUT $API_URL/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "githubUrl": "https://github.com/johndoe",
    "resumeText": "Experienced Full Stack Developer with 5+ years in React, Node.js, TypeScript, and PostgreSQL. Built scalable web applications and RESTful APIs. Strong problem-solving skills and passion for clean code.",
    "bio": "Passionate developer seeking new opportunities"
  }' | jq .
echo ""

# Test 3: Get User Profile
echo "3️⃣ Getting User Profile..."
curl -s $API_URL/api/profile | jq .
echo ""

# Test 4: Create Test Jobs
echo "4️⃣ Creating Test Jobs..."
curl -s -X POST $API_URL/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "jobUrl": "https://example.com/job/1",
    "company": "Tech Corp",
    "title": "Senior Full Stack Developer",
    "description": "We are looking for an experienced Full Stack Developer with React and Node.js skills.",
    "matchScore": 85,
    "status": "new"
  }' 2>/dev/null || echo "Note: Direct job creation endpoint not implemented (use background worker)"
echo ""

# Test 5: Get All Jobs
echo "5️⃣ Getting All Jobs..."
curl -s "$API_URL/api/jobs" | jq .
echo ""

# Test 6: Get Jobs with Status Filter
echo "6️⃣ Getting Jobs with status=new..."
curl -s "$API_URL/api/jobs?status=new" | jq .
echo ""

# Test 7: Get Automation Sessions
echo "7️⃣ Getting Active Automation Sessions..."
curl -s $API_URL/api/automation/sessions | jq .
echo ""

echo "✅ API Tests Complete!"
echo ""
echo "Next steps:"
echo "  - Run the background worker to scrape jobs"
echo "  - Test automation by approving a job"
