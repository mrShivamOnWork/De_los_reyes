# Business Rules — De Los Reyes Doctors

## User Roles

| Role | Auth Level | Capabilities |
|------|-----------|-------------|
| `patient` | Supabase auth + profiles table | Book, cancel, reschedule appointments; view own EHR; view queue position |
| `doctor` | Supabase auth + doctors table | View own queue; call next patient; write EHR; toggle shift availability |
| `admin` | Supabase auth + profiles table | All clinic operations; walk-in booking; patient check-in; billing; doctor management |

## Appointment Rules

- Patients may cancel or reschedule up to **2 hours before** the appointment time.
- Appointments start with status `Confirmed` (online booking) or `Confirmed` + immediate queue entry (walk-in).
- A booked appointment does **not** enter the live queue until the admin physically checks in the patient.
- Appointment statuses: `Pending` → `Confirmed` → `Checked In` → `In Session` → `Completed` | `Cancelled` | `No-Show`

## Queue Rules

- Each doctor has their own independent queue.
- Queue numbers reset daily per doctor (start from 1 each day).
- Only **one** patient per doctor can be `in_session` at a time.
- Walk-ins create an appointment record first, then immediately join the queue.
- Queue statuses: `waiting` → `in_session` → `completed` | `no_show` | `skipped`
- Doctor clicking "Call Next" automatically moves the current `in_session` patient to `completed` and the next `waiting` patient to `in_session`.

## Check-In Rules

- Admin = Receptionist in this MVP.
- Only admin can check in a patient (moves appointment from `Confirmed` to `Checked In` and creates queue entry).
- Walk-in patients are checked in automatically at walk-in creation.

## EHR Rules

- Only doctors and admins may write EHR records.
- Patients may only read their own EHR.
- EHR records are scoped to appointment (one record per appointment).
- When doctor saves EHR, appointment auto-completes to `Completed` and queue entry to `completed`.

## Billing Rules

- Billing is a simple fee ledger — not a full accounting system.
- Each billing entry records: patient, service, fee, paid/unpaid status, date, notes.
- Admin can toggle payment status (paid / unpaid).
- No invoice generation required for MVP.
- **Current status:** `billing_entries` table referenced in admin portal but not yet created in Supabase. See backlog.

## Validation Rules

- Cancel/reschedule cutoff: 2 hours before scheduled time
- Appointment booking requires: doctor selection, date, time, service/purpose
- Walk-in requires: patient selection (existing or new), doctor, service
- EHR save requires: diagnosis field minimum

## Data Scoping (Multi-Tenant Ready)

- All tables include a `clinic_id` column.
- All RLS policies filter by `get_user_clinic_id()`.
- Currently only one clinic exists: `a1b2c3d4-0000-0000-0000-000000000001`.
- `supabase-client.js` has this CLINIC_ID hardcoded — acceptable for single-clinic MVP.

## Security Rules

- All Supabase data rendered into HTML must pass through `esc()` (XSS protection).
- No secrets or private keys in frontend code — only Supabase anon key (expected pattern).
- Supabase RLS must be enabled and verified on ALL tables before public traffic.
- Anon role should only be able to read `active` doctors (public landing page).
