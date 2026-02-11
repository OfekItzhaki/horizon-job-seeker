# 🔄 UptimeRobot Setup - Keep Services Alive

**Purpose**: Prevent Render free tier services from sleeping after 15 minutes of inactivity

---

## Quick Setup

### 1. Sign Up
- Go to https://uptimerobot.com
- Click "Register for FREE"
- No credit card required
- Free tier: 50 monitors

### 2. Add Monitors

**Only monitor BACKEND APIs** (not frontends - Vercel doesn't sleep)

#### For Horizon Jobs:
```
Monitor Type: HTTP(s)
Friendly Name: Horizon Jobs API
URL: https://api.horizon-jobs.ofeklabs.dev/health
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Alert Contacts: Your email
```

#### For Horizon Flux:
```
Monitor Type: HTTP(s)
Friendly Name: Horizon Flux API
URL: https://api.horizon-flux.ofeklabs.dev/health
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Alert Contacts: Your email
```

#### For Horizon FMS:
```
Monitor Type: HTTP(s)
Friendly Name: Horizon FMS API
URL: https://api.horizon-fms.ofeklabs.dev/health
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
Alert Contacts: Your email
```

---

## What This Does

✅ Pings your backend every 5 minutes  
✅ Keeps Render services awake (prevents 15-min sleep)  
✅ Alerts you if a service goes down  
✅ Free forever (50 monitors included)

---

## Important Notes

### DO Monitor:
- ✅ Backend APIs on Render (they sleep)
- ✅ Use `/health` endpoints (lightweight)
- ✅ 5-minute interval (not too aggressive)

### DON'T Monitor:
- ❌ Frontends on Vercel (they don't sleep)
- ❌ Main domains (monitor APIs instead)
- ❌ Too frequently (5 min is perfect)

---

## Dashboard

After setup, you'll see:
- Green checkmarks: Services are up
- Response times: How fast your APIs respond
- Uptime percentage: 99.9%+ is great
- Alerts: Email when service goes down

---

## Cost

**FREE** - 50 monitors, 5-minute intervals, email alerts

---

That's it! Your services will never sleep again. 🎉
