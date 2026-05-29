-- ============================================================
--  Run this in Supabase Dashboard → SQL Editor
--  Adds: check-in system, queue statuses, EHR columns, doctor bio
-- ============================================================

-- 0. Doctor bio (for Meet our Specialists card)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio TEXT;

-- 1. Appointment type + check-in timestamp
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'booked';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- 2. Queue entry appointment type
ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'booked';

-- 3. Doctor profile link (for doctor portal auth)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. EHR record columns
ALTER TABLE ehr_records ADD COLUMN IF NOT EXISTS visit_date DATE;
ALTER TABLE ehr_records ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE ehr_records ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE ehr_records ADD COLUMN IF NOT EXISTS prescription TEXT;
ALTER TABLE ehr_records ADD COLUMN IF NOT EXISTS treatment_plan TEXT;
ALTER TABLE ehr_records ADD COLUMN IF NOT EXISTS follow_up TEXT;
ALTER TABLE ehr_records ADD COLUMN IF NOT EXISTS vitals JSONB;

-- 5. Normalize old 'done' queue status → 'completed'
UPDATE queue_entries SET status = 'completed' WHERE status = 'done';

-- 6. RLS: allow authenticated users to insert queue entries (admin check-in)
DROP POLICY IF EXISTS "Authenticated insert queue_entries" ON queue_entries;
CREATE POLICY "Authenticated insert queue_entries" ON queue_entries
  FOR INSERT WITH CHECK (clinic_id = get_user_clinic_id());

-- 7. RLS: allow authenticated users to update queue entries
DROP POLICY IF EXISTS "Authenticated update queue_entries" ON queue_entries;
CREATE POLICY "Authenticated update queue_entries" ON queue_entries
  FOR UPDATE USING (clinic_id = get_user_clinic_id());

-- 8. RLS: allow read on queue_entries for clinic members
DROP POLICY IF EXISTS "Clinic members read queue_entries" ON queue_entries;
CREATE POLICY "Clinic members read queue_entries" ON queue_entries
  FOR SELECT USING (clinic_id = get_user_clinic_id());
