# ARO CRM — Attendance & Salary System
## Requirements Document for Claude Code

---

## Overview

Build a complete Attendance & Salary management system for ARO CRM. The system replaces fingerprint-based attendance with GPS-based geofenced check-in/check-out, automatically calculates monthly salaries with deductions, and adds a new HR role.

**Core principles:**
- Surgical changes only — do not modify existing features unless explicitly required
- All money displayed in EGP
- All times in Africa/Cairo timezone
- Real-time updates via existing WebSocket infrastructure
- Every mutation logged in audit log
- Mobile-first UI (geolocation accuracy is best on mobile)

---

## 1. New Role: HR

Add a new role `hr` to the existing role hierarchy. Update role enums everywhere (User model, middleware, frontend role checks).

**HR can access:**
- Attendance pages (all employees)
- Salaries pages (all employees)
- Company Off-Days management
- Off-site request approvals
- Users page (read-only — view employees, cannot edit roles or status)

**HR cannot access:**
- Leads, Deals, EOIs
- Sales Team performance pages
- Lead Journey
- Rotation system / Locked filter

**Role hierarchy update:**
```
admin (Owner) > sales_admin > hr > sales_director > manager > team_leader > sales
```

Note: HR is parallel to sales_director in terms of CRM access (lower than sales_admin, higher than sales hierarchy). HR has its own dedicated views.

---

## 2. Working Hours by Role

| Role | Start | End | Total |
|------|-------|-----|-------|
| sales, team_leader, manager, sales_director | 11:00 | 21:00 | 10h |
| sales_admin, hr | 10:00 | 18:00 | 8h |
| admin (Owner) | — | — | No attendance tracking |

End time is informational only. There is **no early check-out deduction** and **no overtime**. The day stays open until check-out is logged.

---

## 3. Weekly Off-Days

**Friday:** Off for everyone. Hard-coded, not configurable per user.

**Saturday:** Configurable per user via dropdown on User profile:
- `always_work` — Saturday is a working day every week
- `always_off` — Saturday is off every week
- `alternating` — alternates weekly, requires `saturdayPatternStartDate`
  - If date matches a "work Saturday", that Saturday is a workday
  - The pattern is computed from the start date: weeks-since-start odd/even

**Owner override:** Owner can override any specific Saturday for any employee using the Day Override tool (see §10).

---

## 4. Office Location & Geofencing

### Settings page (Owner only)

```
Office Location
─────────────────────────────────
Name:      [ARO Investment HQ]
Latitude:  [30.1376]
Longitude: [31.6817]
Radius:    [100] meters

[Use my current location]   [Pin on map]
```

Stored in a Settings collection or as a singleton document. Currently one office, but schema must support array (`companyLocations: []`) for future expansion.

### Distance calculation

Use **Haversine formula** server-side for distance. Never trust client-calculated distance.

```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

### Check-in flow (frontend)

1. User clicks "Check in"
2. Browser requests location permission (first time)
3. `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true`
4. POST to `/api/attendance/check-in` with `{ latitude, longitude, accuracy }`
5. Backend validates distance ≤ radius
6. If valid → record check-in
7. If invalid → return error with distance info

### Anti-spoofing (logged but not blocked)

Record on every check-in:
- `ipAddress` (from request headers)
- `accuracyMeters` (from GPS)
- `userAgent` (mobile vs desktop)

These appear in the day's detail view for admin review. No automatic blocking — admin reviews suspicious entries manually.

---

## 5. Check-in / Check-out Rules

### Check-in
- Only allowed when inside geofence (or with approved off-site request)
- Records: timestamp, lat, lng, distance, accuracy, IP, device
- Computes deduction tier (see §7)
- Sets `attendance.status = 'in_progress'`

### Check-out
- Allowed any time after check-in (including past 21:00 — no overtime)
- Records: timestamp, lat, lng, distance, accuracy
- Sets `attendance.status = 'present'` (or whatever tier was set at check-in)

### Forgotten check-out
- The day stays open indefinitely
- Admin can manually close it via the Day Override tool
- No automatic close at midnight

### Friday & off-days
- Check-in button disabled with message "Today is off"
- Cannot create attendance record for off-days (server validates)

---

## 6. Off-Site Requests

When an employee is away from the office (client meeting, etc.), they can request off-site check-in/check-out.

### Flow (Hybrid approval — agreed)

1. Employee outside geofence clicks "Check in" → button shows "Request off-site check-in"
2. Modal opens, captures GPS location automatically (raw lat/lng only — no third-party API)
3. Employee fills reason, clicks send
4. **Check-in is recorded immediately** with `status: 'pending_offsite_approval'` — timestamp is the moment they clicked
5. Notification fires to all users with off-site approval permission
6. Approver reviews and clicks Approve or Reject:
   - **Approve** → status changes to normal `'present'` (or appropriate late tier based on the original timestamp)
   - **Reject** → check-in is voided, day becomes `'absent'`

### Same flow for check-out

Same modal, same approval logic. Check-out is recorded immediately with pending status.

### Cancellation

Employee can cancel their own pending request as long as it hasn't been approved/rejected yet. After admin action, no cancellation.

### Form fields

```
Off-site request
─────────────────────────────────
Type:        ● Check-in   ○ Check-out
Time:        Auto (timestamp of submission)
Location:    Auto from GPS (raw lat/lng stored)
             Display in admin view: "30.0214, 31.0124  [📍 Open in Maps]"
             Link opens https://www.google.com/maps?q={lat},{lng} in new tab
Reason:      Required text field (min 10 chars)
Attachment:  Optional image (max 2MB)
```

### Limits

No monthly limit on off-site requests. Approvers manage the volume.

### Approval permissions

Same as attendance management permissions (see §15) — any user with the `approveOffSiteRequests` permission can approve. Override permission is separate.

---

## 7. Late Deductions

Tiers computed from the role's start time:

**For sales roles (start 11:00):**
| Check-in time | Deduction |
|---------------|-----------|
| 11:00 – 11:15 | None |
| 11:16 – 11:30 | ¼ day |
| 11:31 – 12:00 | ½ day |
| After 12:00 | 1 full day |

**For non-sales roles (start 10:00):**
| Check-in time | Deduction |
|---------------|-----------|
| 10:00 – 10:15 | None |
| 10:16 – 10:30 | ¼ day |
| 10:31 – 11:00 | ½ day |
| After 11:00 | 1 full day |

**No deduction for early check-out.** Period.

**Computation:** Tier is computed at check-in time based on the user's role start time. Stored as `deductionFraction: 0 | 0.25 | 0.5 | 1`.

---

## 8. Salary Calculation

### Per-employee monthly calculation

```
workingDays = total days in month
            − Fridays in month
            − Saturdays in month if user has saturday=always_off
            − alternating Saturdays (computed from pattern) if alternating
            − Company Off-Days that fall in this month

dailyRate = baseSalary / workingDays

deductionDays = Σ (deductionFraction for each attendance record this month)
              + (1 day for each absence — i.e. workday with no check-in and no override)

totalDeductions = deductionDays × dailyRate

netSalary = baseSalary − totalDeductions
```

### Owner is excluded

Owner has no `baseSalary`, no attendance, no salary record. Filter Owner out of all salary queries and lists.

### baseSalary edit permissions

| Editing salary of... | Allowed roles |
|---------------------|---------------|
| sales, team_leader, manager, sales_director | Owner, Sales Admin, HR (whoever has `manageSalaries` permission) |
| sales_admin, hr | Owner ONLY |

Server-side validation — never trust client.

### Audit log entry on every base salary edit

```javascript
{
  type: 'BASE_SALARY_CHANGED',
  targetUserId: ...,
  changedBy: ...,
  oldValue: 10000,
  newValue: 12000,
  reason: 'Promotion to senior',
  effectiveDate: '2026-06-01',
  timestamp: ...
}
```

Effective date allows future-dated changes. Salary calculations use the value effective on that day.

---

## 9. Sick Day Tracking (Soft Warning)

There is **no formal sick leave type** in the system. When an employee misses a day for illness, the admin uses the Day Override tool with reason="Sick - prescription received on WhatsApp" (or similar).

**Soft limit: 2 sick days per month per employee.**

When admin attempts to override a 3rd day in the same month with a reason matching `/sick|مرض|illness/i`:

- Modal shows red warning banner: "This would be {Name}'s 3rd sick day this month — exceeds the 2-day limit. You can save anyway, but it will be flagged in the audit log."
- Admin can proceed with Save
- Audit log entry includes flag `sickLimitExceeded: true`
- Reports later can surface employees with this flag

The system **does not block** — it warns. Admin discretion.

---

## 10. Day Override Tool

Powerful admin tool to modify any single day's attendance/deduction state.

### Permission

Whoever has `manageAttendance` permission can use Override (per user's decision: option B). Configurable via Owner toggle (see §15).

### Modal

```
Override day
─────────────────────────────────
Employee: Sara Hassan
Date:     Sun, May 10, 2026
Current:  Absent (full day deduction)

Action:
  ○ Cancel deduction (no charge)
  ○ Add full day deduction
  ○ Mark as off-day
  ○ Apply specific deduction fraction (¼ / ½ / 1)

Reason (required, min 10 chars):
  [_________________________________]

[ Sick day warning shown here if applicable ]

[Cancel]  [Save override]
```

### Behavior

- Override stays attached to the day permanently
- Day shows "Override" badge with the reason on hover
- Daily log row gets a subtle highlight (e.g., light amber bg)
- Recalculates monthly totals immediately
- Logs to audit log

### Restrictions

- Cannot override days in finalized months (must unlock first)
- Cannot override future dates beyond today

### Owner Saturday Override (special case)

For employees with `saturday=alternating`, Owner can flip any specific Saturday. Available from User profile or from the daily log.

---

## 11. Company Off-Days

### Page (under Settings)

```
Company Off-Days
─────────────────────────────────
[+ Add off-day]

May 1, 2026   |  Labor Day             | [edit] [delete]
May 18, 2026  |  Company anniversary   | [edit] [delete]
```

### Behavior

- Day is removed from `workingDays` count for everyone
- Check-in disabled that day, button shows "Company off-day: {name}"
- No deduction for any employee
- Cannot be in the past beyond current month
- Cannot delete if it falls in a finalized month

### Permissions

Manage Company Off-Days permission (toggleable for Sales Admin and HR by Owner).

---

## 12. Late Notification (5/month)

When an employee accumulates **5 late check-ins in the current month** (any tier counts: ¼, ½, or full), trigger a notification:

- **Notification recipients:** Owner + all users with `manageAttendance` permission
- Bell icon updates in real-time via existing WebSocket
- Message: "{Employee Name} has been late 5 times this month"
- Click navigates to that employee's attendance page

Trigger fires once per month per employee. Resets at the start of the new month.

---

## 13. Month Finalization

### Finalize button

Located on the salary sheet of each employee. Visible to whoever has `manageSalaries` permission.

### Behavior

When clicked:
- Confirmation modal: "Finalize {Month} {Year} for {Employee}? This locks the salary calculation and prevents further edits."
- On confirm:
  - Snapshot all calculations (workingDays, dailyRate, deductions, netSalary)
  - Set `salaryRecord.finalized = true`
  - Set `salaryRecord.finalizedBy = userId, finalizedAt = now`
  - Lock all attendance records and overrides for that month
  - Lock baseSalary changes for that month (future changes can be made but only effective from next month)

### Owner unlock

Owner (only) can unlock a finalized month if needed (rare). Logs to audit log.

### Bulk finalize

Add a "Finalize all" button on the Salaries list page that finalizes all employees for a given month in one click. Confirmation required.

---

## 14. Salary Sheet UI

Per the mockup. Key components:

### Header
- Employee avatar, name, role, team, start date
- Month navigation (prev/next arrows + month label)

### 4 metric cards
- Base salary
- Working days (with daily rate as subtitle)
- Deductions (red if > 0, in days and EGP)
- Net salary (highlighted in green)

### Action bar
- Edit base salary
- Audit log
- Export (PDF/Excel)
- Finalize {Month} (right-aligned, primary color)

### Daily log table
Columns: Date, Day of week, Check-in, Check-out, Status badge, Deduction (EGP, right-aligned)

Status badges:
- `Present` (green)
- `Late · ¼ day` (amber light)
- `Late · ½ day` (amber medium)
- `Late · full day` (red)
- `Absent` (red)
- `Friday off` (gray)
- `Saturday off` (gray)
- `Off-day: {name}` (gray)
- `Override` + reason text in subtitle (purple)
- `In progress` (green, current day)
- `Off-site (pending)` (yellow)
- `Off-site (approved)` (teal)

Click any row → opens Override modal for that day.

### Permissions on this page
- All users with `manageSalaries` see this page
- Owner sees it for everyone (including sales_admin, hr)
- Sales Admin / HR see it for sales-side roles only (not for sales_admin or hr)

---

## 15. Permissions System

### Owner-only Settings page

```
Settings → Permissions
─────────────────────────────────────────────

Manage Salaries
  ☑ Sales Admin
  ☑ HR

Manage Attendance (includes Override)
  ☑ Sales Admin
  ☑ HR

Approve Off-site Requests
  ☑ Sales Admin
  ☑ HR

Manage Company Off-Days
  ☑ Sales Admin
  ☑ HR
```

### Permanently Owner-only (not toggleable)

- Manage Office Location & Geofence
- Edit base salary for sales_admin and hr roles
- Unlock finalized months
- Manage permission toggles themselves
- Override Saturday alternating pattern dates

### Real-time revocation

When Owner toggles off a permission for someone currently using it:
- Use existing WebSocket infrastructure (same as Active/Inactive force-logout)
- Frontend listens for `permissions:updated` event
- Frontend re-checks permissions, redirects away from now-inaccessible pages
- Any in-flight request from that user without permission returns 403

### Storage

Single Settings document with permissions object:

```javascript
{
  permissions: {
    manageSalaries: { salesAdmin: true, hr: true },
    manageAttendance: { salesAdmin: true, hr: true },
    approveOffSiteRequests: { salesAdmin: true, hr: true },
    manageCompanyOffDays: { salesAdmin: true, hr: true }
  }
}
```

Backend middleware checks:
- Owner always passes
- For sales_admin role: check `permissions.{action}.salesAdmin === true`
- For hr role: check `permissions.{action}.hr === true`
- Otherwise: 403

---

## 16. Audit Log

Single collection. Records every sensitive action.

```javascript
{
  type: 'BASE_SALARY_CHANGED' | 'DAY_OVERRIDDEN' | 'MONTH_FINALIZED' | 'MONTH_UNLOCKED'
       | 'PERMISSION_CHANGED' | 'OFFICE_LOCATION_CHANGED' | 'OFFSITE_APPROVED'
       | 'OFFSITE_REJECTED' | 'COMPANY_OFFDAY_ADDED' | 'COMPANY_OFFDAY_REMOVED',
  targetUserId: ObjectId,        // who is affected (if applicable)
  performedBy: ObjectId,         // who did it
  before: {},                    // state before (for changes)
  after: {},                     // state after
  reason: String,                // user-provided reason
  flags: {                       // any system flags
    sickLimitExceeded: Boolean,
    finalizedMonthOverride: Boolean
  },
  ipAddress: String,
  timestamp: Date
}
```

Indexes: `targetUserId + timestamp`, `performedBy + timestamp`, `type + timestamp`.

Audit log accessible to Owner from any salary sheet (full history) and per-employee from their profile.

---

## 17. MongoDB Schemas

### User (additions to existing)

```javascript
{
  // ... existing fields
  baseSalary: Number,                    // EGP, default null (Owner has none)
  saturdaySchedule: {
    type: String,
    enum: ['always_work', 'always_off', 'alternating'],
    default: 'always_work'
  },
  saturdayPatternStartDate: Date,        // required if alternating
  workShift: {                            // computed from role, but stored for reference
    startTime: String,                    // "11:00" or "10:00"
    endTime: String                       // "21:00" or "18:00"
  }
}
```

### Settings (singleton or named-key collection)

```javascript
{
  key: 'attendance_settings',
  companyLocations: [{
    name: String,
    latitude: Number,
    longitude: Number,
    radiusMeters: { type: Number, default: 100 },
    isActive: Boolean
  }],
  permissions: {
    manageSalaries: { salesAdmin: Boolean, hr: Boolean },
    manageAttendance: { salesAdmin: Boolean, hr: Boolean },
    approveOffSiteRequests: { salesAdmin: Boolean, hr: Boolean },
    manageCompanyOffDays: { salesAdmin: Boolean, hr: Boolean }
  }
}
```

### CompanyOffDay

```javascript
{
  date: Date,                  // stored as start of day, Africa/Cairo
  name: String,                // "Labor Day", etc.
  createdBy: ObjectId,
  createdAt: Date
}
```
Index: `{ date: 1 }` unique.

### Attendance

```javascript
{
  userId: ObjectId,
  date: Date,                  // start of day, Africa/Cairo
  checkIn: {
    timestamp: Date,
    latitude: Number,
    longitude: Number,
    distanceMeters: Number,
    accuracyMeters: Number,
    ipAddress: String,
    deviceType: String,        // 'mobile' | 'desktop'
    isOffSite: Boolean,
    offSiteRequestId: ObjectId
  },
  checkOut: { /* same structure */ },
  status: {
    type: String,
    enum: ['in_progress', 'present', 'late_quarter', 'late_half',
           'late_full', 'absent', 'pending_offsite', 'override']
  },
  deductionFraction: { type: Number, default: 0 },  // 0, 0.25, 0.5, or 1
  override: {
    action: String,            // 'cancel_deduction' | 'add_full_deduction' | 'mark_off_day' | 'apply_fraction'
    reason: String,
    overriddenBy: ObjectId,
    overriddenAt: Date,
    sickLimitExceeded: Boolean
  },
  computedAt: Date
}
```
Indexes: `{ userId: 1, date: 1 }` unique, `{ date: 1 }`.

### OffSiteRequest

```javascript
{
  userId: ObjectId,
  type: String,                // 'check_in' | 'check_out'
  requestedAt: Date,           // timestamp captured at submission
  latitude: Number,
  longitude: Number,
  reason: String,
  attachmentUrl: String,       // optional
  status: String,              // 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewedBy: ObjectId,
  reviewedAt: Date,
  reviewNotes: String,
  attendanceId: ObjectId       // link to created attendance record
}
```
Indexes: `{ userId: 1, requestedAt: -1 }`, `{ status: 1, requestedAt: -1 }`.

### SalaryRecord (per user per month)

```javascript
{
  userId: ObjectId,
  year: Number,
  month: Number,               // 1-12
  baseSalary: Number,          // snapshot of base salary used
  workingDays: Number,
  dailyRate: Number,
  deductionDays: Number,
  totalDeductions: Number,
  netSalary: Number,
  finalized: Boolean,
  finalizedBy: ObjectId,
  finalizedAt: Date,
  computedAt: Date
}
```
Index: `{ userId: 1, year: 1, month: 1 }` unique.

### AuditLog (see §16)

---

## 18. API Endpoints

### Settings
```
GET    /api/settings/attendance              - Owner only
PATCH  /api/settings/office-location          - Owner only
PATCH  /api/settings/permissions              - Owner only
```

### Attendance (employee actions)
```
GET    /api/attendance/today                  - own record for today
POST   /api/attendance/check-in               - body: { latitude, longitude, accuracy }
POST   /api/attendance/check-out              - body: { latitude, longitude, accuracy }
GET    /api/attendance/my-month?month=&year=  - own monthly history
```

### Attendance (admin)
```
GET    /api/attendance/users/:userId/month    - requires manageAttendance
GET    /api/attendance/today/all              - team view, requires manageAttendance
POST   /api/attendance/:attendanceId/override - requires manageAttendance
```

### Off-Site Requests
```
POST   /api/offsite/request                   - body: { type, latitude, longitude, reason, attachment }
DELETE /api/offsite/:requestId                - cancel own pending request
GET    /api/offsite/pending                   - requires approveOffSiteRequests
POST   /api/offsite/:requestId/approve        - requires approveOffSiteRequests
POST   /api/offsite/:requestId/reject         - body: { notes }, requires approveOffSiteRequests
```

### Salary
```
GET    /api/salary/users/:userId/:year/:month - requires manageSalaries (with role check for SA/HR target)
PATCH  /api/users/:userId/base-salary          - body: { newSalary, effectiveDate, reason }
POST   /api/salary/:userId/:year/:month/finalize
POST   /api/salary/:userId/:year/:month/unlock - Owner only
GET    /api/salary/list/:year/:month           - all employees, requires manageSalaries
```

### Company Off-Days
```
GET    /api/company-off-days?year=             - all roles can read
POST   /api/company-off-days                  - requires manageCompanyOffDays
DELETE /api/company-off-days/:id              - requires manageCompanyOffDays
```

### Audit Log
```
GET    /api/audit?targetUserId=&type=&limit=  - Owner only (others see filtered subset)
```

### Note on Map Display

No third-party geocoding API. In the off-site approval UI, raw `latitude, longitude` are shown alongside a button:

```
[📍 Open in Maps ↗]  →  https://www.google.com/maps?q={lat},{lng}
```

This opens Google Maps in a new browser tab — completely free, no API key, no cost.

---

## 19. Frontend Pages

New pages to create:

```
/attendance                         - Sales view: check-in card + own monthly log
/attendance/team                    - Admin: today's team view (table)
/salaries                           - Admin: all employees grid for selected month
/salaries/:userId                   - Admin: salary sheet for one employee
/settings/office-location           - Owner: geofence config
/settings/permissions               - Owner: role permission toggles
/settings/company-off-days          - Admin: manage off-days
/offsite-requests                   - Admin: pending requests inbox
/audit-log                          - Owner: full audit trail
```

Existing pages to update:
- Sidebar: add Attendance, Salaries, Off-site Requests links (visible per permissions)
- Users page: add baseSalary field, saturdaySchedule dropdown, Owner-restricted edit for sales_admin/hr salaries
- Notifications: add "5 lates this month" template
- **Dashboard: add Check-in Widget at the very top** (see §19A)

---

## 19A. Dashboard Check-in Widget

A compact one-row widget pinned at the top of every dashboard (Sales dashboard, Admin dashboard, HR dashboard) so users never miss check-in/check-out.

### Visibility
- Visible to: all roles **except** Owner (sales, team_leader, manager, sales_director, sales_admin, hr)
- Hidden for: Owner (no attendance tracking)

### States and rendering

**State 1 — Not checked in, inside geofence:**
```
[icon: green pin] Good morning, {Name}                     [ Check in ]
                  Ready to check in · Inside ARO HQ ({distance}m)
```
Button: solid teal, primary style. Clicking triggers full check-in flow (request GPS, validate, record).

**State 2 — Not checked in, outside geofence:**
```
[icon: red pin] Outside ARO HQ · {distance} away           [ Request off-site ]
                In a meeting? Request off-site approval
```
Border accent: red (`#F09595`). Button: secondary style. Opens off-site request modal.

**State 3 — Currently checked in:**
```
[icon: green clock] Checked in at {time}                   [ Check out ]
                    You've been working for {duration}
```
Button: solid coral/orange, primary style. Duration ticks live (every minute).

**State 4 — Already checked in and out for today:**
```
[icon: gray check] Done for today                          [ View details ]
                   {check_in_time} → {check_out_time} · {total_hours}
```
Button: ghost/outline. Links to attendance page.

**State 5 — Friday or off-day:**
```
[icon: coffee] {day_name}
               Enjoy your day off
```
No button. Slightly muted styling.

**State 6 — Pending off-site approval:**
```
[icon: amber clock] Off-site check-in pending review       [ Cancel request ]
                    Submitted {duration} ago
```
Button: secondary outline.

### Behavior
- The widget is the **same component** used as the main element on the Attendance page — single source of truth, no duplication
- On the dashboard, the widget is the only thing pinned; everything else (stats, charts) flows below it
- Geofence status updates automatically every 60 seconds without page refresh
- After successful check-in/out, the widget transitions to the new state immediately (no full page reload)
- Clicking the icon area or non-button parts of the widget navigates to the full Attendance page
- The widget does **not** appear on every page — only on dashboards and the attendance page itself

### Implementation note
Build the widget as a single shared React component (e.g., `<CheckInWidget mode="compact" />`). Use `mode="compact"` for the dashboard placement, `mode="full"` for the attendance page (which adds the monthly history table below). This keeps logic in one place.

---

## 20. Mobile-First Considerations

The check-in flow must work flawlessly on mobile:
- Geolocation API requires HTTPS (already met via Vercel)
- Request `enableHighAccuracy: true` for GPS-grade accuracy
- Show loading state while waiting for GPS fix (can take 2-5 seconds)
- Fallback message if user denies permission: "Enable location in browser settings to check in"
- Desktop check-in is allowed but warn: "Mobile gives more accurate location"

---

## 21. Tests / Acceptance Criteria

Before considering this done:

- [ ] HR role created, can access only attendance + salaries + off-days + offsite, blocked from leads/deals/EOIs
- [ ] Sales user outside geofence cannot check in (button disabled, message shown)
- [ ] Sales user inside geofence checks in successfully, lat/lng/distance recorded
- [ ] Late check-in computes correct tier (¼/½/full) based on role start time
- [ ] Off-site request created, captured GPS, reverse-geocoded address visible in admin view
- [ ] Off-site approval flips status to present with original timestamp preserved
- [ ] Off-site rejection voids the check-in
- [ ] Override on a single day cancels the deduction and updates monthly net salary
- [ ] 3rd sick override in a month shows red warning banner but still allows save
- [ ] Saturday `alternating` correctly identifies work/off Saturdays based on pattern start
- [ ] Company off-day prevents check-in for everyone that day
- [ ] Finalized month locks all attendance edits, override modal disabled
- [ ] Owner can unlock a finalized month
- [ ] Permission toggle off → user loses access in real-time without refresh
- [ ] Sales Admin cannot edit own base salary (only Owner can)
- [ ] Sales Admin cannot edit HR base salary (only Owner can)
- [ ] 5 lates in a month → notification sent to Owner + admins with manageAttendance
- [ ] Owner has no attendance and no salary record
- [ ] Dashboard check-in widget renders correctly in all 6 states (not checked in inside, not checked in outside, checked in, done for today, off-day, pending off-site)
- [ ] Dashboard widget hidden for Owner
- [ ] All sensitive actions appear in audit log with before/after values

---

## 22. Implementation Order (suggested phasing)

To avoid breaking anything, build in this order:

**Phase 1 — Foundation (no UI yet)**
1. Add `hr` role to enums and middleware
2. Create new schemas (Settings, CompanyOffDay, Attendance, OffSiteRequest, SalaryRecord, AuditLog)
3. Add `baseSalary`, `saturdaySchedule`, `saturdayPatternStartDate` to User model
4. Create permission middleware that reads from Settings doc

**Phase 2 — Settings**
5. Office Location settings page (Owner)
6. Permissions toggles page (Owner)
7. Real-time permission revocation via WebSocket

**Phase 3 — Core attendance**
8. Sales attendance page with geofenced check-in/out
9. Build the shared `<CheckInWidget>` component (used on attendance page + dashboard)
10. Pin the widget at the top of all dashboards (Sales, Admin, HR)
11. Late tier computation
12. Today's team view for admins

**Phase 4 — Off-site & Off-days**
13. Off-site request flow (create, approve, reject, cancel)
14. Off-site approval UI shows raw lat/lng + "Open in Maps" link (no third-party API)
15. Company off-days management

**Phase 5 — Salary**
16. Salary calculation engine (workingDays, dailyRate, etc.)
17. Salary sheet UI with daily log
18. Day Override modal
19. Sick day soft warning
20. Base salary edit with audit
21. Month finalization

**Phase 6 — Polish**
22. Notifications (5 lates, off-site requests, etc.)
23. Audit log viewer
24. Export to PDF/Excel
25. Mobile UX testing and refinement

---

## 23. Important Notes for Claude Code

- Follow CLAUDE.md surgical change rules — do not refactor existing code unless required
- Use existing WebSocket infrastructure for real-time updates, do not add a new layer
- Use existing notification system (bell icon)
- Follow existing UI patterns (dark glass sidebar, solid dark cards with colored top borders)
- All currency displayed with thousand separators (e.g., `9,712`) and "EGP" suffix
- All dates displayed in Africa/Cairo timezone using existing date utilities
- Server-side validation on every endpoint — never trust client-computed values (especially distance, deduction tier, salary calculations)
- Use existing audit/logging patterns where possible
- After Phase 1, deploy to Railway via `git push` and verify before continuing
- After each phase, manual smoke test on mobile and desktop

---

**End of requirements document.**
