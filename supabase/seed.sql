-- ============================================================
--  De Los Reyes Doctors — Seed Data
--  Run AFTER: schema.sql AND after creating the 3 demo users
--  in Supabase Dashboard → Authentication → Users
--
--  Demo accounts to create in Auth dashboard:
--    patient@demo.com   / demo1234    (role: patient)
--    santos@delosreyes.com / doctor1234 (role: doctor)
--    admin@delosreyes.com  / admin1234  (role: admin)
-- ============================================================

-- ── 1. Insert the clinic ───────────────────────────────────
INSERT INTO clinics (id, name, address, contact, email)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'De Los Reyes Doctors Clinic',
  '123 Rizal Street, Quezon City, Metro Manila',
  '(02) 8123-4567',
  'info@delosreyes.com'
);

-- ── 2. Assign clinic to the demo profiles ──────────────────
-- (profiles were auto-created by the trigger when you signed up)
-- Replace the UUIDs below with the actual user IDs from:
-- Supabase Dashboard → Authentication → Users → copy the UUID

UPDATE profiles SET
  clinic_id  = 'a1b2c3d4-0000-0000-0000-000000000001',
  role       = 'patient',
  first_name = 'Juan',
  last_name  = 'dela Cruz'
WHERE id = (SELECT id FROM auth.users WHERE email = 'patient@demo.com');

UPDATE profiles SET
  clinic_id  = 'a1b2c3d4-0000-0000-0000-000000000001',
  role       = 'doctor',
  first_name = 'Maria',
  last_name  = 'Santos'
WHERE id = (SELECT id FROM auth.users WHERE email = 'santos@delosreyes.com');

UPDATE profiles SET
  clinic_id  = 'a1b2c3d4-0000-0000-0000-000000000001',
  role       = 'admin',
  first_name = 'Clinic',
  last_name  = 'Admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@delosreyes.com');

-- ── 3. Insert doctors ──────────────────────────────────────
INSERT INTO doctors (id, clinic_id, profile_id, first_name, last_name, specialty, prc_license, work_days, work_hours, photo_url, status)
VALUES
  (
    'd0c00000-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    (SELECT id FROM auth.users WHERE email = 'santos@delosreyes.com'),
    'Maria', 'Santos',
    'Internal Medicine', 'PH-MD-00482',
    'Mon–Fri', '9:00 AM – 5:00 PM',
    'doctors/images.jpg', 'active'
  ),
  (
    'd0c00000-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000001',
    NULL,
    'Juan', 'dela Cruz',
    'Pediatrics', 'PH-MD-00291',
    'Mon, Wed, Fri', '8:00 AM – 4:00 PM',
    'doctors/Medical-Doctor-Jobs-in-South-Africa.jpeg', 'active'
  ),
  (
    'd0c00000-0000-0000-0000-000000000003',
    'a1b2c3d4-0000-0000-0000-000000000001',
    NULL,
    'Ana', 'Reyes',
    'OB-Gynecology', 'PH-MD-00378',
    'Tue, Thu, Sat', '9:00 AM – 3:00 PM',
    'doctors/doctor-reyes.jpg', 'active'
  );

-- ── 4. Insert demo patients ────────────────────────────────
INSERT INTO patients (id, clinic_id, profile_id, first_name, last_name, dob, sex, blood_type, contact, allergies)
VALUES
  (
    'fa000000-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    (SELECT id FROM auth.users WHERE email = 'patient@demo.com'),
    'Juan', 'dela Cruz',
    '1990-03-15', 'Male', 'O+',
    '0917-123-4567', 'None known'
  ),
  (
    'fa000000-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000001',
    NULL, 'Ana', 'Rivera',
    '1981-03-12', 'Female', 'A+',
    '0917-111-2222', 'Penicillin'
  ),
  (
    'fa000000-0000-0000-0000-000000000003',
    'a1b2c3d4-0000-0000-0000-000000000001',
    NULL, 'Ben', 'Marcos',
    '1968-08-05', 'Male', 'B+',
    '0918-333-4444', 'None known'
  ),
  (
    'fa000000-0000-0000-0000-000000000004',
    'a1b2c3d4-0000-0000-0000-000000000001',
    NULL, 'Eva', 'Gomez',
    '1996-06-07', 'Female', 'AB+',
    '0917-222-3333', 'Sulfa drugs'
  ),
  (
    'fa000000-0000-0000-0000-000000000005',
    'a1b2c3d4-0000-0000-0000-000000000001',
    NULL, 'Felix', 'Uy',
    '1992-01-18', 'Male', 'O-',
    '0920-777-8888', 'None known'
  );

-- ── 5. Insert demo appointments ────────────────────────────
INSERT INTO appointments (clinic_id, patient_id, doctor_id, date, time, purpose, status, queue_number)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001', 'd0c00000-0000-0000-0000-000000000001', CURRENT_DATE + 7,  '10:00 AM', 'Follow-up: Hypertension',        'Confirmed',   1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000002', 'd0c00000-0000-0000-0000-000000000001', CURRENT_DATE,      '10:30 AM', 'Hypertension follow-up',         'In Session',  3),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000003', 'd0c00000-0000-0000-0000-000000000001', CURRENT_DATE,      '11:00 AM', 'Chest pain evaluation',          'Confirmed',   4),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000004', 'd0c00000-0000-0000-0000-000000000003', CURRENT_DATE,      '10:00 AM', 'Prenatal check-up (28 weeks)',    'Completed',   1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000005', 'd0c00000-0000-0000-0000-000000000002', CURRENT_DATE,      '9:30 AM',  'Pediatric vaccination',          'Completed',   2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000002', 'd0c00000-0000-0000-0000-000000000003', CURRENT_DATE,      '1:00 PM',  'Annual check-up',                'Cancelled',   NULL);

-- ── 6. Insert demo EHR records ─────────────────────────────
INSERT INTO ehr_records (clinic_id, patient_id, doctor_id, visit_date, chief_complaint, vitals, diagnosis, subjective, assessment, plan)
VALUES
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'fa000000-0000-0000-0000-000000000001',
    'd0c00000-0000-0000-0000-000000000001',
    CURRENT_DATE - 30,
    'High blood pressure readings at home',
    '{"sys":148,"dia":92,"hr":82,"temp":36.6,"weight":72,"height":168}',
    'Hypertension Stage 1',
    'Patient reports BP readings consistently above 140/90 at home.',
    'Hypertension Stage 1 — medication adjustment needed.',
    'Increase Amlodipine to 10mg. Follow up in 4 weeks. Low sodium diet.'
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'fa000000-0000-0000-0000-000000000001',
    'd0c00000-0000-0000-0000-000000000001',
    CURRENT_DATE - 90,
    'Annual check-up',
    '{"sys":135,"dia":88,"hr":78,"temp":36.5,"weight":73,"height":168}',
    'Hypertension — controlled',
    'Patient doing well on current medication.',
    'BP slightly elevated but within acceptable range.',
    'Continue Amlodipine 5mg. Repeat labs in 3 months.'
  );
