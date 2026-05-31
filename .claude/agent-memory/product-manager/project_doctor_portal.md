---
name: project-doctor-portal
description: "Doctor portal (doctor-portal.html) requirements spec — screens, flows, data fields, edge cases. Produced 2026-06-01."
metadata:
  type: project
---

Locked spec for doctor-portal.html. Single HTML file, dark theme, Tailwind CDN, Supabase via supabase-client.js.

**Why:** Doctor portal is step 2 of the 3-portal rebuild pipeline (after patient-portal.html).

**How to apply:** When building doctor-portal.html, reference this spec for correct Supabase function names, screen states, and edge case handling. Do not re-ask any design or requirements questions.

## Screens
- Auth (Login) — email/password, role guard via sbCheckProfileRole() → 'doctor' only
- Queue (Dashboard) — default post-login view, shift toggle in header, 30s polling
- Schedule — today + all appointments via sbGetTodayAppointments() / sbGetAllAppointments()
- Patients — sbGetPatients() list, click → sbGetEHR(patientId)
- Profile — read-only doctor info from sbGetUser() + doctors table

## Core Flow
Login → Queue → Call Next (sbCallNext) → Current Patient Panel (inline) → Fill Diagnosis/Notes/Follow-up → Done (sbSaveEHR + sbAdvanceQueue) → Queue refreshes

## Key Supabase Calls
- sbLogin / sbLogout / sbGetUser / sbCheckProfileRole
- sbGetQueue(doctorId) — queue_entries with patient + appointment joins
- sbCallNext(doctorId) — advances queue, returns next entry
- sbAdvanceQueue(queueEntryId) / sbMarkNoShow(queueEntryId, appointmentId)
- sbGetEHR(patientId) / sbSaveEHR({ patient_id, doctor_id, appointment_id, visit_date, diagnosis, notes, follow_up, clinic_id })
- sbGetAllAppointments() / sbGetTodayAppointments()
- sbGetPatients()
- db.from('doctors').update({ status }).eq('id', doctorId) — shift toggle

## Critical Rules
- Only ONE in_session patient per doctor at a time — disable Call Next if active entry exists
- EHR: diagnosis + notes required; follow_up nullable; Done button disabled until required fields filled
- On load: if in_session entry exists, restore Current Patient Panel
- Queue polling: setInterval 30s on Queue view only, stop on other views
- EHR save failure: show inline error, do NOT close panel or advance queue
- sbCheckProfileRole non-doctor: hard redirect to login, clear session
- 401 mid-session: redirect to login (EHR unsaved state lost — MVP acceptable)

## Edge Cases
- Empty queue → "No patients in queue", Call Next disabled
- sbCallNext returns null → toast "No patients waiting", button disabled
- No appointments today → "No appointments scheduled for today" empty state
- Shift toggled off → visual update only, no portal lock-out

Related: [[project-delosreyes-clinic]], [[project-patient-portal]]
