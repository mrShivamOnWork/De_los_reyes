---
name: project-admin-portal
description: "Admin portal (admin-portal.html) requirements spec — screens, flows, data fields, edge cases. Produced 2026-06-01."
metadata:
  type: project
---

Locked spec for admin-portal.html. Single HTML file, dark theme, Tailwind CDN, Supabase via supabase-client.js.

**Why:** Admin portal is step 3 (final) of the 3-portal rebuild pipeline.

**How to apply:** When building admin-portal.html, reference this spec for correct Supabase function names, screen states, and edge case handling. Do not re-ask any design or requirements questions.

## Screens (6 total — sidebar nav, desktop-first)

1. **Auth (Login)** — email/password, role guard via sbCheckProfileRole() → 'admin' only. Non-admin hard-redirect to login.
2. **Dashboard** — stats row + live all-doctor queue columns + recent appointments table + New Walk-in button (always visible, top-right).
3. **Queue** — full queue across all doctors; remove entry; reorder position (up/down buttons, no drag required for MVP).
4. **Appointments** — paginated full list; filter by date / doctor / status; inline status toggle via sbUpdateAppointmentStatus; check-in via sbCheckInPatient(appointmentId).
5. **Billing** — date-filtered ledger from `billing_entries`; columns: Date | Patient | Service | Fee | Status toggle (paid/unpaid) | Notes; daily total footer row.
6. **Doctors** — list all via sbGetAllDoctors(); activate/deactivate toggle (sbUpdateDoctor); create new (modal, sbCreateDoctor); edit (inline panel, sbUpdateDoctor); delete (sbDeleteDoctor, confirm dialog).
7. **Patients** — list via sbGetPatients(); search by name; click row → history panel showing sbGetMyPatientRecord(profileId) + sbGetEHR(patientId) records.

## Walk-in Flow (primary action)

1. Admin clicks "New Walk-in" button (fixed position, always visible).
2. Modal opens. Step 1: Patient — type-ahead search against sbGetPatients() by name; if not found, show "Enter name manually" fallback (stores as free-text note, not a new patient row — MVP limitation, flag to user).
3. Step 2: Doctor — radio list from sbGetAllDoctors() showing only status='active' doctors; shows current queue depth per doctor.
4. Step 3: Service — dropdown: General Consultation / Specialist Care / Health Screening / Pediatric Care.
5. Confirm button → sbAddWalkIn({ patientId, doctorId, purpose }). On success: toast with assigned queue number, modal closes, dashboard queue refreshes.
6. Failure: inline error in modal, do not close.

## Billing Entry Flow

- Billing entries are read/written directly via `db.from('billing_entries')`.
- Create entry: button "Add Entry" → modal: patient search, service dropdown, fee (number input), status (paid/unpaid), notes (optional) → insert row.
- Paid/unpaid toggle: inline in table row → `db.from('billing_entries').update({ status }).eq('id', id)`.
- Daily total: computed client-side by summing fee for all rows matching selected date filter where status = 'paid'.
- No invoice PDF generation in MVP.

## Doctor Management Flow

- List: first_name, last_name, specialty, prc_license, work_days, work_hours, status badge (active/inactive).
- Create modal fields: first_name*, last_name*, specialty*, prc_license*, work_days (text), work_hours (text), status (default 'active'). Required fields marked *.
- Edit panel (slide-in or modal): same fields, pre-populated. Save → sbUpdateDoctor(id, updates).
- Delete: confirm dialog "Delete Dr. [Name]? This cannot be undone." → sbDeleteDoctor(id). Block delete if doctor has active queue entries today (client-side check via sbGetQueue(doctorId)).
- Activate/deactivate toggle: sbUpdateDoctor(id, { status: 'active'|'inactive' }). Inactive doctors hidden from walk-in doctor picker.

## Data Fields Per Screen

**Dashboard stats:** count of today's appointments (sbGetTodayAppointments().length), total waiting across all queues (sum sbGetQueue per doctor where status='waiting'), revenue today (sum billing_entries.fee where date=today and status='paid').

**Queue columns per doctor:** queue_number, patient first+last name, appointment purpose, status badge (waiting/in_session/completed/no_show), elapsed wait time (client-computed from queue entry created_at).

**Appointments table:** date, time, patient name, doctor name, purpose, status badge, action buttons (Check In / Cancel).

**Billing table:** created_at date, patient name (joined), service, fee, status toggle, notes.

**Patients panel:** first_name, last_name, dob, sex, contact, address, blood_type, allergies; EHR history list (visit_date, doctor name, diagnosis, notes, follow_up).

## Critical Edge Cases

- Walk-in with manual name (no patient record): disable confirm if patientId is null and no fallback name entered; show warning "Patient will not be linked to a medical record."
- sbAddWalkIn failure (e.g. no active doctors): surface error in modal, keep form data intact.
- Delete doctor with today's queue entries: block with warning "Dr. [Name] has X patients in queue today. Deactivate instead."
- Billing daily total: recalculate whenever a status toggle fires — do not cache.
- sbCheckProfileRole returns non-admin mid-session: clear session storage, redirect to login.
- Empty states required on all list views: Dashboard (no appointments today), Queue (all queues empty), Appointments (no results for filter), Billing (no entries for date), Doctors (no doctors), Patients (no patients / no search results).
- 30s polling on Dashboard queue columns only; stop polling when navigating away from Dashboard.
- Appointments filter: default to today's date on load; allow clearing to show all.

## Supabase Calls Summary

- sbLogin / sbLogout / sbGetUser / sbCheckProfileRole
- sbGetTodayAppointments() — dashboard stats + appointments default view
- sbGetAllAppointments() — appointments full list
- sbUpdateAppointmentStatus(id, status)
- sbCheckInPatient(appointmentId)
- sbGetQueue(doctorId) — called per doctor for dashboard columns
- sbAddWalkIn({ patientId, doctorId, purpose })
- sbGetPatients() — patients list + walk-in search
- sbGetMyPatientRecord(profileId) — patient detail panel
- sbGetEHR(patientId) — patient history panel
- sbGetAllDoctors() — doctors list + walk-in doctor picker
- sbCreateDoctor({...}) / sbUpdateDoctor(id, updates) / sbDeleteDoctor(id)
- db.from('billing_entries') — direct queries for billing ledger (select, insert, update)

Related: [[project-delosreyes-clinic]], [[project-patient-portal]], [[project-doctor-portal]]
