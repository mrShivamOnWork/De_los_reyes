-- ============================================================
--  De Los Reyes Doctors — Full Database Reset
--  Run in: Supabase Dashboard → SQL Editor
--  WARNING: This deletes ALL doctors, patients, and related data.
--  The admin account (admin@delosreyes.com) is preserved.
-- ============================================================

-- Delete in FK order (child tables first)
DELETE FROM queue_entries;
DELETE FROM ehr_records;
DELETE FROM appointments;
DELETE FROM patients;
DELETE FROM doctors;

-- Remove non-admin profiles (patient + doctor auth users keep their login
-- but their profile rows are cleared so they can re-register cleanly)
DELETE FROM profiles WHERE role IN ('doctor', 'patient');

-- Reset any storage photos (optional — comment out to keep uploaded images)
-- DELETE FROM storage.objects WHERE bucket_id IN ('doctor-photos', 'patient-photos');
