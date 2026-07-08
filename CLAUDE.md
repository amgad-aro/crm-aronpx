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
- **NEVER add a TTL index on `Lead.expiresAt`** (no `expireAfterSeconds` on that field, in code or directly in Atlas). It is a dormant/vestigial field — nothing reads it. Historically it was written as `now + 30 days` on almost every lead, so a TTL index would mass-delete thousands of leads. As of 2026-07-08 the two write sites (`POST /api/leads`, `POST /api/leads/inbound`) no longer set it, and `unset-lead-expiresat.js` clears the legacy values. Leave it unset; do not "wire up" a lead-expiry TTL without an explicit, reviewed retention decision.

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

## Deal Notifications — DO NOT BREAK
Invariants that MUST hold for the deal notification bell to keep working:
1. Both deal-notification creation paths (POST new deal AND EOI → Done Deal conversion) MUST save the notification with the SAME canonical `type` value. Current canonical value: `"deal"`.
2. The auto-mark-as-read flow MUST include the canonical deal-notification type in its handled types. If a type whitelist exists on either FE or BE, the canonical deal type MUST be present.
3. Deal notifications MUST have a valid ISO `createdAt`, an explicit `isRead: false` on creation, and a non-null actor reference.
4. Any future refactor that touches notification types must update BOTH creation paths AND the mark-as-read handler in the same commit.

Implementation notes (2026-05-16 fix):
- Read state is per-user, DB-backed: `Notification.seenBy[]` (array of userId strings). The Notification model has no `isRead` / `readAt` field — "read" means the caller's userId is in `seenBy`. Invariant #3's `isRead: false` corresponds to leaving `seenBy: []` on creation (Mongoose schema default; do not initialize otherwise).
- The deal-bell icon badge AND the dropdown header chip count BOTH read from `dealNotifs.filter(n => !n.seen).length` (single source of truth — App.js Header). Do not reintroduce a second counter or a localStorage cutoff (`crm_deal_seen_<uid>`, `lastSeenDealAt`).
- Opening the bell fires `PUT /api/notifications/mark-seen` with `{type:"deal"}`, which `$addToSet`'s the caller's userId into `seenBy` for every visible deal notification, then `loadNotifications` refetches so `dealNotifs[].seen` reflects the new DB state.
- `POST /api/notifications` MUST emit `broadcast("notification_updated", {})` after `Notification.create` so other admins' bells refresh in real time. Every other `Notification.create` site already does this — keep it consistent.

## Commission Tax Canonical Model (shipped 2026-05-17)

The deal form has ONE commission input: `Commission Rate (%)`. State tax (VAT 14% + Withholding 5%) is the only "tax" in the canonical flow and applies to BOTH Internal and External deals. There is **no** broker-style "Tax %" input on the deal form anymore — that name was historically used for the External informal split (now relabeled as "Broker pre-deduction %" and clearly scoped to the External-Broker-Split bookkeeping section).

Canonical formula (used by the deal-form Live Preview, the cycle-stage modal, the Commission Calculator, the Annual Summary, and `/api/annual-pnl`):
```
Gross Commission (incl. VAT) = Budget × commissionRate / 100
Net of VAT                   = Gross / 1.14
VAT 14%                      = Gross − Net of VAT
Withholding 5%               = Net of VAT × 0.05
Net Due                      = Gross − Withholding
```

Invariants:
1. `Lead.commissionRate` is the canonical input (Number, percent — e.g. 3 for 3%). `Lead.commissionAmount` is always **computed server-side** from `round2(budget × rate / 100)` and never trusted from the client. Both are stored on the Lead for audit + cycle seeding.
2. Required (BE 400 otherwise) on admin/sales_admin DoneDeal save path: `commissionRate ∈ (0, 100]` AND `budget > 0`. Stripped from body for any other role.
3. `ensureCommissionForLead` seeds cycle 1 with `claimUnitValue = budget`, `commissionRate = Lead.commissionRate / 100` (decimal), `claimAmount = Lead.commissionAmount`. PUT `/api/leads/:id` propagates Lead edits into cycle 1 ONLY when cycle 1 is still in `pending_claim`. Once admin advances cycle 1, the cycle becomes the source of truth and Lead edits no longer touch it.
4. `Lead.externalDealConfig.commissionTaxPct` is the External "informal broker pre-deduction" (admin-typed, 0 allowed). It is **NOT** state tax and **NOT** the canonical commission tax. Future contributors MUST NOT reintroduce a "Tax %" input on the main deal form — that name belongs to the (relabeled) Broker Split section only.
5. External deals NEVER pay the per-1000 chain (`teamLeader/manager/director` slots are `null` on the snapshot when `dealType === "external"`). Only the broker (always) and the optional "Sales Agent involved" toggle's external sales agent are paid.

## Per-Deal Recipient Overrides (shipped 2026-05-17)

`Commission.recipientOverrides[]` is the source of truth for per-deal admin tweaks to the recipient list. Three actions, no snapshot mutation:
- `manual_add` — extra recipient (off-chain). `targetSlot: "extra"`. Renders as an extra row in the recipient list.
- `manual_zero` — pins a chain slot's effective share to 0 for this deal (recipient still appears, with a "manually zeroed" badge).
- `manual_remove` — excludes a chain slot from the effective recipient list entirely.

Endpoints (all admin/sales_admin):
- `POST /api/commissions/:id/recipients` — body `{ name, role, amount, userId? }`. Creates a manual_add override.
- `DELETE /api/commissions/:id/recipients/:overrideId` — removes any override by `_id` (manual_add, manual_zero, or manual_remove).
- `PATCH /api/commissions/:id/recipients/:slot/zero` — slot ∈ {salesAgent, teamLeader, manager, director, owner, salesAgent2, teamLeader2, manager2, director2, owner2}.
- `PATCH /api/commissions/:id/recipients/:slot/remove` — same slot enum.

The recipient list rendering in `CommissionsPage` derives the effective rows by combining `commission.snapshot.*` with `commission.recipientOverrides[]`. Snapshot.* is NEVER mutated by an override action — recompute (`computeAllRecipientShares`) computes shares as if no override exists; the override layer is applied at read time only.

## Ambassador Deal Type (R-14, shipped 2026-06-01)

Third deal type alongside Internal and External. Ambassador deals have a small commission rate (1–1.5%), pay **NO VAT 14%** and **NO Withholding 5%**, and instead carry an optional **Developer Tax** (a % of gross commission the developer withholds before paying ARO). Team members are paid **manual fixed EGP amounts** — NOT the per-1000 rate chain.

**Canonical math** (10M deal × 1.5% example):
```
Gross Commission   = dealTotal × commissionRate/100      = 150,000
Developer Tax      = Gross × developerTaxRate/100 (10%)  =  15,000   (0 if disabled)
ARO Net Total      = Gross − Developer Tax               = 135,000
Team Total         = Σ recipients[].amount               (admin-assigned)
ARO Keep           = ARO Net Total − Team Total          (e.g. 135,000 − 10,000 = 125,000)
```

**Schema:**
- `Lead.dealType` enum extended to `["internal","external","ambassador"]`.
- `Lead.ambassadorConfig { commissionRate, developerTaxEnabled, developerTaxRate }` — `commissionRate` mirrors the canonical top-level `Lead.commissionRate` input (reused, not a separate field). Cleared by `validateAndNormalizeExternalDeal` when dealType ≠ ambassador.
- `Commission.ambassadorSplit { isAmbassador, commissionRate, developerTaxEnabled, developerTaxRate, grossCommission, developerTaxAmount, aroNetTotal, recipients[] }`. Each recipient: `{ userId, userName (snapshot), userRole (snapshot), amount, amountPaid (derived), payouts[{date,amount,note}] }`. The per-1000 chain (`snapshot.salesAgent/teamLeader/...`) and `externalSplit` stay null for ambassador deals.

**Key behaviors:**
- `buildAmbassadorSplitForLead(leadDoc)` seeds `recipients[]` with the lead's original sales agent at `amount:0` (admin fills via Edit Collection). `buildSnapshotForLead` nulls the whole chain for ambassador (like external broker-only); recipients live only on `ambassadorSplit`.
- `computeAllRecipientShares` has an ambassador short-circuit: `grossCommission = Σ non-cancelled cycle.claimAmount`; `developerTaxAmount`/`aroNetTotal` derived. It NEVER writes `recipients[].amount` (admin-owned). Helper `ambDevTaxFraction(doc)` returns the decimal tax rate (0 when disabled/non-ambassador).
- `ensureCommissionForLead` handles create + revive (revive matches by `ambassadorSplit.isAmbassador`, refreshes rate/tax config from the lead, PRESERVES `recipients[]` + their payouts).
- Commission-lock: ambassador config is frozen once an active commission exists (PUT `/api/leads/:id` returns 409, same as external).

**7 admin endpoints** (all `auth, salesAdminOnly`, guard `isAmbassador` + non-cancelled):
- `PUT /api/commissions/:id/ambassador-config` — edit developer tax only (commission rate read-only; recomputes gross/tax/net).
- `POST · PUT · DELETE /api/commissions/:id/ambassador-recipients[/:recipientId]` — add (dedupe by userId), edit amount, remove (blocked if payouts exist).
- `POST · PUT · DELETE /api/commissions/:id/ambassador-payouts[/:payoutId]` — per-recipient payouts, capped at owed; `amountPaid` always recomputed from `Σ payouts`.
The Edit Collection ambassador UI uses **immediate-apply** (each action hits its endpoint and refreshes), not the batched Save-All flow.

**Analytics integration:**
- **Annual Summary cards** (`/api/commissions/annual-summary`, received.date trigger): ambassador → Total Claims `+gross`, Net of VAT `+gross` (no ÷1.14), VAT `+0`, Withholding `+0`, Net Revenue `+aroNet`. Excluded from VAT card / Monthly VAT table / Withholding-by-deal table.
- **Annual P&L** (`/api/annual-pnl`): Revenue includes ambassador `aroNet`; "Team & Broker Commissions" folds in `ambassadorSplit.recipients[].payouts[]` dated in-year.
- **Net Profit by Deal** (`/api/commissions/profit-by-deal`): ambassador rows = `{ type:"ambassador", revenue: aroNet, brokerPayouts: 0, teamPayouts: Σ recipient payouts, aroNet }`; orange badge + filter chip on the FE table.
- **Payout Report** (`computePayoutsForMonth`): ambassador recipients aggregate into the regular `byAgent` (agents) section — NOT a separate brokers section — keyed by userId.
- **Reconciliation invariants** (must hold): `Σ deals.revenue === pnl.netRevenue` AND `Σ deals.aroNet === pnl.netRevenue − teamCommissions.total`. Both `profit-by-deal` and `annual-pnl` treat ambassador identically to keep these exact.
- Cycle received-stage pre-fill: ambassador → `claimAmount − developerTax` (or `claimAmount` if tax disabled); internal/external keep `claimAmount − 5% withholding`.

**Role visibility — the Ambassador classification is INTERNAL to admin/sales_admin.** Sales/TL/manager/director must never see any Ambassador indicator. Gated: the Add-Deal "Ambassador" radio, the Deals-page deal-row badge (`isOnlyAdmin && dealType==="ambassador"`), the Commission-card badge + subtitle + Ambassador Calculation button (`(admin‖sales_admin)`), and the AMBASSADOR DETAILS section in Edit Collection. The Commissions page itself is admin/sales_admin-only at the routing level, so its recipient details need no extra per-row redaction. Any future contributor adding Ambassador UI to a surface visible to other roles MUST gate it the same way.
