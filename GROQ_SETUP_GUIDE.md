# 🚀 Groq AI Setup Guide (Free & Fast!)

## Why Groq?

**Groq is FREE and FAST!** 🎉

- ✅ **Free Tier**: Generous free API access
- ✅ **Fast**: 10x faster than OpenAI
- ✅ **Accurate**: Uses Llama 3.3 70B model
- ✅ **No Credit Card**: Sign up without payment info
- ✅ **High Limits**: 30 requests/minute, 14,400/day

---

## Step 1: Get Your Free Groq API Key

### 1. Visit Groq Console
Go to: **https://console.groq.com**

### 2. Sign Up (Free!)
- Click "Sign Up" or "Get Started"
- Use your email or Google account
- No credit card required!

### 3. Create API Key
1. Once logged in, go to **API Keys** section
2. Click "Create API Key"
3. Give it a name (e.g., "Job Search Agent")
4. Copy the API key (starts with `gsk_...`)

---

## Step 2: Update Your Configuration

### Update `backend/.env` file:

```env
# Groq AI (Free & Fast!)
GROQ_API_KEY=gsk_your_actual_key_here
AI_PROVIDER=groq

# OpenAI (Backup - optional)
OPENAI_API_KEY=sk-your-openai-key-here
```

**Important**: Replace `gsk_your_actual_key_here` with your actual Groq API key!

---

## Step 3: Restart Backend

```powershell
# Stop the backend (Ctrl+C in the terminal)
# Then restart:
cd backend
npm run dev
```

---

## Step 4: Test Resume Parser

```powershell
.\test-resume-parser.ps1
```

You should see:
```
✅ Resume parsed successfully!
Work Experience: 1 positions
Skills: 6 skills
Education: 1 degrees
Suggested Job Titles: Senior Full Stack Developer
Test PASSED!
```

---

## Groq vs OpenAI Comparison

| Feature | Groq (Free) | OpenAI (Paid) |
|---------|-------------|---------------|
| Cost | **FREE** | $0.15-$0.60 per 1M tokens |
| Speed | **10x faster** | Standard |
| Model | Llama 3.3 70B | GPT-4o-mini |
| Accuracy | Excellent | Excellent |
| Rate Limit | 30/min, 14,400/day | Depends on tier |
| Credit Card | **Not required** | Required |

---

## Switching Between Providers

You can easily switch between Groq and OpenAI:

### Use Groq (Free):
```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

### Use OpenAI:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk_your_key_here
```

Just change `AI_PROVIDER` and restart the backend!

---

## Troubleshooting

### Error: "GROQ_API_KEY environment variable is not set"
**Solution**: Make sure you added the key to `backend/.env` and restarted the backend.

### Error: "Invalid API key"
**Solution**: Double-check your API key from https://console.groq.com/keys

### Error: "Rate limit exceeded"
**Solution**: Groq free tier has limits:
- 30 requests per minute
- 14,400 requests per day

Wait a minute and try again, or upgrade to Groq Pro (still very cheap!).

---

## Groq Models Available

The resume parser uses **`llama-3.3-70b-versatile`** which is:
- ✅ Fast (10x faster than GPT-4)
- ✅ Accurate (70 billion parameters)
- ✅ Free (generous free tier)
- ✅ Versatile (great for resume parsing)

Other models you can try:
- `llama-3.1-70b-versatile` - Previous version
- `mixtral-8x7b-32768` - Good for long documents
- `gemma2-9b-it` - Smaller, faster

To change model, edit `backend/src/utils/resumeParser.ts`:
```typescript
model: 'llama-3.3-70b-versatile', // Change this line
```

---

## Benefits for Job Search Agent

With Groq, you get:

1. **Unlimited Resume Parsing** (within free tier limits)
2. **Fast Profile Setup** (~2-3 seconds vs 5-10 seconds)
3. **No Cost** (completely free!)
4. **Same Quality** (Llama 3.3 is excellent)

---

## Next Steps

1. ✅ Get your free Groq API key
2. ✅ Update `backend/.env`
3. ✅ Restart backend
4. ✅ Test resume parser
5. ✅ Start using the Job Search Agent!

---

**Questions?**
- Groq Documentation: https://console.groq.com/docs
- Groq Discord: https://discord.gg/groq
- Groq Pricing: https://wow.groq.com/pricing (Free tier is generous!)

---

**Last Updated**: February 10, 2026  
**Status**: ✅ Groq Integration Complete
