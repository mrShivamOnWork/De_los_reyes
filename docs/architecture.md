# Architecture — De Los Reyes Doctors

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Pure HTML5 / CSS3 / Vanilla JavaScript |
| CSS Framework | Tailwind CSS v3 via CDN |
| Fonts | Google Fonts CDN — Playfair Display + Figtree (landing) / Montserrat + Open Sans (portals) |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Supabase Client | `@supabase/supabase-js` v2 via CDN |
| Dev Server | `node serve.mjs` (custom Node HTTP server, port 3000) |
| Screenshots | Puppeteer (devDependency, project-local `node_modules/`) |
| Hosting | Not yet deployed (local dev only) |

## File Structure

```
De_los_reyes/
├── index.html              — Public landing page (1,665 lines)
├── patient-portal.html     — Patient SPA (1,168 lines)
├── doctor-portal.html      — Doctor SPA (861 lines)
├── admin-portal.html       — Admin SPA (1,058 lines)
├── supabase-client.js      — Shared Supabase helpers (~350 lines)
├── serve.mjs               — Node dev server (port 3000)
├── screenshot.mjs          — Puppeteer screenshot helper
├── brand_assets/
│   ├── brand_logo.jpg
│   └── brand_guidelines.png
├── supabase/
│   ├── schema.sql          — Full DB schema + RLS policies
│   ├── seed.sql            — Demo data + test accounts
│   ├── billing.sql         — Billing columns migration
│   ├── checkin-system.sql  — Check-in + queue columns migration
│   ├── fix-constraints.sql
│   ├── fix-patient-rls.sql
│   ├── fix-trigger.sql
│   ├── reset-database.sql
│   └── setup-storage.sql
├── docs/                   — Project Brain (this directory)
├── issues/                 — Known UI bugs
├── issues_to_be_fixed/     — Detailed refactor backlog
└── package.json            — { puppeteer devDependency only }
```

## Architecture Pattern

**Single-File SPA** — each portal is a single HTML file with:
- Inline CSS (Tailwind + custom `:root` CSS variables)
- Inline JavaScript (all logic, no external JS files except Supabase + Tailwind CDN)
- Client-side routing via hash (`#dashboard`, `#queue`, `#billing`, etc.)
- No build step, no bundler, no framework

This is intentional for simplicity and fast iteration in MVP phase.

## Database Schema (Supabase / PostgreSQL)

```
clinics              — clinic records (multi-tenant foundation)
profiles             — extends auth.users (role, clinic_id, name)
patients             — patient demographic data
doctors              — doctor records (specialty, work schedule, status)
appointments         — booking records (date, time, status, type, billing columns)
ehr_records          — electronic health records (SOAP format + prescriptions JSONB)
queue_entries        — live daily queue per doctor
```

### Key Relationships

```
auth.users (Supabase)
    └── profiles (1:1 via trigger)
            ├── patients (1:1 via profile_id)
            └── doctors (1:1 via profile_id)

clinics
    ├── profiles → patients → appointments → ehr_records
    │                                    └── queue_entries
    └── doctors ──────────────┘
```

### Billing Architecture

- `billing.sql` adds payment columns to `appointments` table: `payment_status`, `consultation_fee`, `total_paid`, `paid_at`, `payment_notes`.
- Admin billing section queries `appointments` table directly — no separate `billing_entries` table.
- New helpers in `supabase-client.js`: `sbGetBillingRecords()`, `sbUpdateBillingPayment()`, `sbCreateBillingEntry()`.
- Revenue stat: sums `consultation_fee` on appointments where `payment_status='paid'` and `date=today`.

## Authentication Architecture

- Supabase Auth (email + password)
- Role enforcement: `profiles.role` checked via `get_user_role()` SQL function
- Portal-level role check: each portal's `initApp()` reads the user's profile and validates role
- No cross-portal session sharing — each portal manages its own auth state
- Doctor portal matches logged-in user's `profile_id` to `doctors.profile_id`

## API Architecture

All data access goes through helper functions in `supabase-client.js`:

| Function | Purpose |
|---------|---------|
| `sbLogin / sbLogout / sbGetUser` | Auth |
| `sbRegisterPatient` | Patient signup |
| `sbGetDoctors / sbGetAllDoctors` | Doctor list |
| `sbBookAppointment / sbCancelAppointment / sbRescheduleAppointment` | Appointments |
| `sbCheckInPatient / sbAddWalkIn` | Check-in system |
| `sbCallNext` | Queue advancement |
| `sbGetQueue` | Queue read |
| `sbSaveEHR / sbGetEHR` | Health records |
| `sbGetPatients / sbUpdatePatient` | Patient management |
| `sbCreateDoctor / sbUpdateDoctor / sbDeleteDoctor` | Doctor management |
| `sbGetTodayAppointments` | Dashboard data |
| `sbGetBillingRecords(dateFilter)` | Billing ledger (queries appointments) |
| `sbUpdateBillingPayment(apptId, status)` | Mark paid/unpaid on appointment |
| `sbCreateBillingEntry({...})` | Create manual billing entry (Completed appointment) |

## Polling Strategy

- Doctor queue refreshes every **30 seconds** via `setInterval`
- Admin dashboard refreshes every **30 seconds**
- No WebSocket / Supabase Realtime subscription in use
- Polling stops when user navigates away from the relevant section

## Storage

- Supabase Storage configured (`setup-storage.sql`)
- Doctor profile photos: `doctors/` bucket
- Patient photo upload: `sbUploadPhoto()` in supabase-client.js

## Security Architecture

- Row Level Security (RLS) enabled on all 7 tables
- All HTML-rendered user data passed through `esc()` XSS sanitizer
- External links use `rel="noopener noreferrer"`
- Google Maps iframe uses `sandbox` attribute
- **Gaps:** No CSP header, no SRI hashes on CDN scripts

## Known Architecture Constraints

1. **Single-tenant only** — CLINIC_ID hardcoded in `supabase-client.js`
2. **No build system** — no minification, no tree-shaking, no bundling
3. **No offline support** — fully requires Supabase connectivity
4. **No email/SMS notifications** — patients get no reminders
5. **30s polling** — queue is not realtime (up to 30s stale)
