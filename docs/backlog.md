# Backlog — De Los Reyes Doctors

_Last updated: 2026-06-01 (Phase 0 Sprint)_

---

## Critical Bugs

### ~~[CB-01] billing_entries table missing from Supabase~~ — FIXED ✓
Billing section refactored to query `appointments` table. `sbGetBillingRecords()`, `sbUpdateBillingPayment()`, `sbCreateBillingEntry()` added to supabase-client.js. No DB migration required.

### ~~[CB-02] Admin auth routing trap on deep links~~ — FIXED ✓
`history.replaceState(null,'',location.pathname)` called at top of DOMContentLoaded before async auth check. Deep link hashes are cleared immediately.

---

## High Priority

### [H-01] Doctor portal: schedule appointments highlighted in red
**Impact:** All appointment cards on the schedule tab show in red — visually alarming and confusing for doctors.
**Fix:** Replace red highlight with status-appropriate colors (green = confirmed/checked-in, amber = pending, gray = completed/cancelled). If the same patient appears, group or link the cards visually.
**Affected file:** doctor-portal.html schedule rendering logic

### ~~[H-02] Admin portal: timestamp format bugs~~ — FIXED ✓
`fmtTime()` hardened with `parseInt(...,10)` strict parsing and NaN guard. Output guaranteed "H:MM AM/PM" format.

### ~~[H-03] Admin portal: dashboard date inconsistency~~ — VERIFIED RESOLVED ✓
Audit confirmed current code has no hardcoded date strings. `today()` is the sole source for all date comparisons. Issue was pre-existing in older code.

### [H-04] Placeholder content not replaced
**Impact:** Production visitors see fake address, phone, email, and Google Maps pointing to wrong location.
**Items to replace:**
- Address: "123 Rizal Avenue, Sta. Mesa, Manila 1016" (3 places in index.html)
- Phone: "(02) 8123-4567 / 0917-123-4567"
- Email: info@delosreyesdoctors.com (must exist and be monitored)
- Google Maps embed URL (needs real place embed from confirmed address)
**Affected file:** index.html

### [H-05] Contact form is non-functional
**Impact:** Users who submit the contact form see only an alert. No email is sent, no record is saved.
**Fix options:** (A) Wire to Supabase table `contact_messages` + admin notification, (B) Use Resend/EmailJS, (C) Use Formspree
**Affected file:** index.html contact section

### [H-06] Logo white background square on login screens
**Impact:** Brand logo shows a white rectangular background on dark login screens and in the hero section, breaking visual quality.
**Fix:** Apply `mix-blend-mode: multiply` or `background: transparent` wrapper, or use a PNG with transparent background.
**Affected files:** patient-portal.html, doctor-portal.html, admin-portal.html, index.html hero

### ~~[H-07] "0% SATISFACTION RATE" broken stat in hero~~ — FIXED ✓
Removed `data-count="99"` from satisfaction span. Stat now renders static `99%` — no animation that flashes `0%` on load.

---

## Medium Priority

### [M-01] Patient portal: sidebar profile widget CSS misalignment
**Impact:** Patient name text ("sibam Sapple") clips or overlaps the avatar initials circle.
**Fix:** `display: flex; align-items: center; gap: 12px; padding: 12px;` on the profile row container.
**Affected file:** patient-portal.html sidebar profile widget

### [M-02] EHR records show raw variable "s" instead of field data
**Impact:** On the Records tab, diagnosis, notes, prescription, treatment plan, and follow-up fields all show "s" instead of actual data.
**Root cause:** JavaScript variable leak — likely `s` used as a loop variable gets rendered into the template.
**Fix:** Audit EHR rendering template in patient-portal.html Records tab.
**Affected file:** patient-portal.html records section rendering

### ~~[M-03] Duplicate "+ NEW APPOINTMENT" button~~ — VERIFIED RESOLVED ✓
Audit found no duplicate button in current code. Single header-level action only.

### ~~[M-04] Filter pills have no active state indicator~~ — FIXED ✓
Added `updateFilterActiveStates()` helper. Active filter inputs/selects show green border. Called from all filter and clear functions in billing and appointments sections.

### [M-05] Contact form has hardcoded input values
**Impact:** Users must delete "Juan dela Cruz" and "juan@example.com" before typing their own info.
**Fix:** Move hardcoded values from `value=""` attributes to `placeholder=""` attributes.
**Affected file:** index.html contact form

### ~~[M-06] Admin billing: date cells need white-space: nowrap~~ — FIXED ✓
`white-space:nowrap` added to date `<td>` and fee `<td>` in `renderBillingTable()`.

### [M-07] Admin doctor cards: sharp green underline on initials circle
**Impact:** Visual artifact that looks unintentional.
**Fix:** Remove `border-bottom` from the initials circle element.
**Affected file:** admin-portal.html doctors section

### ~~[M-08] Delete button in doctor cards too prominent~~ — FIXED ✓
Delete button changed to new `.btn-delete` CSS class — muted gray by default, crimson on hover only.

---

## Low Priority

### [L-01] No SRI hashes on CDN scripts
**Impact:** Supply chain attack risk if Tailwind or Supabase CDN is compromised.
**Fix:** Add `integrity="sha256-..."` attributes to all CDN script/link tags.

### [L-02] No Content-Security-Policy header
**Impact:** Medium-risk XSS exposure in browsers that support CSP.
**Fix:** Add CSP `<meta>` tag or configure at hosting layer.

### [L-03] Queue polling is 30 seconds (not realtime)
**Impact:** Doctor/admin queue can be up to 30 seconds stale. May cause confusion in busy clinics.
**Fix:** Migrate to Supabase Realtime subscriptions for queue_entries and appointments tables.

### [L-04] No appointment email/SMS notifications
**Impact:** Patients book appointments but receive no confirmation email or reminder.
**Fix:** Integrate Resend (email) + optional Semaphore/Globe API (SMS) triggered on appointment creation.

### [L-05] No PDF export for EHR or billing
**Impact:** Doctors cannot print/export patient records. Billing has no receipt generation.
**Fix:** Use browser `window.print()` with a print CSS stylesheet, or jsPDF library.

### [L-06] Supabase CLINIC_ID hardcoded in supabase-client.js
**Impact:** System only works for one clinic. Not multi-tenant.
**Note:** Acceptable for MVP. Refactor when scaling to multiple clinics.

---

## Future Ideas

### [F-01] SMS appointment reminders
Send SMS 24 hours and 1 hour before appointment using Philippine SMS gateway (Semaphore, Globe).

### [F-02] Patient mobile app (React Native / Flutter)
Native mobile experience for patients once the web version is validated.

### [F-03] Doctor availability calendar
Doctors can block out dates, set different hours per day, set vacation leaves.

### [F-04] Multi-clinic support
Remove hardcoded CLINIC_ID and allow admin to manage multiple clinic branches.

### [F-05] Analytics dashboard
Weekly/monthly reports: patient volume, revenue, most common diagnoses, no-show rates.

### [F-06] PhilHealth integration
Auto-fill PhilHealth member info, generate PhilHealth-compatible billing forms.

### [F-07] Telemedicine / Video consultation
Add Jitsi or Daily.co video call integration for remote consultations.

### [F-08] Lab results upload
Allow doctors to attach lab result files (PDF/image) to EHR records.
