-- ============================================================
--  Run this in Supabase Dashboard → SQL Editor
--  Fixes: status check constraints for appointments + queue_entries
-- ============================================================

-- 1. Add 'Checked In' to appointments status constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('Pending','Confirmed','Completed','Cancelled','No-Show','In Session','Checked In'));

-- 2. Add 'completed' to queue_entries status constraint (keep 'done' for backwards compat)
ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_status_check;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_check
  CHECK (status IN ('waiting','in_session','completed','done','no_show','skipped'));

-- 3. Normalize any old 'done' entries to 'completed'
UPDATE queue_entries SET status = 'completed' WHERE status = 'done';

-- 4. Add unique index on ehr_records.appointment_id (required for upsert ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS ehr_records_appointment_id_key ON ehr_records (appointment_id);

-- 5. Add unique index on ehr_records (patient_id, visit_date) as fallback conflict target
CREATE UNIQUE INDEX IF NOT EXISTS ehr_records_patient_visit_key ON ehr_records (patient_id, visit_date);
