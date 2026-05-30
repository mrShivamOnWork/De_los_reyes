-- ============================================================
--  Run this in Supabase Dashboard → SQL Editor
--  Adds: billing / payment columns to appointments
-- ============================================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status  TEXT    DEFAULT 'unpaid'  CHECK (payment_status IN ('unpaid','partial','paid','waived','insurance'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2) DEFAULT 500.00;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_paid       NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS paid_at          TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_notes    TEXT;

-- RLS: allow clinic members to update payment status
DROP POLICY IF EXISTS "Clinic update payment" ON appointments;
CREATE POLICY "Clinic update payment" ON appointments
  FOR UPDATE USING (clinic_id = get_user_clinic_id());
