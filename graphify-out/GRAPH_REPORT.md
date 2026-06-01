# GRAPH REPORT — De Los Reyes Doctors
_Generated: 2026-06-01 | Method: Manual code analysis_

---

## Community Map

The codebase has 4 communities (feature modules), all connected through one shared service layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                    supabase-client.js                           │
│                  (CORE — all portals depend on this)            │
└──────────┬─────────────┬────────────────┬───────────────────────┘
           │             │                │                │
    index.html   patient-portal.html   doctor-portal.html  admin-portal.html
  (Public Site)  (Patient SPA)         (Doctor SPA)        (Admin SPA)
```

---

## Community 1: Public Landing Page

**Entry point:** `index.html` (1,665 lines)

**Dependencies:**
- `supabase-client.js` → `sbGetDoctors()` (loads doctor cards)
- Tailwind CSS CDN
- Google Fonts CDN (Playfair Display, Figtree)
- Google Maps iframe (location section)

**Sections (DOM IDs / data-section):**
- `#hero` — ECG canvas animation, word-swap, stats bar
- `#services` — bento grid (4 service cards)
- `#how-it-works` — 3-step flow
- `#doctors` — Supabase-loaded + 3-card fallback
- `#testimonials` — 3 static cards
- `#faq` — ARIA accordion (10 questions)
- `#location` — Maps iframe + hours table
- `#cta-portal` — Patient Portal CTA section
- `#contact` — Form (non-functional backend)
- `footer`

**Key functions:**
- `loadDoctors()` — fetches from Supabase, renders cards with `esc()`
- `card(d)` — renders individual doctor card HTML
- ECG canvas animation (custom vanilla JS, `<canvas>` element)
- Word-swap headline (setInterval-based)
- FAQ accordion (click + Escape key handlers)

**Status:** DONE ✓ | CTO conditional approved

---

## Community 2: Patient Portal

**Entry point:** `patient-portal.html` (1,168 lines)

**Dependencies:**
- `supabase-client.js` — all patient data operations
- Tailwind CSS CDN
- Google Fonts CDN (Montserrat, Open Sans)

**Views / Tabs (hash-based routing):**
| View | DOM ID | Purpose |
|------|--------|---------|
| Auth (login/register) | `#auth-screen` | Entry gate |
| Home | `#tab-home` | Queue position, next appointment, Quick Book |
| Book | `#tab-book` | Doctor cards, slot selection, booking confirmation |
| Appointments | `#tab-appts` | Upcoming + past list, cancel/reschedule |
| Records | `#tab-records` | EHR card list, expandable detail |
| Profile | `#tab-profile` | Edit info, change password |

**Key functions:**
- `initApp()` — auth check, load profile, route to home tab
- `showAuth(err)` — show/hide auth screen
- `switchTab(id)` — tab navigation
- `doLogin() / doRegister()` — auth flows
- `loadHome()` — queue position + next appointment
- `loadBook()` — doctor cards with available slots
- `doBookConfirm()` — final booking submission
- `loadAppointments()` — appointment list
- `cancelAppt() / rescheduleAppt()` — self-service actions
- `loadRecords()` — EHR list
- `loadProfile() / saveProfile()` — profile management

**Supabase calls:**
`sbLogin`, `sbRegisterPatient`, `sbGetUser`, `sbGetDoctors`, `sbGetBookedTimes`, `sbBookAppointment`, `sbGetMyAppointments`, `sbCancelAppointment`, `sbRescheduleAppointment`, `sbGetMyPatientRecord`, `sbGetEHR`, `sbUpdatePatient`, `sbUpdatePassword`

**Status:** DONE ✓ | CTO approved

---

## Community 3: Doctor Portal

**Entry point:** `doctor-portal.html` (861 lines)

**Dependencies:**
- `supabase-client.js` — queue, EHR, patient data
- Tailwind CSS CDN
- Google Fonts CDN (Montserrat, Open Sans)

**Views / Tabs:**
| View | Purpose |
|------|---------|
| `#tab-queue` | Live patient queue, Call Next, patient panel |
| `#tab-schedule` | Weekly strip, day selector, appointment list |
| `#tab-patients` | Patient search + patient history |
| `#tab-profile` | Shift toggle, personal info |

**Key functions:**
- `initApp()` — auth check, match user to doctors row, load queue
- `switchTab(id)` — tab navigation
- `loadQueue()` — fetch today's queue for logged-in doctor
- `renderQueue(queue)` — render queue list
- `callNext()` — advance queue (calls `sbCallNext`)
- `openPatientPanel(entry)` — show current patient EHR form
- `saveDoneEHR()` — save EHR + auto-complete appointment
- `toggleShift()` — toggle doctor availability status
- `buildWeekStrip()` — render 7-day calendar strip
- `fetchScheduleForDay(dStr)` — load appointments for selected day
- `loadPatients()` — patient list
- `openPatientDetail(patientId)` — patient history view
- `loadPatientHistory(patientId)` — EHR timeline

**Supabase calls:**
`sbLogin`, `sbGetUser`, `sbGetAllDoctors`, `sbGetQueue`, `sbCallNext`, `sbSaveEHR`, `sbGetEHR`, `sbMarkNoShow`, `sbGetPatients`, `sbUpdateDoctor`

**Polling:** `setInterval(loadQueue, 30000)` — 30-second queue refresh

**Status:** DONE ✓ | CTO approved

---

## Community 4: Admin Portal

**Entry point:** `admin-portal.html` (1,058 lines)

**Dependencies:**
- `supabase-client.js` — all admin data operations
- `db` (direct Supabase client) — billing queries (billing_entries table — MISSING)
- Tailwind CSS CDN
- Google Fonts CDN (Montserrat, Open Sans)

**Views / Sections:**
| Section | DOM ID | Purpose |
|---------|--------|---------|
| Dashboard | `#sec-dashboard` | Stats, live queue, recent appointments |
| Queue | `#sec-queue` | Full queue management |
| Appointments | `#sec-appointments` | Full appointment list + CRUD |
| Billing | `#sec-billing` | Fee ledger — ⚠️ BROKEN (billing_entries missing) |
| Doctors | `#sec-doctors` | Doctor management |
| Patients | `#sec-patients` | Patient registry |

**Key functions:**
- `initApp()` — auth check + role guard (admin only)
- `switchSection(id)` — section navigation
- `loadDashboard()` — stats + queue + recent appointments
- `loadStats()` — patient count, queue depth, revenue today
- `loadDashQueue()` — live queue per doctor
- `loadRecentAppts()` — recent appointments table
- `loadQueueSection()` — full queue management
- `checkInAppt(id)` — check in patient (calls `sbCheckInPatient`)
- `loadAppointments()` — appointments with filters
- `filterAppts() / clearApptFilters()` — appointment filtering
- `loadBilling()` — ⚠️ queries `billing_entries` (table missing from DB)
- `togglePayment(id, status)` — toggle paid/unpaid
- `loadDoctors()` — doctor CRUD
- `loadPatients()` — patient registry

**Known bugs:**
- `billing_entries` table does not exist in Supabase → all billing queries will throw errors
- Auth routing trap: deep hash links bypass login UI

**Supabase calls (via client):**
`sbLogin`, `sbGetUser`, `sbGetAllDoctors`, `sbGetAllAppointments`, `sbGetTodayAppointments`, `sbCheckInPatient`, `sbAddWalkIn`, `sbUpdateAppointmentStatus`, `sbCreateDoctor`, `sbUpdateDoctor`, `sbDeleteDoctor`, `sbGetPatients`

Direct `db` calls: `db.from('billing_entries')` (4 occurrences — table missing)

**Polling:** `setInterval(loadDashboard, 30000)` — 30-second dashboard refresh

**Status:** UI DONE ✓ | Billing section BROKEN | CTO approved with caveat

---

## Shared Service Layer

**File:** `supabase-client.js` (~350 lines)

**Consumers:** All 4 HTML files

**Function Inventory:**
```
AUTH
  sbLogin(email, password)
  sbLogout()
  sbGetUser()                         → { user, profile } with clinic data
  sbRegisterPatient({...})            → creates auth user + profile + patient rows
  sbCheckProfileRole(userId)          → returns role string

DOCTORS
  sbGetDoctors()                      → active doctors only
  sbGetAllDoctors()                   → all doctors
  sbCreateDoctor({...})
  sbUpdateDoctor(id, updates)
  sbDeleteDoctor(id)

APPOINTMENTS
  sbGetMyAppointments(profileId)      → patient's appointments
  sbGetAllAppointments()              → all (admin)
  sbGetTodayAppointments()            → today's confirmed/pending
  sbBookAppointment({...})
  sbCancelAppointment(id, reason)
  sbRescheduleAppointment(id, date, time)
  sbUpdateAppointmentStatus(id, status)
  sbGetBookedTimes(doctorId, dateStr) → blocked time slots

QUEUE
  sbGetQueue(doctorId)                → today's queue for doctor
  sbCallNext(doctorId)                → advance queue (auto-complete current)
  sbAdvanceQueue(queueEntryId)        → mark single entry done
  sbMarkNoShow(queueEntryId, apptId)  → no-show handling
  sbCheckInPatient(appointmentId)     → check in + create queue entry
  sbAddWalkIn({patientId, doctorId, purpose}) → walk-in + immediate queue

EHR
  sbGetEHR(patientId)                 → all EHR records for patient
  sbSaveEHR(record)                   → upsert by appointment_id

PATIENTS
  sbGetPatients()                     → all patients
  sbGetMyPatientRecord(profileId)     → logged-in patient's record
  sbUpdatePatient(patientId, updates)

PROFILE
  sbUpdatePassword(newPassword)
  sbUploadPhoto(bucket, filePath, file)
```

**Hardcoded value (single-tenant MVP):**
`CLINIC_ID = 'a1b2c3d4-0000-0000-0000-000000000001'` (used in: sbRegisterPatient, sbBookAppointment, sbAddWalkIn, sbCreateDoctor)

---

## Database Dependency Map

```
supabase-client.js reads/writes:
  clinics           → sbGetUser (via profiles join)
  profiles          → sbGetUser, sbCheckProfileRole, sbRegisterPatient
  patients          → sbGetPatients, sbGetMyPatientRecord, sbUpdatePatient, sbRegisterPatient
  doctors           → sbGetDoctors, sbGetAllDoctors, sbCreateDoctor, sbUpdateDoctor, sbDeleteDoctor
  appointments      → sbBook*, sbGet*, sbUpdate*, sbCallNext, sbCheckInPatient, sbAddWalkIn
  ehr_records       → sbGetEHR, sbSaveEHR
  queue_entries     → sbGetQueue, sbCallNext, sbCheckInPatient, sbAddWalkIn, sbMarkNoShow
  billing_entries   → admin-portal.html directly (DOES NOT EXIST in schema)
```

---

## Critical Path for Features

**Patient books appointment:**
`patient-portal.html#tab-book` → `sbGetDoctors()` → `sbGetBookedTimes()` → `sbBookAppointment()` → `appointments` table

**Admin checks in patient:**
`admin-portal.html#sec-appointments` → `checkInAppt(id)` → `sbCheckInPatient()` → creates `queue_entries` row, updates `appointments.status`

**Doctor calls next patient:**
`doctor-portal.html#tab-queue` → `callNext()` → `sbCallNext(doctorId)` → updates `queue_entries` (in_session/completed), updates `appointments` status

**Doctor saves EHR:**
`doctor-portal.html patient-panel` → `saveDoneEHR()` → `sbSaveEHR(record)` → `ehr_records` upsert + appointment/queue auto-complete

**Admin adds walk-in:**
`admin-portal.html` Walk-in button → `sbAddWalkIn()` → creates `appointments` + `queue_entries` simultaneously

---

## Affected Files by Change Type

| Change Type | Files to Edit |
|------------|--------------|
| Auth flow change | supabase-client.js + all portals' `initApp()` |
| New appointment field | schema.sql + supabase-client.js + patient-portal.html + admin-portal.html |
| Queue logic change | supabase-client.js `sbCallNext()` + doctor-portal.html + admin-portal.html |
| New EHR field | schema.sql + supabase-client.js `sbSaveEHR()` + doctor-portal.html + patient-portal.html |
| Billing fix | supabase/billing.sql (create billing_entries) + admin-portal.html |
| Brand/style change | All 4 HTML files (each has independent CSS) |
| Landing page only | index.html only |
