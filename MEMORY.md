# Long-Term Memory

## Adam Ohayon
- Managing Consultant at Capgemini
- Building LifeOS — his life's work
- Inspired by Viktor Frankl's Logotherapy — meaning as the primary drive
- Prefers quality over speed
- Telegram: @adamohayon
- Timezone: Europe/Amsterdam
- Has 6 weeks full-time for LifeOS (started March 2026), then returns to consulting

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

### Next Steps
1. Set Railway environment variables (SECRET_KEY, JWT_SECRET_KEY, CORS_ORIGINS)
2. Deploy API to Railway
3. Seed database with test users/projects/tasks
4. Replace mock data with live API calls

## LifeTrack Repository
- Path: `/data/workspace/lifetrack/`
- Comprehensive README created March 22, 2026
- MVP: 3 pillars (Mind/Body/Environment) + blueprint generation
- Philosophy: Viktor Frankl's Logotherapy

## Key Documents
- `/data/workspace/MASTER_PLAN.md` — The comprehensive roadmap
- `/data/workspace/lifetrack/` — LifeTrack repository
- `/data/workspace/aevaos-mission-control-ui/` — AevaOS frontend
- `/data/workspace/aevaos-mission-control-api/` — AevaOS backend API

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

## Workflow Patterns
- Multi-repo management across frontend (main) and backend (master)
- Build verification before commits (npm run build)
- Dark mode patterns in all components
- Auto-refresh intervals: 30s status, 10s activity
- Branch strategy: UI uses main, API uses master
