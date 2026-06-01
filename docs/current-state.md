# Current State — De Los Reyes Doctors

_Last updated: 2026-06-01 (Phase 0 Sprint)_

## Overall Status: SOFT LAUNCH CANDIDATE — Phase 0 blockers resolved

All 4 pages are feature-complete at the UI level. One critical database bug blocks billing. Multiple UI polish issues are documented.

---

## Completed Features

### index.html (Public Landing Page) — DONE ✓
- Floating pill navbar with hamburger mobile menu
- Hero: ECG canvas animation, word-swap headline, stats bar, floating appointment card
- Red marquee strip
- Services bento grid (General Consultation, Specialist Care, Health Screening, Pediatric Care)
- How It Works (3-step flow)
- Doctors section (Supabase-loaded with 3-card fallback)
- Testimonials (3 cards)
- FAQ accordion (10 questions, ARIA-compliant, Escape key support)
- Location + Hours (Google Maps iframe + hours table)
- Patient Portal CTA section
- Contact form (client-side validation only — non-functional backend)
- Footer (4 columns, auto-year)
- XSS protection via `esc()` on all Supabase fields
- `esc()` on Supabase fields, sandbox on Maps iframe, noopener on external links

### patient-portal.html — DONE ✓
- Auth: login + multi-step registration form
- Home tab: live queue position card, next appointment card, Quick Book CTA
- Book tab: doctor cards with inline available slots, 2-tap booking flow
- Appointments tab: upcoming + past list, status badges, cancel/reschedule bottom sheet
- Records tab: EHR card list (Supabase), expandable detail view
- Profile tab: edit personal info, change password, logout
- Mobile-first: bottom tab bar navigation
- Desktop: sidebar navigation

### doctor-portal.html — DONE ✓
- Auth: login with role enforcement
- Queue tab: live patient list, queue numbers, wait times, "Call Next" button
- Patient panel: name, age, reason + 3-field EHR form (Diagnosis, Notes, Follow-up)
- Save → auto-completes appointment and queue entry
- "Done" returns to queue
- Schedule tab: weekly strip + day selector + appointment list for selected day
- Patients tab: patient search, patient history view, past EHR records
- Profile tab: on/off shift toggle, personal info
- 30-second queue polling

### admin-portal.html — DONE ✓
- Auth: login with admin role enforcement
- Dashboard: stats (patients today, queue depth, revenue today), live queue all doctors, recent appointments
- Queue section: full queue management, check-in, no-show marking
- Appointments section: full list with date/doctor/status filters, new appointment creation modal
- Billing section: fee ledger sourced from `appointments` table — fully functional ✓
  - Filter by date and payment status (All / Paid / Unpaid / Partial / Waived)
  - Toggle paid/unpaid on each row; updates `payment_status` + `paid_at` on appointments
  - "Add Entry" creates a completed appointment record with billing columns
  - Revenue stat on dashboard reads from `appointments.consultation_fee` where payment_status='paid'
- Doctors section: doctor cards, add/edit/deactivate/delete modals; delete button muted (M-08)
- Patients section: patient registry with search, view patient history
- Walk-in booking: New Walk-in button → minimal form → immediate queue entry
- 30-second dashboard polling
- Active filter state: billing and appointments filter inputs show green border when value set

### supabase-client.js — DONE ✓
- All auth helpers (login, logout, register, getUser)
- All data helpers (appointments, EHR, queue, doctors, patients, billing columns)
- Check-in system (sbCheckInPatient, sbAddWalkIn)
- Queue advancement (sbCallNext)
- Photo upload (sbUploadPhoto)

### Supabase Schema — DONE ✓
- Full schema: clinics, profiles, patients, doctors, appointments, ehr_records, queue_entries
- RLS enabled on all tables with correct policies
- Helper functions: get_user_role(), get_user_clinic_id(), handle_new_user trigger
- Migrations applied: billing columns, check-in columns, doctor bio, appointment_type
- **Billing uses `appointments` table** — no separate billing_entries table needed or created

---

## Current Priority Issues

### CRITICAL — All resolved ✓
- ~~billing_entries table missing~~ → Billing now uses appointments table (CB-01 fixed)
- ~~Auth routing trap on deep links~~ → Hash cleared before auth check (CB-02 fixed)

### HIGH (remaining — affects user experience)
1. **[H-04] Placeholder content not replaced** — address, phone, email, Google Maps embed still fake
2. **[H-05] Contact form non-functional** — sends alert only, no backend
3. **[H-01] Doctor portal schedule** — appointment cards show in red instead of status-appropriate colors
4. **[H-06] Logo white background** — white square visible on dark login screens and hero

### MEDIUM (remaining polish)
5. **[M-02] EHR records show raw variable "s"** — patient portal Records tab, field rendering bug
6. **[M-01] Patient portal sidebar** — profile widget CSS misalignment
7. **[M-05] Contact form hardcoded values** — "Juan dela Cruz" must be placeholders not values
8. **[M-07] Doctor card initials circle** — green underline artifact

### LOW (nice to have)
9. No SRI hashes on CDN scripts (Tailwind, Supabase)
10. No Content-Security-Policy header
11. No Supabase Realtime (polling every 30s instead)
12. No email/SMS appointment reminders
13. No PDF export for EHR records or billing receipts

---

## Next Milestones

**Milestone 1 — Fix Critical Bugs (Pre-Launch)**
- Create `billing_entries` table in Supabase
- Replace placeholder content
- Wire contact form

**Milestone 2 — UI Polish Sprint**
- Fix all HIGH and MEDIUM issues from issues_to_be_fixed.txt

**Milestone 3 — Production Hardening**
- Add CSP headers
- Add SRI hashes
- Verify all RLS policies with anon role
- Deploy to hosting (Vercel / Netlify / custom domain)

**Milestone 4 — Enhanced Features**
- Email notifications (appointment confirmation, reminders)
- Supabase Realtime for queue updates
- PDF export for EHR
