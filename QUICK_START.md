# 🚀 Quick Start Guide - Job Search Agent

Get your Job Search Agent up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier works!)
- OpenAI API key

## 1. Environment Setup

### Backend Environment
Create `backend/.env`:
```env
DATABASE_URL=your_supabase_connection_string_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

### Frontend Environment (Optional)
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

## 2. Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## 3. Database Setup

```bash
cd backend
npm run db:migrate
```

This creates the `jobs` and `user_profile` tables in your Supabase database.

## 4. Start the Servers

### Terminal 1 - Backend (API + WebSocket)
```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 3001
WebSocket server running on ws://localhost:3001/ws
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
- Local:        http://localhost:3000
```

## 5. Set Up Your Profile

1. Open http://localhost:3000 in your browser
2. Click "My Profile"
3. Fill in your information:
   - Full Name
   - Email
   - Phone (optional)
   - GitHub URL (optional)
   - Resume (paste your resume text)
   - Bio (optional)
4. Click "Save Profile"

## 6. Add Test Jobs

```powershell
# PowerShell
cd backend
$env:DATABASE_URL='your_supabase_connection_string_here'
npx tsx insert-test-job.ts
```

```bash
# Bash
cd backend
export DATABASE_URL='your_supabase_connection_string_here'
npx tsx insert-test-job.ts
```

Refresh the frontend to see the new job!

## 7. Test the Automation Flow

### Start Automation
```powershell
# PowerShell
$body = @{ jobId = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/automation/start" -Method POST -Body $body -ContentType "application/json"
```

```bash
# Bash
curl -X POST http://localhost:3001/api/automation/start \
  -H "Content-Type: application/json" \
  -d '{"jobId": 1}'
```

### Watch the Magic! ✨
1. Modal opens automatically in the frontend
2. Status updates in real-time:
   - "Starting automation..."
   - "Filling form..."
   - "Ready to submit - waiting for confirmation"
3. Review the filled form in the browser window
4. Click "Confirm Submission" or "Cancel"
5. Try the red "Kill Switch" button for emergency stop

## 8. Run the Background Worker (Optional)

To automatically scrape jobs from LinkedIn and Indeed:

```bash
cd backend
npm run worker
```

This will:
- Scrape jobs every hour
- Score them against your resume
- Add high-match jobs to your dashboard

## 🎯 What You Can Do Now

### View Jobs
- Go to http://localhost:3000
- See all jobs with match scores
- Filter by "New" or "All"
- Click job titles to view on original site

### Approve/Dismiss Jobs
- Click "Proceed" to approve a job
- Click "Dismiss" to reject a job

### Start Automation
- Use the API to start automation for approved jobs
- Watch real-time updates in the modal
- Review and confirm before submission

### Emergency Stop
- Click the red "Kill Switch" button
- Stops all automation immediately

## 🧪 Run Tests

```bash
cd backend
npm test
```

All tests should pass! ✅

## 📚 Next Steps

- Read `FRONTEND_COMPLETE.md` for UI details
- Read `BACKEND_COMPLETE.md` for API details
- Read `WEBSOCKET_INTEGRATION_COMPLETE.md` for real-time updates
- Read `TESTING_GUIDE.md` for testing instructions
- Read `HORIZON_STANDARD.md` for code standards

## 🆘 Troubleshooting

### Backend won't start
- Check that port 3001 is not in use
- Verify DATABASE_URL is correct
- Verify OPENAI_API_KEY is valid

### Frontend won't start
- Check that port 3000 is not in use
- Run `npm install` in frontend directory
- Clear `.next` folder: `rm -rf .next`

### WebSocket won't connect
- Verify backend is running
- Check browser console for errors
- Try refreshing the page

### Database errors
- Verify Supabase credentials
- Run migrations: `npm run db:migrate`
- Check Supabase dashboard for table creation

### Automation errors
- Verify Playwright is installed
- Check that job URL is valid
- Review browser console for errors

## 🎉 You're Ready!

Your Job Search Agent is now running and ready to help you find your dream job!

**Happy job hunting! 🚀**
