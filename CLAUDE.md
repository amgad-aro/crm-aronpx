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

## AssetTracker Module (shipped 2026-05-12)
Inventory tracking for company-owned equipment, furniture, and appliances.

- **Access gate**: admin role OR `isOwner` flag. Sales_admin and other admin-adjacent roles never see it. Middleware: `requireAssetAccess` (server.js around line 1140).
- **Sidebar entry**: "Assets" — sits above Settings in the admin block.
- **Module is English-only** (the rest of the CRM follows global lang). AssetTracker root div forces `direction:"ltr"` and no `isRTL` ternaries inside the page.
- **Models** (inline in server.js near the existing schema block):
  - `Branch` — office locations. Seeded once with "New Cairo / NC".
  - `AssetCategory` — 12 seeded categories across 4 groups (it / furniture / appliance / other). The seeder upserts on `codePrefix`; safe to add new categories to the array. `nameAr` field stays in the schema but is NOT rendered in the UI.
  - `Asset` — auto-mints `assetCode` (`ARO-{prefix}-{4-digit-seq}`) and `qrCodeData` (`${APP_URL}/assets/{code}`) via a `pre('validate')` hook. Per-category sequence bumped atomically via `$inc`. Personal+active assets MUST have a custodian (enforced at create time only).
  - `CustodyHistory` — append-only audit log. Actions: `registered | assigned | transferred | returned | marked_lost | retired | status_changed`.
- **Routes** — all under `/api/assets/...`, all gated by `auth, requireAssetAccess`. The `:id` param uses an explicit `([0-9a-fA-F]{24})` regex constraint so it doesn't shadow `/api/assets/reports/*` routes.
- **QR scan deep-link**: scanning a printed QR opens `${APP_URL}/assets/{code}`. The Vercel SPA fallback returns index.html; App captures the code into state, AssetTrackerPage seeds `subPage="detail"` from it, and the URL is cleared via `replaceState`. The deep-link is consumed (cleared from App state) when the user navigates AWAY from the detail view, not on mount — otherwise a render race during loadData unmounts the page and the remount loses the prop.
- **Excel exports**: uses `exceljs` (not `xlsx` — needed cell styling). Single endpoint `GET /api/assets/reports/export?type=<type>`; each type produces a multi-sheet workbook (summary + detail). Date columns formatted in Cairo time via `Africa/Cairo` + `sv-SE` locale.
- **Required env var**: `APP_URL` on Railway must match the Vercel domain so QR codes point to the right host. Falls back to `https://crm-aronpx.vercel.app` if unset.
- **JWT lifetime**: bumped to 30d during the rebuild (was 7d). Existing tokens keep their original 7d window until they expire.
