# De Los Reyes Doctors — Session Handoff (updated 2026-05-31)

Paste this file path into a new Claude Code session and say "read HANDOFF.md and continue the portal rebuilds."

---

## TL;DR — Where We Are

- `index.html` — **FULLY DONE**. All 7 agents ran. CTO conditional approved. Do not touch unless user says so.
- `patient-portal.html` — **FULLY DONE** (2026-06-01). All 7 agents ran. CTO APPROVED for soft launch. Do not touch unless user says so.
- `doctor-portal.html` — **FULLY DONE** (2026-06-01). All 7 agents ran. CTO APPROVED for soft launch. Do not touch unless user says so.
- `admin-portal.html` — **FULLY DONE** (2026-06-01). All 7 agents ran. CTO APPROVED for soft launch. Do not touch unless user says so.

The vision for all 3 portals is fully locked (see below). Do not re-ask the user any of the design decisions listed here.

---

## Project Location

```
d:\websitesShyt\projects\De_los_reyes\
```

Dev server: `node serve.mjs` → `http://localhost:3000`
Screenshot: `node screenshot.mjs http://localhost:3000/patient-portal.html`

**Puppeteer is at project root `node_modules/puppeteer` — NOT at any nateh path. Use `require('puppeteer')` with `node -e`.**

---

## Brand Tokens (already in index.html :root — copy into portals)

```css
--crimson: #D31A22;
--green: #00A859;
--bg: #080E14;
--bg-2: #0C1520;
--bg-3: #111E2B;
--bg-portal: #11161B;
```

- **Fonts:** `Playfair Display` (headers) + `Figtree` (body) — Google Fonts CDN
- **Tagline:** "Professional Care You Can Trust"
- **Logo:** `brand_assets/brand_logo.jpg`

---

## Demo Credentials

- Patient: patient@demo.com / demo1234
- Doctor: santos@delosreyes.com / doctor1234
- Admin: admin@delosreyes.com / admin1234

---

## Tech Stack (all portals)

- Pure HTML/CSS/JS, single file, all styles inline
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Google Fonts: Playfair Display + Figtree
- Supabase via CDN — `supabase-client.js` in project root (sbSignIn, sbSignUp, sbGetMyAppointments, sbGetMyEHR, sbGetDoctors, sbBookAppointment, sbCancelAppointment, sbRescheduleAppointment)
- XSS: all Supabase data must be sanitized with `esc()` before innerHTML:
  ```js
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  ```

---

## Reddit Pain Points to Fix in All 3 Portals

- **#1 — Too many clicks** → reduce to 2 taps + confirm for primary actions
- **#2 — Doesn't work on mobile** → mobile-first, bottom tab bar (not sidebar)
- **#3 — Too complicated** → simplify dashboards to 3 key actions max

---

## Agent Pipeline (run for EACH portal in order)

```
1. product-manager    → Requirements, screen inventory, task list
2. ui-ux-designer     → UX flow, layout, mobile-first decisions
3. frontend-engineer  → Build the full portal HTML (write the actual file)
4. security-engineer  → XSS audit, auth flow, Supabase RLS gaps
5. qa-engineer        → Edge cases, empty states, error states
6. code-reviewer      → Code quality, production readiness
7. cto-ship-ready     → Final approval
```

---

## PATIENT PORTAL — Full Vision (decisions locked, do not re-ask)

### Navigation
- **Bottom tab bar** (mobile-first, like Instagram/WhatsApp)
- 5 tabs: **Home** / **Book** / **Appointments** / **Records** / **Profile**
- Desktop: sidebar or top nav (tab bar stays on mobile)

### Dashboard (Home tab)
- **Live queue position card** — "#3 in line · Est. wait: ~18 min" (load from Supabase)
- Next upcoming appointment card
- Quick Book CTA button (→ Book tab)
- Empty state for new patients (no appointments yet)

### Booking (Book tab) — Zocdoc-style
- **Doctor cards** with name, specialty, photo, next available slots shown inline
- Tap a slot → confirm screen (date, time, doctor, service summary)
- 2 taps + confirm. NO wizard. NO multi-step form.
- 4 doctors / 4 services: General Consultation, Specialist Care, Health Screening, Pediatric Care
- Problem: patients might book the wrong doctor — solve by showing specialty prominently on card

### Appointments tab
- List of upcoming + past appointments
- Status badges: Upcoming / Confirmed / Completed / Cancelled
- **Self-service cancel / reschedule** — allowed up to 2 hours before appointment
- Cancel/reschedule opens a bottom sheet or modal (not a new page)

### Records tab (EHR)
- Card list of health records from Supabase (sbGetMyEHR)
- Each card: date, doctor, diagnosis, notes, follow-up
- Tap to expand detail view

### Profile tab
- Edit name, email, phone, date of birth
- Change password
- Log out button

### Design
- Dark premium: `--bg-portal: #11161B` base
- Green CTAs (`--green`), crimson accents (`--crimson`)
- Playfair Display headers, Figtree body

---

## DOCTOR PORTAL — Full Vision (decisions locked, do not re-ask)

### Mode: Speed Mode — queue-first
- Dashboard IS the queue — doctor sees the list the moment they log in
- No extra clicks to get to work

### Primary Flow
1. Queue view: numbered list of waiting patients (name, wait time, appointment type)
2. "Call Next" button → opens current patient panel
3. Patient panel: name, age, reason for visit + **3-field EHR form** (Diagnosis, Notes, Follow-up date)
4. "Done" → saves EHR to Supabase, marks patient complete, returns to queue

### 4 Views (tabs or sidebar nav)
1. **Queue** — live waiting list, Call Next button
2. **Schedule** — today's full schedule + week view
3. **Patients** — search patient history, view past EHR records
4. **Profile** — availability toggle (On/Off shift), personal info

### Availability Toggle
- Prominent on/off toggle on dashboard header — "On Shift / Off Shift"
- Affects whether new walk-ins are assigned to this doctor

### Design
- Dark premium, same tokens
- Queue items: green border = current, amber = waiting, gray = done

---

## ADMIN PORTAL — Full Vision (decisions locked, do not re-ask)

### Primary Action: Walk-in Quick Booking
- Big "New Walk-in" button on dashboard — this is the #1 action admins perform
- Opens a minimal form: Patient name (or search existing) → Doctor → Service → Confirm
- Creates appointment + adds to queue immediately

### Dashboard
- Stats: Patients today / Queue depth / Revenue today
- Live queue (all doctors, side by side)
- Recent appointments list

### Sections (sidebar nav — admin is desktop-primary)
1. **Dashboard** — stats + queue + quick walk-in booking
2. **Queue** — full queue management, drag to reorder, remove patient
3. **Appointments** — full list, filter by date/doctor/status, create/edit/cancel
4. **Billing** — simple fee ledger: patient name, service, fee, paid/unpaid toggle, daily total
5. **Doctors** — list, activate/deactivate, edit profile
6. **Patients** — patient registry, search, view history

### Billing (simple — not a full accounting system)
- Table: Date | Patient | Service | Fee | Status (Paid/Unpaid toggle) | Notes
- Daily total at bottom
- No invoice generation needed for MVP

### Design
- Dark premium, same tokens
- Admin gets a more information-dense layout (desktop-first is OK here)

---

## index.html — Status (DO NOT REBUILD)

Fully done. 12 sections:
1. Navbar (floating pill, hamburger mobile)
2. Hero (ECG canvas, word-swap headline, stats)
3. Red marquee
4. Services bento grid (4 cards)
5. How It Works (3 steps)
6. Doctors (Supabase + fallback)
7. Testimonials
8. FAQ accordion (10 Q, ARIA, Escape key)
9. Location + Hours (Maps iframe + hours table)
10. Patient Portal CTA (3 cards + green + crimson-outline btns)
11. Contact (form + email validation)
12. Footer

Security already applied to index.html:
- `esc()` on all Supabase doctor fields
- iframe sandbox attr on Maps
- `rel="noopener noreferrer"` on all external links

---

## What to Do in the New Session

1. `invoke frontend-design skill` (required by CLAUDE.md before any frontend code)
2. Read `brand_assets/brand_logo.jpg` and `brand_assets/brand_guidelines.png`
3. Run the 7-agent pipeline for **patient-portal.html** first
4. Then doctor-portal.html
5. Then admin-portal.html
6. Start `node serve.mjs` before screenshots
7. Screenshot each portal after build, do 2 comparison rounds minimum

**Do NOT re-ask any design decisions listed in this file. They are locked.**
