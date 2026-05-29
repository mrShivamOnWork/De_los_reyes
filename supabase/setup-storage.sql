-- ============================================================
--  De Los Reyes Doctors — Storage Buckets Setup
--  Run ONCE in: Supabase Dashboard → SQL Editor
--  Creates public buckets for doctor and patient profile photos.
-- ============================================================

-- Create buckets (public = anyone can view the URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('doctor-photos',  'doctor-photos',  true),
  ('patient-photos', 'patient-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on both buckets
CREATE POLICY "Public read doctor photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'doctor-photos');

CREATE POLICY "Public read patient photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-photos');

-- Allow authenticated users to upload/update/delete in these buckets
CREATE POLICY "Auth users upload doctor photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'doctor-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users update doctor photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'doctor-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users upload patient photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users update patient photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'patient-photos' AND auth.role() = 'authenticated');
