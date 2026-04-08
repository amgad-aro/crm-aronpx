# ARO CRM - Project Overview for Claude Code

## Architecture
- **Frontend**: React (create-react-app) → deployed on **Vercel** → repo: `amgad-aro/crm-aronpx`
- **Backend**: Node.js + Express → deployed on **Railway** → `https://crm-aro-backend-production.up.railway.app`
- **Database**: MongoDB Atlas → cluster: `crm-aro` → project: `aro-europe` (Azure / Ireland) → database: `test`

## Important Rules
- **NEVER change MONGODB_URI** in .env - it points to Atlas cloud, not localhost
- **NEVER install or suggest local MongoDB** - we use Atlas cloud only
- **Railway auto-deploys from GitHub** - just push to main branch, do NOT use `railway up`
- **NEVER modify .env files** without explicit user approval
- Backend root directory on Railway is `/crm-aro-backend`
- Frontend root directory on Vercel is `/` (root of repo)

## Backend Structure (`/crm-aro-backend`)
- `server.js` - main Express server, all API routes
- `models.js` - all Mongoose models
- `package.json` - dependencies
- `.env` - environment variables (MONGODB_URI, JWT_SECRET, PORT)

### Environment Variables
```
MONGODB_URI=mongodb+srv://...@crm-aro...mongodb.net/test
JWT_SECRET=admin123
PORT=5000
```

### Models
1. **User** - `name, username, password, email, phone, role, title, active, monthlyTarget, teamId, teamName`
   - Roles: `admin | manager | sales | viewer`
2. **Lead** - `name, phone, phone2, email, status, source, project, agentId, budget, notes, callbackTime, lastActivityTime, archived, isVIP`
   - Statuses: `NewLead | Potential | HotCase | CallBack | MeetingDone | NotInterested | NoAnswer | DoneDeal`
3. **Activity** - `userId, leadId, type, note`
   - Types: `call | meeting | followup | email | status_change | reassign | note`
4. **Task** - `title, type, time, leadId, userId, done`
5. **DailyRequest** - `name, phone, phone2, email, budget, propertyType, area, notes, status, agentId, callbackTime, lastActivityTime, source`

### API Routes
- `POST /api/login` - login
- `GET /api/me` - current user
- `GET/POST /api/users` - users (admin only for POST)
- `PUT/DELETE /api/users/:id` - admin only
- `GET/POST /api/leads` - leads (sales sees own only)
- `PUT /api/leads/:id` - update lead + auto-log activity
- `DELETE /api/leads/:id` - admin only
- `GET/POST /api/activities` - activities
- `GET/POST/PUT/DELETE /api/tasks` - tasks
- `GET /api/stats` - dashboard stats

### Auth
- JWT tokens, 7 days expiry
- `auth` middleware on all protected routes
- `adminOnly` middleware for admin/manager routes
- Sales role: sees only own leads, activities, tasks

## Frontend Structure (`/src`)
- React app with role-based UI
- Connects to backend via `REACT_APP_API_URL` or hardcoded Railway URL
- Build command: `CI=false react-scripts build` (CI=false to ignore warnings)

## Default Admin User
- username: `amgad`
- password: `admin123`
- Auto-created on first server start if not exists

## Key Features Built
- Role-based access: Admin / Manager / Sales / Viewer
- Team filtering via `teamId` / `teamName`
- Lead management with status pipeline
- Daily Requests (separate from leads)
- Activities & call logging
- Tasks system
- Dashboard stats
- Phone masking (hover to reveal)
- EOI system (leads with EOI status + dedicated page)
- Commission system with per-million rates
- KPI dashboard with quarterly targets
- Notification bell (urgent callbacks, role-filtered)
- Last Seen tracking (Active/Idle/Offline)
- Google Sheets integration via Apps Script
- Facebook Lead Ads via Make.com

## When Making Changes
1. Always check existing models before adding new fields
2. Add new routes in `server.js` following existing patterns
3. Frontend API calls use Bearer token in Authorization header
4. Body parser limit is 10MB (for base64 image uploads)
5. After backend changes: commit to GitHub and push — Railway auto-deploys from main branch
6. After frontend changes: commit to GitHub, Vercel auto-deploys
