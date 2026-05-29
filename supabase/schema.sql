-- ============================================================
--  De Los Reyes Doctors — Supabase Schema
--  Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── CLINICS ────────────────────────────────────────────────
CREATE TABLE clinics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  contact     TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROFILES (extends Supabase auth.users) ─────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id   UUID REFERENCES clinics(id),
  role        TEXT NOT NULL CHECK (role IN ('patient','doctor','admin')),
  first_name  TEXT,
  last_name   TEXT,
  contact     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PATIENTS ───────────────────────────────────────────────
CREATE TABLE patients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  clinic_id          UUID REFERENCES clinics(id),
  first_name         TEXT NOT NULL,
  last_name          TEXT NOT NULL,
  dob                DATE,
  sex                TEXT,
  blood_type         TEXT,
  philhealth_id      TEXT,
  address            TEXT,
  contact            TEXT,
  emergency_name     TEXT,
  emergency_contact  TEXT,
  allergies          TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── DOCTORS ────────────────────────────────────────────────
CREATE TABLE doctors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  clinic_id    UUID REFERENCES clinics(id),
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  specialty    TEXT,
  prc_license  TEXT,
  work_days    TEXT,
  work_hours   TEXT,
  photo_url    TEXT,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','unavailable','on_leave')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPOINTMENTS ───────────────────────────────────────────
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID REFERENCES clinics(id),
  patient_id      UUID REFERENCES patients(id),
  doctor_id       UUID REFERENCES doctors(id),
  date            DATE NOT NULL,
  time            TEXT NOT NULL,
  purpose         TEXT,
  status          TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Completed','Cancelled','No-Show','In Session')),
  queue_number    INTEGER,
  payment_method  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── EHR RECORDS ────────────────────────────────────────────
CREATE TABLE ehr_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID REFERENCES clinics(id),
  patient_id      UUID REFERENCES patients(id),
  doctor_id       UUID REFERENCES doctors(id),
  appointment_id  UUID REFERENCES appointments(id),
  visit_date      DATE,
  chief_complaint TEXT,
  vitals          JSONB,   -- {sys, dia, hr, temp, weight, height}
  subjective      TEXT,
  objective       TEXT,
  assessment      TEXT,
  plan            TEXT,
  diagnosis       TEXT,
  prescriptions   JSONB,   -- [{drug, dose, frequency, duration}]
  lab_results     JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUEUE ENTRIES ──────────────────────────────────────────
CREATE TABLE queue_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID REFERENCES clinics(id),
  doctor_id       UUID REFERENCES doctors(id),
  appointment_id  UUID REFERENCES appointments(id),
  patient_id      UUID REFERENCES patients(id),
  queue_number    INTEGER,
  status          TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','in_session','done','no_show','skipped')),
  queue_date      DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
--  ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE clinics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ehr_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries  ENABLE ROW LEVEL SECURITY;

-- ── Clinics ────────────────────────────────────────────────
CREATE POLICY "Users see own clinic" ON clinics
  FOR SELECT USING (id = get_user_clinic_id());

-- ── Profiles ───────────────────────────────────────────────
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles in clinic" ON profiles
  FOR SELECT USING (
    clinic_id = get_user_clinic_id() AND get_user_role() = 'admin'
  );

-- ── Patients ───────────────────────────────────────────────
CREATE POLICY "Patients read own record" ON patients
  FOR SELECT USING (
    clinic_id = get_user_clinic_id() AND (
      profile_id = auth.uid() OR
      get_user_role() IN ('doctor','admin')
    )
  );

CREATE POLICY "Patients insert own record" ON patients
  FOR INSERT WITH CHECK (
    clinic_id = get_user_clinic_id()
  );

CREATE POLICY "Doctors and admins update patients" ON patients
  FOR UPDATE USING (
    clinic_id = get_user_clinic_id() AND
    get_user_role() IN ('doctor','admin')
  );

-- ── Doctors ────────────────────────────────────────────────
CREATE POLICY "All clinic users see doctors" ON doctors
  FOR SELECT USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Admins manage doctors" ON doctors
  FOR ALL USING (
    clinic_id = get_user_clinic_id() AND get_user_role() = 'admin'
  );

-- ── Appointments ───────────────────────────────────────────
CREATE POLICY "Patients see own appointments" ON appointments
  FOR SELECT USING (
    clinic_id = get_user_clinic_id() AND (
      get_user_role() IN ('doctor','admin') OR
      patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Create appointments" ON appointments
  FOR INSERT WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Update appointments" ON appointments
  FOR UPDATE USING (clinic_id = get_user_clinic_id());

-- ── EHR Records ────────────────────────────────────────────
CREATE POLICY "Patients see own EHR" ON ehr_records
  FOR SELECT USING (
    clinic_id = get_user_clinic_id() AND (
      get_user_role() IN ('doctor','admin') OR
      patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Doctors write EHR" ON ehr_records
  FOR INSERT WITH CHECK (
    clinic_id = get_user_clinic_id() AND
    get_user_role() IN ('doctor','admin')
  );

CREATE POLICY "Doctors update EHR" ON ehr_records
  FOR UPDATE USING (
    clinic_id = get_user_clinic_id() AND
    get_user_role() IN ('doctor','admin')
  );

-- ── Queue Entries ──────────────────────────────────────────
CREATE POLICY "Doctors and admins manage queue" ON queue_entries
  FOR ALL USING (
    clinic_id = get_user_clinic_id() AND
    get_user_role() IN ('doctor','admin')
  );

CREATE POLICY "Patients see own queue entry" ON queue_entries
  FOR SELECT USING (
    clinic_id = get_user_clinic_id() AND
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );
