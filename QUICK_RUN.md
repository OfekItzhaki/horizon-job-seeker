# 🚀 Quick Run Guide

## Start Everything (3 Terminals)

### Terminal 1 - Backend API
```powershell
cd backend
npm run dev
```
**Wait for**: "Server running on port 3001"

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```
**Wait for**: "Local: http://localhost:3000"

### Terminal 3 - Background Worker (Real Jobs!)
```powershell
cd backend
npm run worker
```
**Wait for**: "Starting background worker"

## 🎯 What to Do Next

### 1. Upload Your Resume
1. Go to http://localhost:3000/profile
2. **Upload PDF/DOCX** at the top (drag & drop or click)
3. AI will parse it automatically
4. Click "Save Profile"

### 2. View Real Jobs
1. Go to http://localhost:3000
2. See jobs with match scores (refreshes every minute)
3. Filter by "New" to see only new jobs

### 3. Test Automation
1. Click "Proceed" on a job to approve it
2. Use API to start automation:
```powershell
$body = @{ jobId = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/automation/start" -Method POST -Body $body -ContentType "application/json"
```

## 📊 Check Status

### See Current Jobs
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/jobs" -Method GET | Select-Object -First 5 | Format-List
```

### Add Test Jobs (if needed)
```powershell
cd backend
.\add-test-jobs.ps1
```

## 🔧 Troubleshooting

### Backend won't start
- Check port 3001 is free
- Verify `.env` file exists in `backend/`
- Check DATABASE_URL and GROQ_API_KEY are set

### Frontend won't start
- Check port 3000 is free
- Run `npm install` in frontend directory

### Worker not finding jobs
- It's working! Check logs for "Found X jobs from rss"
- Duplicates are skipped (this is good!)
- New jobs appear every minute

### PDF upload not working
- Make sure backend is running
- Check file is PDF or DOCX
- Max file size: 10MB

## ✅ Everything Working When You See

**Backend:**
```
Server running on port 3001
WebSocket server running on ws://localhost:3001/ws
```

**Frontend:**
```
- Local:        http://localhost:3000
```

**Worker:**
```
Found 10 jobs from rss
Processing new job: Company - Title
Match score: 85/100
✓ Stored job: Company - Title
```

## 🎉 You're Ready!

Your Job Search Agent is now:
- ✅ Scraping real jobs every minute
- ✅ Scoring them with AI (free Groq)
- ✅ Ready to automate applications
- ✅ Accepting PDF/DOCX resume uploads

**Happy job hunting! 🚀**
