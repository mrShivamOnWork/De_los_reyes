# Architecture Decisions — De Los Reyes Doctors

---

## Decision Log

---

### D-001 — Pure HTML/CSS/JS (no framework)
**Date:** 2026-05-28
**Decision:** Build all portals as single-file pure HTML/CSS/JS SPAs.
**Reason:** Maximum simplicity for MVP. No build toolchain, no npm dependencies at runtime, no framework learning curve. Client can edit files directly. Fastest path to working software.
**Alternatives Considered:** React (too much setup), Next.js (overkill for MVP), Vue (unnecessary for one-developer, one-client project).

---

### D-002 — Supabase as backend
**Date:** 2026-05-28
**Decision:** Use Supabase (PostgreSQL + Auth + Storage + RLS) as the full backend.
**Reason:** Provides auth, database, storage, and RLS in one platform. No backend server to write or maintain. Filipino developers have strong familiarity. Free tier sufficient for MVP.
**Alternatives Considered:** Firebase (NoSQL — poor fit for relational clinic data), custom Node.js API (too much work for MVP), PocketBase (less mature ecosystem).

---

### D-003 — Hybrid queue model (booked + walk-in)
**Date:** 2026-05-28
**Decision:** Support both online-booked and walk-in patients in a single merged per-doctor queue.
**Reason:** Real Philippine clinics always have both. A system that only handles online bookings would be unusable on day one.
**Alternatives Considered:** Bookings-only (too restrictive), walk-ins-only (misses value of online booking).

---

### D-004 — Per-doctor independent queues
**Date:** 2026-05-28
**Decision:** Each doctor has their own queue. Queue numbers reset daily.
**Reason:** Doctors work independently, at different speeds, with different specialties. A global queue creates chaos in a multi-doctor clinic.
**Alternatives Considered:** Global single queue (rejected — too chaotic), shared pool with assignment (too complex for MVP).

---

### D-005 — Admin = Receptionist
**Date:** 2026-05-28
**Decision:** The `admin` role handles ALL receptionist duties (check-in, walk-in, billing).
**Reason:** Small clinic with one front desk. No need for a separate "receptionist" role in MVP.
**Alternatives Considered:** Separate receptionist role (premature for single-clinic MVP).

---

### D-006 — Booked appointments require manual check-in to enter queue
**Date:** 2026-05-28
**Decision:** Online bookings do NOT auto-enter the queue. Admin must click "Check In" when patient physically arrives.
**Reason:** Prevents ghost appointments from clogging the queue. Patients are often late, no-show, or cancel verbally.
**Alternatives Considered:** Auto-queue at appointment time (rejected — creates ghost entries and unreliable queue).

---

### D-007 — 3-field EHR form for MVP
**Date:** 2026-05-28
**Decision:** Doctor's EHR entry form has only 3 fields: Diagnosis, Notes, Follow-up date.
**Reason:** Minimizes friction for doctors. Full SOAP notes, vitals, and lab results can be added in a later sprint.
**Alternatives Considered:** Full SOAP format (too complex for MVP), no EHR at all (loses core medical value).

---

### D-008 — Single hardcoded CLINIC_ID
**Date:** 2026-05-29
**Decision:** CLINIC_ID `a1b2c3d4-0000-0000-0000-000000000001` hardcoded in `supabase-client.js`.
**Reason:** MVP is for one specific clinic. Multi-tenant support adds complexity that isn't needed yet.
**Alternatives Considered:** Dynamic clinic discovery (premature), subdomain-based tenancy (way too complex for MVP).

---

### D-009 — Montserrat + Open Sans for portal fonts (vs Playfair + Figtree for landing)
**Date:** 2026-06-01
**Decision:** Portals use Montserrat + Open Sans instead of brand's Playfair Display + Figtree.
**Reason:** Portals are dense, data-heavy application UIs. Playfair Display is a display serif — poor legibility for small table text, labels, and status badges. Montserrat is more legible at small sizes.
**Alternatives Considered:** Figtree everywhere (reasonable, lower brand inconsistency, future revisit possible).

---

### D-010 — billing_entries as separate table (NOT appointments columns)
**Date:** 2026-06-01
**Decision (intended):** Admin portal was built to query a `billing_entries` table for the billing section.
**Problem:** The `billing.sql` migration adds payment columns to `appointments`, but the admin portal queries a `billing_entries` table that was never created. This is a **bug introduced during development**, not an intentional decision.
**Fix needed:** Either create `billing_entries` table or refactor billing section to use appointments columns.
