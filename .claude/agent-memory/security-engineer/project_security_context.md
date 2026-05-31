---
name: project-security-context
description: Security architecture, known vulnerabilities, and key findings for the De Los Reyes clinic landing page and portals
metadata:
  type: project
---

This is a public-facing clinic web app (index.html + patient/doctor/admin portals) backed by Supabase.

**Stack:** Pure HTML/CSS/JS (no framework), Tailwind CDN, Supabase JS SDK via jsDelivr CDN, no build toolchain.

**Auth model:** Supabase anon key is exposed client-side (by design for this SDK pattern), but Row-Level Security (RLS) is relied upon to enforce data isolation. RLS correctness has NOT been verified — this is the highest-risk unknown.

**Key security findings from first audit (2026-05-31):**

1. CRITICAL — Exposed Supabase anon key in supabase-client.js (line 3). Key is `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`. This is expected for Supabase anon keys but requires RLS to be correctly configured on ALL tables. If RLS is misconfigured, this key allows unauthenticated reads/writes.

2. HIGH — `loadDoctors()` in index.html (lines 1623–1643) uses unescaped template literals `${p.name}`, `${p.spec}`, `${p.bio}`, `${p.photo}`, `${p.sched}` injected directly into `grid.innerHTML`. If Supabase DB is compromised or an admin inserts malicious data, stored XSS executes for all visitors.

3. HIGH — `card()` function sets `src="${p.photo}"` and `alt="${p.name}"` without escaping. A photo URL containing `"` breaks out of attribute context. A name containing `"` breaks the alt attribute.

4. MEDIUM — `submitContact()` uses `alert(\`Thank you, ${name}!\`)`. Native alert() does NOT execute HTML/JS, so this is NOT an XSS vector. The name value is safe here.

5. MEDIUM — No CDN SRI (Subresource Integrity) on Supabase JS CDN or Tailwind CDN scripts.

6. MEDIUM — Google Maps iframe has no `sandbox` attribute.

7. LOW — No Content-Security-Policy header (static HTML, so requires server config).

8. LOW — `sbCancelAppointment` and `sbRescheduleAppointment` in supabase-client.js update by appointment ID only, with no ownership check in the JS layer (relies entirely on Supabase RLS).

9. INFO — Admin/Doctor portal links are visible in the page footer and contact section, exposing their URLs to all visitors.

**RLS verification is the most critical outstanding item** — without confirming RLS policies, the anon key exposure is unquantifiable risk.

**Why:** First full security audit of the project. Use this as baseline for future sessions.

**How to apply:** When reviewing any future changes to supabase-client.js, doctor card rendering, or portal auth flows, reference these findings to avoid re-introducing them.

---

## Doctor Portal Audit (doctor-portal.html, 2026-06-01)

### XSS Surface
- Queue rows (line 550): `e.queue_number` injected unescaped into innerHTML — integer from DB, low exploit risk but technically unsafe
- `profRow()` (line 420): label and value parameters are NOT escaped inside the function itself. Callers in `switchSubTab('info')` (line 811) pass pre-escaped values so double-escaping happens. If any future caller passes raw data, this is a stored XSS sink.
- `schedBadge()` return value (line 718): badge text from appointment status is injected via innerHTML without escaping — DB-sourced, not direct user input
- All other surfaces (queue name/purpose, EHR fields, patient list, patient detail, profile) correctly use `esc()`

### Auth Guard
- DOMContentLoaded guard (line 431-438): checks `sbCheckProfileRole` === `'doctor'`, handles null correctly (returns null when no profile row, treated as !== 'doctor', redirects). Solid.
- Login handler (line 475-476): same check, same logic. Consistent.
- `initApp()` (line 446-449): dangerous fallback — if `profile_id` lookup fails, matches doctor record by first_name+last_name. Name collision = wrong doctor record loaded.

### EHR Write / Ownership
- `doctorRec.id` is a client-side JS object loaded once at login. No per-request re-verification. If RLS on `ehr_records` enforces `doctor_id = auth.uid()` via a join, this is fine. If RLS trusts the submitted `doctor_id` field, any doctor can write EHRs attributed to another doctor by overriding `doctorRec.id` in the browser console.
- `sbAdvanceQueue(currentEntry.id)` (line 624): passes queue entry ID with no ownership assertion in JS. Relies 100% on Supabase RLS for `queue_entries`.
- `clinic_id` hardcoded as `'a1b2c3d4-0000-0000-0000-000000000001'` in `sbSaveEHR` call (line 621) — acceptable for single-clinic deployment.

### Direct db Calls
- `toggleShift` (line 667) and `toggleAvailability` (line 847): `db.from('doctors').update({status}).eq('id', doctorRec.id)` — doctorRec.id is client-controlled. If Supabase RLS on `doctors` table enforces `profile_id = auth.uid()`, safe. If RLS is absent, a doctor can update any other doctor's status by changing doctorRec.id in console.

### Inline onclick / ID injection
- Line 548: `openQueueAction('${esc(e.id)}','${esc(e.appointments?.id||'')}')` — UUIDs are alphanumeric+hyphen, `esc()` applied. Safe. The rendered onclick attribute uses single quotes as delimiters and esc() HTML-encodes `'` to `&#x27;`, which correctly breaks out of any injection attempt.
- Line 649 (openQueueAction footer): `quickNoShow('${esc(qId)}','${esc(apptId)}')` — same pattern, IDs passed through from prior esc(), safe.

### Over-fetching / Privacy
- `sbGetAllAppointments()` (supabase-client.js line 123): no WHERE clause, returns ALL clinic appointments regardless of doctor. Client-side filters by `doctor_id` at line 713. Any authenticated doctor can call this function in the browser console and read every appointment in the clinic.
- `sbGetPatients()` (supabase-client.js line 187): no filter, returns all patients. All patient PII (dob, sex, contact, blood_type, allergies, address) is visible to any authenticated doctor. May be intentional in a small clinic but is a HIPAA/privacy concern.
