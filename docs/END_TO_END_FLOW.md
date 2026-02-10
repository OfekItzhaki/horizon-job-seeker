# End-to-End Flow

## Complete User Journey

This document describes the complete flow from user onboarding to job application.

## Phase 1: Initial Setup

### 1.1 Start Services

**User Action**: Run startup script
```powershell
.\start-all.ps1
```

**System Actions**:
1. Start backend server (port 3001)
2. Start frontend server (port 3000)
3. Optionally start background worker
4. Initialize database connection
5. Start WebSocket server

**Result**: All services running and healthy

---

### 1.2 Create User Profile

**User Action**: Navigate to profile page

**Flow**:
```
User → http://localhost:3000
  ↓
Click "My Profile"
  ↓
Profile Page Loads
```

**Frontend**:
- Component: `frontend/app/profile/page.tsx`
- Fetches existing profile: `GET /api/profile`
- Displays profile form

**Backend**:
- Endpoint: `GET /api/profile`
- File: `backend/src/api/profileRoutes.ts`
- Queries database for user profile
- Returns profile data or empty state

---

### 1.3 Parse Resume with AI

**User Action**: Paste resume and click "Parse Resume with AI"

**Flow**:
```
User pastes resume text
  ↓
Click "Parse Resume with AI"
  ↓
Frontend → POST /api/profile/parse-resume
  ↓
Backend → Groq AI API
  ↓
AI extracts structured data
  ↓
Backend → Frontend (JSON response)
  ↓
Display extracted data
```

**Frontend Code** (`frontend/app/profile/page.tsx`):
```typescript
const handleParseResume = async () => {
  setParsing(true);
  const response = await fetch(`${API_URL}/api/profile/parse-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText: profile.resumeText }),
  });
  const data = await response.json();
  setProfile({
    ...profile,
    structuredData: data.structuredData,
    desiredJobTitles: data.desiredJobTitles.join(', '),
  });
  setParsing(false);
};
```

**Backend Code** (`backend/src/api/profileRoutes.ts`):
```typescript
router.post('/parse-resume', async (req, res) => {
  const { resumeText } = req.body;
  const structuredData = await parseResumeText(resumeText);
  const desiredJobTitles = extractDesiredJobTitles(structuredData);
  res.json({ structuredData, desiredJobTitles });
});
```

**AI Integration** (`backend/src/utils/resumeParser.ts`):
```typescript
export async function parseResumeText(resumeText: string) {
  const groqClient = getGroq();
  const response = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a resume parsing expert...' },
      { role: 'user', content: prompt },
    ],
  });
  return parsed as StructuredProfileData;
}
```

**Result**: Structured data extracted (work experience, skills, education)

---

### 1.4 Save Profile

**User Action**: Review extracted data and click "Save Profile"

**Flow**:
```
User reviews data
  ↓
Click "Save Profile"
  ↓
Frontend → PUT /api/profile
  ↓
Backend validates data
  ↓
Store in database
  ↓
Return success
  ↓
Redirect to jobs page
```

**Database Operation**:
```typescript
await db.insert(userProfile).values({
  fullName: profile.fullName,
  email: profile.email,
  resumeText: profile.resumeText,
  structuredData: JSON.stringify(profile.structuredData),
  desiredJobTitles: profile.desiredJobTitles,
});
```

**Result**: Profile saved, user redirected to jobs page

---

## Phase 2: Job Discovery

### 2.1 Background Worker Scrapes Jobs

**Automatic Process**: Runs periodically (every hour)

**Flow**:
```
Background Worker starts
  ↓
Scrape LinkedIn (with rate limiting)
  ↓
Scrape Indeed (with rate limiting)
  ↓
For each job:
  - Generate canonical ID
  - Check for duplicates
  - Store if new (status: 'new')
  ↓
Score jobs against user profile
  ↓
Update match scores
```

**Worker Code** (`backend/src/worker/backgroundWorker.ts`):
```typescript
async function scrapeAndScoreJobs() {
  // Scrape jobs
  const linkedinJobs = await linkedinScraper.scrape('Full Stack Developer');
  const indeedJobs = await indeedScraper.scrape('Full Stack Developer');
  
  // Store new jobs
  for (const job of allJobs) {
    const canonicalId = generateCanonicalId(job.company, job.title);
    const exists = await checkDuplicate(canonicalId);
    if (!exists) {
      await db.insert(jobs).values({ ...job, status: 'new' });
    }
  }
  
  // Score jobs
  const profile = await getProfile();
  const newJobs = await getNewJobs();
  for (const job of newJobs) {
    const score = await scoreJob(job.description, profile.resumeText);
    await db.update(jobs).set({ matchScore: score });
  }
}
```

**Scraper Code** (`backend/src/scraper/linkedinScraper.ts`):
```typescript
async scrape(query: string) {
  await this.respectRateLimit(); // 30-second delay
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`https://linkedin.com/jobs/search?keywords=${query}`);
  // Extract job data...
  return jobs;
}
```

**Scoring Code** (`backend/src/services/scoringService.ts`):
```typescript
export async function scoreJob(jobDescription: string, resume: string) {
  const groqClient = getGroq();
  const response = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a job matching expert...' },
      { role: 'user', content: `Job: ${jobDescription}\nResume: ${resume}` },
    ],
  });
  return extractScore(response); // Returns 0-100
}
```

**Result**: New jobs stored with match scores

---

### 2.2 View Jobs on Dashboard

**User Action**: View jobs page

**Flow**:
```
User → http://localhost:3000
  ↓
Frontend → GET /api/jobs?status=new
  ↓
Backend queries database
  ↓
Order by: created_at DESC, match_score DESC
  ↓
Return jobs array
  ↓
Display job cards
```

**Frontend Code** (`frontend/app/page.tsx`):
```typescript
useEffect(() => {
  fetchJobs();
}, []);

const fetchJobs = async () => {
  const response = await fetch(`${API_URL}/api/jobs?status=new`);
  const data = await response.json();
  setJobs(data);
};
```

**Backend Code** (`backend/src/api/jobRoutes.ts`):
```typescript
router.get('/', async (req, res) => {
  const { status } = req.query;
  let query = db.select().from(jobs);
  if (status) {
    query = query.where(eq(jobs.status, status));
  }
  const results = await query.orderBy(
    desc(jobs.createdAt),
    desc(jobs.matchScore)
  );
  res.json(results);
});
```

**Result**: Jobs displayed, sorted by most recent first, then by match score

---

### 2.3 Approve or Reject Jobs

**User Action**: Click "Proceed" or "Dismiss"

**Flow (Proceed)**:
```
User clicks "Proceed"
  ↓
Frontend → PATCH /api/jobs/:id/status
  ↓
Body: { status: 'approved' }
  ↓
Backend validates transition
  ↓
Update database
  ↓
Return updated job
  ↓
Remove from "new" list
```

**Frontend Code**:
```typescript
const handleProceed = async (jobId: number) => {
  await fetch(`${API_URL}/api/jobs/${jobId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  });
  fetchJobs(); // Refresh list
};
```

**Backend Code**:
```typescript
router.patch('/:id/status', async (req, res) => {
  const jobId = parseInt(req.params.id);
  const { status } = req.body;
  
  // Validate state transition
  const validTransitions = {
    'new': ['approved', 'rejected'],
    'approved': ['applied'],
  };
  
  const [updated] = await db.update(jobs)
    .set({ status })
    .where(eq(jobs.id, jobId))
    .returning();
  
  res.json(updated);
});
```

**Result**: Job status changed, removed from view

---

## Phase 3: Job Application

### 3.1 Start Automation

**User Action**: Trigger automation (via API or future UI button)

**Flow**:
```
POST /api/automation/start
  ↓
Body: { jobId: 1 }
  ↓
Backend validates job status
  ↓
Launch Playwright browser
  ↓
Navigate to job URL
  ↓
WebSocket → Frontend: 'automation_started'
  ↓
Modal opens automatically
```

**API Call** (PowerShell):
```powershell
$body = @{ jobId = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/automation/start" `
  -Method POST -Body $body -ContentType "application/json"
```

**Backend Code** (`backend/src/api/automationRoutes.ts`):
```typescript
router.post('/start', async (req, res) => {
  const { jobId } = req.body;
  const session = await automationEngine.startSession(jobId);
  res.json({ sessionId: session.id });
});
```

**Automation Engine** (`backend/src/automation/automationEngine.ts`):
```typescript
async startSession(jobId: number) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const session = { id, jobId, browser, page, status: 'filling' };
  
  // Broadcast via WebSocket
  wsManager.broadcast({
    type: 'automation_started',
    automationId: session.id,
    jobId,
  });
  
  await page.goto(job.jobUrl);
  return session;
}
```

**WebSocket Broadcast** (`backend/src/websocket/websocketServer.ts`):
```typescript
broadcast(message: any) {
  this.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
```

**Frontend WebSocket** (`frontend/app/page.tsx`):
```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/ws');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'automation_started') {
      setModalOpen(true);
      setModalStatus('filling');
    }
  };
}, []);
```

**Result**: Browser opens, modal shows "Starting automation..."

---

### 3.2 Fill Form Fields

**Automatic Process**: AI detects and fills form fields

**Flow**:
```
Extract page HTML
  ↓
Send to Groq AI for field detection
  ↓
AI returns field selectors
  ↓
For each field:
  - Fill name, email, phone
  - Upload resume PDF
  - Fill GitHub URL
  ↓
WebSocket → Frontend: 'automation_filling'
  ↓
Modal updates: "Filling form..."
```

**Field Detection** (`backend/src/automation/automationEngine.ts`):
```typescript
async identifyFormFields(page: Page) {
  const html = await page.content();
  const groqClient = getGroq();
  const response = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a form field detection expert...' },
      { role: 'user', content: `Identify form fields in: ${html}` },
    ],
  });
  return parseFields(response);
}
```

**Form Filling**:
```typescript
async fillFormWithProfile(sessionId: string) {
  const profile = await getProfile();
  const fields = await this.identifyFormFields(session.page);
  
  for (const field of fields) {
    if (field.label === 'name') {
      await session.page.fill(field.selector, profile.fullName);
    }
    if (field.label === 'email') {
      await session.page.fill(field.selector, profile.email);
    }
    if (field.label === 'resume') {
      const pdf = await this.generateResumePdf(profile.resumeText);
      await session.page.setInputFiles(field.selector, pdf);
    }
  }
  
  wsManager.broadcast({
    type: 'automation_filling',
    automationId: sessionId,
    jobId: session.jobId,
  });
}
```

**Result**: Form filled with user data

---

### 3.3 Pause at Submit Button

**Automatic Process**: Locate submit button but DON'T click

**Flow**:
```
Locate submit button
  ↓
Highlight button (red border)
  ↓
Set session status: 'paused'
  ↓
WebSocket → Frontend: 'automation_paused'
  ↓
Modal shows: "Ready to submit"
  ↓
Display Confirm/Cancel buttons
```

**Code**:
```typescript
async pauseAtSubmit(sessionId: string) {
  const submitButton = await session.page.$('button[type="submit"]');
  
  // Highlight button
  await session.page.evaluate(() => {
    const button = document.querySelector('button[type="submit"]');
    button.style.border = '3px solid red';
  });
  
  session.status = 'paused';
  
  wsManager.broadcast({
    type: 'automation_paused',
    automationId: sessionId,
    jobId: session.jobId,
    message: 'Ready to submit - waiting for confirmation',
  });
}
```

**Frontend Modal Update**:
```typescript
if (data.type === 'automation_paused') {
  setModalStatus('paused');
  setModalMessage('Ready to submit - waiting for confirmation');
}
```

**Result**: User sees filled form in browser, modal shows Confirm/Cancel buttons

---

### 3.4 User Confirms Submission

**User Action**: Review form and click "Confirm Submission"

**Flow**:
```
User reviews form in browser
  ↓
Click "Confirm Submission" in modal
  ↓
Frontend → POST /api/automation/confirm
  ↓
Backend clicks submit button
  ↓
Update job status: 'applied'
  ↓
WebSocket → Frontend: 'automation_submitted'
  ↓
Modal shows success
  ↓
Auto-close after 3 seconds
  ↓
Close browser
```

**Frontend Code**:
```typescript
const handleConfirm = async () => {
  await fetch(`${API_URL}/api/automation/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: currentSessionId }),
  });
};
```

**Backend Code**:
```typescript
router.post('/confirm', async (req, res) => {
  const { sessionId } = req.body;
  await automationEngine.confirmSubmission(sessionId);
  res.json({ success: true });
});
```

**Automation Engine**:
```typescript
async confirmSubmission(sessionId: string) {
  const submitButton = await session.page.$('button[type="submit"]');
  await submitButton.click();
  
  await db.update(jobs)
    .set({ status: 'applied' })
    .where(eq(jobs.id, session.jobId));
  
  session.status = 'submitted';
  
  wsManager.broadcast({
    type: 'automation_submitted',
    automationId: sessionId,
    jobId: session.jobId,
    message: 'Application submitted successfully',
  });
  
  await session.browser.close();
}
```

**Result**: Application submitted, job marked as 'applied', browser closed

---

## Phase 4: Emergency Controls

### 4.1 Kill Switch

**User Action**: Click "Kill Switch" button

**Flow**:
```
User clicks "Kill Switch"
  ↓
Confirmation dialog
  ↓
User confirms
  ↓
Frontend → POST /api/automation/kill
  ↓
Backend terminates ALL sessions
  ↓
Close all browsers
  ↓
Log kill switch activation
  ↓
Return count of terminated sessions
```

**Code**:
```typescript
async killAllSessions() {
  console.log('🔴 KILL SWITCH ACTIVATED');
  console.log(`[LOG] Kill switch activated at ${new Date().toISOString()}`);
  
  const sessionIds = Array.from(this.sessions.keys());
  let terminated = 0;
  
  for (const sessionId of sessionIds) {
    await this.cancelSession(sessionId);
    terminated++;
  }
  
  return terminated;
}
```

**Result**: All automation stopped immediately

---

## Summary

### Complete Flow Timeline

1. **Setup** (5 minutes)
   - Start services
   - Create profile with AI parsing

2. **Job Discovery** (Automatic)
   - Background worker scrapes jobs
   - AI scores jobs
   - Jobs appear on dashboard

3. **Job Review** (User-driven)
   - Review jobs
   - Approve high-match jobs
   - Reject low-match jobs

4. **Application** (Semi-automated)
   - Trigger automation
   - AI fills form
   - User reviews and confirms
   - Application submitted

5. **Safety** (Always available)
   - Kill switch for emergency stop
   - Cancel anytime
   - Human-in-the-loop

### Key Principles

1. **Human-in-the-Loop**: Never auto-submits
2. **Real-Time Updates**: WebSocket for instant feedback
3. **AI-Powered**: Groq for parsing and scoring
4. **Safety First**: Kill switch and cancel options
5. **User Control**: User approves every application
