-- ============================================================
--  REQUIRED: Run this in Supabase Dashboard → SQL Editor
--  Fixes: patients cannot update their own profile
--  Adds: emergency_relationship column
-- ============================================================

-- 1. Allow patients to update their own record
CREATE POLICY "Patients update own record" ON patients
  FOR UPDATE USING (
    clinic_id = get_user_clinic_id() AND
    profile_id = auth.uid()
  );

-- 2. Add emergency_relationship column (safe to run even if already exists)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_relationship TEXT;

-- 3. Add medical_notes column for existing conditions / doctor notes
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- 4. Add photo_url column for patient profile photos
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
