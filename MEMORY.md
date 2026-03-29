# Long-Term Memory

## Adam Ohayon
- Managing Consultant at Capgemini
- Building LifeOS — his life's work
- Inspired by Viktor Frankl's Logotherapy — meaning as the primary drive
- Prefers quality over speed
- Username: @adamohayon
- Timezone: Europe/Amsterdam
- Has 6 weeks full-time for LifeOS (started March 19, 2026), then returns to consulting
- Work paused end of March due to consulting commitments

## The Mission
Remove all barriers to creativity, creation, self-discovery, self-development, and knowledge acquisition. LifeOS is a movement, not a product.

## Architecture (The Three Pillars)
1. **AevaOS** = Adam's private life OS (forever private, just for us)
2. **LifeTrack** = Proprietary Digital Twin engine (Adam's IP, the algorithm)
3. **LifeOS** = Open-source framework for everyone (the movement)

## Tech Stack (decided 2026-03-22)
- Backend: Node.js / TypeScript (unified stack)
- Frontend: Next.js, web-first, PWA-ready (no app store dependency)
- Database: PostgreSQL (self-hostable, data ownership)
- Deployment: Docker Compose (self-hosted, privacy-first)
- Authentication: JWT (Flask-JWT-Extended for API, localStorage for frontend)

## Mission Control (AevaOS Dashboard)
**Status:** Feature-complete, pending backend deployment

### Repositories
- Frontend: `/data/workspace/aevaos-mission-control-ui/` (main branch)
  - Live: https://aevaos-mission-control-ui.vercel.app
  - Status: ✅ Deployed and working
- Backend: `/data/workspace/aevaos-mission-control-api/` (master branch)
  - Status: ⏳ Code complete, pending Railway deployment

### Implementation Timeline (March 19, 2026)
- **Phase 1:** Documentation & configuration (2 hours)
  - README enhancements, .env.example files
  - Feature specs: PROJECT-OVERVIEW-SPEC.md, TASK-MANAGEMENT-SPEC.md
- **Phase 2:** Dashboard enhancement (3 hours)
  - System Status, Alerts Panel, Quick Actions, Navigation
- **Phase 3:** Projects & Tasks pages (5 hours)
  - Project monitoring dashboard with health indicators
  - Notion-like task management with priorities
- **Phase 4:** Full-stack authentication (7 hours)
  - JWT backend with Flask, SQLAlchemy models
  - Protected API routes for projects/tasks
  - Frontend auth service with auto-refresh
  - Login/register pages, AuthGuard route protection
- **Total development:** ~14 hours (one intense day)

### Features Delivered
- **Dashboard:** System status (projects/tasks/agents/deployments), alerts, quick actions
- **Projects:** Monitoring cards with health, deployment info, metrics, filters
- **Tasks:** Notion-style management with priorities, status, assignees, tags
- **Office:** Virtual office with agent status and activity feed
- **Auth:** Complete JWT flow with login/register/logout/auto-refresh

### Authentication
- Access tokens: 1 hour expiry
- Refresh tokens: 30 days expiry
- Test users: admin/admin123 (admin), aeva/user123 (user)
- Route protection via AuthGuard at layout level

### Deployment Status (as of March 23, 2026)
**Frontend:**
- ✅ Live: https://aevaos-mission-control-ui.vercel.app
- ✅ All routes functional: /, /login, /register, /projects, /tasks, /office
- ✅ GitHub Actions CI/CD working

**Backend:**
- ⏳ Code complete, pushed to GitHub
- ⏳ Railway deployment pending (needs environment variables)
- ⏳ Database seeding pending

### Blocked Next Steps
1. ⏳ Railway: Set environment variables (SECRET_KEY, JWT_SECRET_KEY, CORS_ORIGINS)
2. ⏳ Railway: Deploy API
3. ⏳ Run seed_data.py to create admin/aeva test users
4. ⏳ Frontend: Replace mock data with live API calls

## LifeTrack - Digital Twin IP
**Status:** Deep audit completed (TASK-008, March 23, 2026)

- **Repository:** `/data/workspace/lifetrack/`
- **Current Stack:** Flutter (frontend) + Firebase Cloud Functions (backend)
- **Core IP:** Multi-dimensional personality model integrating:
  - Human Design, MBTI, Big Five, Enneagram, VIA Strengths, Learning Style, Fear Mapping
  - Three Pillars framework (Mind/Body/Environment)
  - AI-powered journal analysis + recommendation engine (Claude 3 Haiku)
  - Fear-aware coaching (unique differentiator)
- **Maturity:** Production-ready algorithm, working system needing platform migration
- **TypeScript Package:** `@lifetrack/digital-twin-core` extracted at `/data/workspace/digital-twin-core/`
  - Zero dependencies, pure TypeScript scoring algorithms
  - Complete unit tests with Jest
  - Ready for Node.js/Next.js integration

**Migration Path:**
- From: Flutter + Firebase → To: Next.js + Node.js + PostgreSQL + Docker
- Estimated effort: 6-8 weeks for feature parity
- Frontend rebuild: 3-4 weeks (67 components)
- Backend restructuring: 1-2 weeks (mostly TypeScript already)
- Database migration: 1 week
- Testing: 1 week

**MVP Scope:** 3 personality frameworks + blueprint generation + basic journaling
**Philosophy:** Viktor Frankl's Logotherapy — meaning as primary human drive

## Key Documents
- `/data/workspace/MASTER_PLAN.md` — The comprehensive LifeOS roadmap (created March 22, 2026)
- `/data/workspace/DIGITAL_TWIN_IP.md` — Complete Digital Twin documentation (35KB, March 23, 2026)
- `/data/workspace/lifetrack/` — Current LifeTrack codebase (Flutter/Firebase)
- `/data/workspace/digital-twin-core/` — Extracted TypeScript package (portable IP)
- `/data/workspace/aevaos-mission-control-ui/` — Mission Control frontend (Next.js)
- `/data/workspace/aevaos-mission-control-api/` — Mission Control backend API (Flask)

## Strategic Decisions
- **Credit monitoring:** DISABLED (2026-03-21) — DO NOT recreate without explicit request
- **Funding:** Self-funded → donations/collaborations (NO VC path)
- **Launch:** Stealth until ready (no public announcements)
- **Community:** Later (after MVP)
- **Timeline:** Quality over speed, no hard deadlines
- **Deployment:** Vercel (frontend) + Railway (backend + PostgreSQL)

## Technical Learnings
- Railway CLI requires account-level tokens, not project tokens
- npm ci fails on Vercel with lock conflicts → use npm install
- GitHub CLI can encrypt secrets directly (no manual base64)
- Always test build before committing
- JWT provides stateless auth, works across domains
- AuthGuard at layout level = single enforcement point
- Mock data fallback = graceful degradation when API unavailable
- Pure TypeScript packages (zero dependencies) = maximum portability
- AI integration patterns: context generation → scoring → insights → recommendations
- Fear-aware coaching = unique angle in personality/self-development space
- Digital Twin as unified model > separate assessment silos

## Workflow Patterns
- Multi-repo management across frontend (main) and backend (master)
- Build verification before commits (npm run build)
- Dark mode patterns in all components
- Auto-refresh intervals: 30s status, 10s activity
- Branch strategy: UI uses main, API uses master
