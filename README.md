# KWISATZ HADERACH — PRAGYAN 2026
### Real-Time Competitive Technical Quiz Platform
**Institution:** Adi Shankara Institute of Engineering and Technology (ASIET)  
**Department:** Department of Computer Applications  
**Event:** PRAGYAN 2026  
**Theme:** *Kwisatz Haderach*  

---

## 1. Project Overview

**KWISATZ HADERACH** is an enterprise-grade, mobile-first, real-time technical quiz platform engineered for high-concurrency competitive events. Built specifically for PRAGYAN 2026 at ASIET, it enables hundreds of students to participate concurrently using their mobile phones via a single web URL without requiring app installation.

### Key Capabilities
- **Zero-Friction Access**: Unique 10-character code login (`KH26-XXXXX`), device capability checks, and pre-quiz participant confirmation.
- **Server-Authoritative Quiz Engine**: Server-calculated scores, time tracking, and strict anti-tampering answer validation. Correct answers are never sent to the client browser.
- **Real-Time Monitoring**: Admin live command dashboard with auto-syncing metrics, participant status tracking, and instant tournament state controls (`WAITING`, `RUNNING`, `PAUSED`, `FINISHED`, `RESET`).
- **Comprehensive Anti-Cheating System**: Configurable **STRICT** and **WARNING** modes monitoring tab switches, window blurs, full-screen exits, and back navigation.
- **Official Auditorium Projector Mode** (`/display`): High-contrast, large-typography presentation display for auditorium projection screens.
- **Automated Tie-Breaking & Prize Ratification**: Server-side ranking engine adhering to:
  1. Highest Score
  2. Highest Number of Correct Answers
  3. Lowest Total Answering Time (milliseconds)
  4. Manual Admin Ratification for 🥇 First Prize and 🥈 Second Prize.

---

## 2. Architecture & Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript | Lightweight mobile-first SSR/hydration, minimal client bundle |
| **Styling** | Tailwind CSS, Lucide Icons | Clean modern aesthetic, zero-bloat CSS, touch-friendly 44px+ targets |
| **Backend** | Next.js API Routes & Server Actions | High-throughput serverless endpoints |
| **Database** | PostgreSQL | Robust ACID compliance for high concurrent writes |
| **ORM** | Prisma ORM | Type-safe migrations, connection pooling, prepared queries |
| **Real-Time** | Server-Sent Events (SSE) & Adaptive Differential Sync | 100% Vercel Serverless compatible without external socket server limits |
| **Authentication** | JWT & Secure HTTP-only cookies | Tamper-proof admin and participant sessions |
| **Export** | PapaParse CSV Engine | Instant official CSV export of results and rankings |

---

## 3. Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```bash
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/kwisatz_haderach"

# Authentication & Security
AUTH_SECRET="your-32-character-secret-key-here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Kwisatz@Pragyan2026"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 4. Local Installation & Database Setup

### Prerequisites
- Node.js 18+ (tested on Node v20/v26)
- PostgreSQL database

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Push Database Schema
```bash
npm run prisma:push
```

### Step 3: Seed Admin, Questions & Demo Participants
```bash
npm run prisma:seed
```
This provisions:
- Admin account: `admin` / `Kwisatz@Pragyan2026`
- Active tournament: `KWISATZ HADERACH`
- 20 high-quality technical questions
- 10 demo participants (including `KH26-A7F92` for Rahul Shaji)

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your mobile phone or browser.

---

## 5. Application Route Map

### Participant Routes (Mobile-First)
- `/` — Landing screen with PRAGYAN 2026 branding
- `/login` — Unique 10-character code login
- `/confirm` — Name confirmation, anti-cheat advisory, device pre-checks
- `/waiting` — Real-time waiting room listening for admin tournament start
- `/quiz` — Active question card with server-authoritative countdown
- `/result` — Final score, rank, correct/wrong count, and celebration confetti
- `/failed` — Anti-cheat termination notice (responses securely recorded)

### Admin Routes (Protected)
- `/admin/login` — Secure coordinator sign-in
- `/admin/dashboard` — Live metric cards, status distribution, participant table
- `/admin/quiz` — Tournament execution controls & settings
- `/admin/participants` — Code generator, bulk roster importer, lock/unlock
- `/admin/questions` — Question editor, answer keys, time limits, bulk JSON import
- `/admin/leaderboard` — Real-time standings matrix & prize ratification
- `/admin/activity` — Real-time audit trail of window blurs, tab switches, submissions
- `/display` (or `/admin/display`) — Large-screen presentation mode for auditorium projectors

---

## 6. Anti-Cheating System & Policies

The anti-cheat subsystem operates in the client background and reports to `/api/participant/log-activity`:

1. **Page Visibility**: `document.visibilitychange` records `PAGE_HIDDEN` when switching tabs or apps.
2. **Window Blur**: `window.onblur` records `WINDOW_BLUR` when browser loses focus.
3. **Fullscreen Exit**: If full-screen is engaged, exits record `FULLSCREEN_EXIT`.
4. **Back Navigation Trap**: `popstate` history manipulation catches browser back button presses.
5. **Configurable Policy Modes**:
   - **STRICT MODE**: Immediate zero-tolerance termination (`status: FAILED`).
   - **WARNING MODE**: Allows up to *N* warnings (default 2) with on-screen modal alerts before terminating on the 3rd infraction.
6. **Graceful Mobile Degradation**: Distinguishes between temporary connection drops and intentional app abandonment. Answers already saved on the server remain intact during network interruptions.

---

## 7. Concurrency & Performance Testing

The application includes an automated 100-participant concurrent stress simulation script:

```bash
npm run test:concurrency
```

### Stress Test Verification:
1. **Login Spike**: 100 simultaneous code verification and session token creation requests.
2. **Simultaneous Submissions**: 100 concurrent answers submitted across questions with sub-second latencies.
3. **Simulated Anti-Cheat**: Cheaters injected and terminated instantly without impacting legitimate users.
4. **Leaderboard Integrity**: Server-side ranks computed and sorted cleanly with zero database deadlocks.

---

## 8. Vercel Deployment Instructions

1. **Push Code to GitHub**:
   ```bash
   git init && git add . && git commit -m "KWISATZ HADERACH production release"
   ```
2. **Create a Serverless PostgreSQL Database**:
   - Recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com).
   - Copy the pooled connection string (`DATABASE_URL`).
3. **Deploy to Vercel**:
   - Import repository on [Vercel](https://vercel.com).
   - Set Environment Variables:
     - `DATABASE_URL` (pooled connection string)
     - `AUTH_SECRET` (generate a random 32+ character string)
     - `ADMIN_USERNAME`
     - `ADMIN_PASSWORD`
     - `NEXT_PUBLIC_APP_URL` (`https://your-project.vercel.app`)
4. **Run Migrations on Production Database**:
   ```bash
   DATABASE_URL="your-production-database-url" npm run prisma:push
   DATABASE_URL="your-production-database-url" npm run prisma:seed
   ```

---

## 9. Troubleshooting & FAQ

- **Duplicate Device Login?**
  - If a student tries logging in on a second device, the system notifies them that the code is already active. Admin can click **Unlock** on the Participants dashboard to re-allow access.
- **Accidental Page Refresh?**
  - Session tokens persist in secure HTTP-only cookies and session storage. Refreshing restores the exact question without resetting score or granting additional time.
- **Network Drop during Question?**
  - The client displays a small **Reconnecting...** pill and automatically re-attempts submission when signal returns.

---
*Created with precision for the Department of Computer Applications, Adi Shankara Institute of Engineering & Technology (ASIET) • PRAGYAN 2026.*
