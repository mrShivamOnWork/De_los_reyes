// Supabase client — shared across all portals
const SUPABASE_URL  = 'https://iaeedidkgidzbxgabisu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZWVkaWRrZ2lkemJ4Z2FiaXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mzg0NjIsImV4cCI6MjA5NTUxNDQ2Mn0.ixbTfPGZhZwT7KhYdE0ow8k7dndGmpsAxme_DvzRQEo';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── AUTH HELPERS ────────────────────────────────────────────

async function sbLogin(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function sbLogout() {
  await db.auth.signOut();
}

async function sbGetUser() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db
    .from('profiles')
    .select('*, clinics(*)')
    .eq('id', user.id)
    .single();
  return { ...user, profile };
}

async function sbRegisterPatient({ email, password, firstName, lastName, dob, sex, contact, address, emergencyName, emergencyContact, bloodType, allergies }) {
  const CLINIC_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

  const { data, error } = await db.auth.signUp({
    email, password,
    options: { data: { role: 'patient', first_name: firstName, last_name: lastName } }
  });
  if (error) throw error;

  // Must set clinic_id on the profile BEFORE inserting patient row,
  // otherwise RLS on patients (clinic_id = get_user_clinic_id()) will block the insert.
  const { error: profErr } = await db.from('profiles').update({
    clinic_id:  CLINIC_ID,
    role:       'patient',
    first_name: firstName,
    last_name:  lastName,
  }).eq('id', data.user.id);
  if (profErr) throw profErr;

  const { error: patErr } = await db.from('patients').insert({
    profile_id:        data.user.id,
    clinic_id:         CLINIC_ID,
    first_name:        firstName,
    last_name:         lastName,
    dob, sex, contact, address, blood_type: bloodType, allergies,
    emergency_name:    emergencyName,
    emergency_contact: emergencyContact,
  });
  if (patErr) throw patErr;

  return data;
}

// ── DATA HELPERS ────────────────────────────────────────────

async function sbGetDoctors() {
  const { data, error } = await db.from('doctors').select('*').eq('status', 'active');
  if (error) throw error;
  return data;
}

async function sbGetAllDoctors() {
  const { data, error } = await db.from('doctors').select('*').order('last_name');
  if (error) throw error;
  return data;
}

async function sbGetMyAppointments(patientProfileId) {
  const { data: patient } = await db
    .from('patients').select('id').eq('profile_id', patientProfileId).single();
  if (!patient) return [];
  const { data, error } = await db
    .from('appointments')
    .select('*, doctors(*), patients(*)')
    .eq('patient_id', patient.id)
    .order('date', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbBookAppointment({ patientProfileId, doctorId, date, time, purpose, paymentMethod }) {
  const { data: patient, error: patErr } = await db
    .from('patients').select('id').eq('profile_id', patientProfileId).single();
  if (patErr || !patient) throw new Error('Patient record not found. Please contact the clinic.');
  const { data, error } = await db.from('appointments').insert({
    clinic_id:      'a1b2c3d4-0000-0000-0000-000000000001',
    patient_id:     patient.id,
    doctor_id:      doctorId,
    date, time, purpose,
    payment_method: paymentMethod,
    status:         'Confirmed',
  }).select().single();
  if (error) throw error;
  return data;
}

async function sbCancelAppointment(appointmentId, reason) {
  const { error } = await db
    .from('appointments')
    .update({ status: 'Cancelled', notes: reason })
    .eq('id', appointmentId);
  if (error) throw error;
}

async function sbRescheduleAppointment(appointmentId, date, time) {
  const { error } = await db
    .from('appointments')
    .update({ date, time, status: 'Confirmed' })
    .eq('id', appointmentId);
  if (error) throw error;
}

async function sbGetAllAppointments() {
  const { data, error } = await db
    .from('appointments')
    .select('*, doctors(*), patients(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

async function sbUpdateAppointmentStatus(id, status) {
  const { error } = await db.from('appointments').update({ status }).eq('id', id);
  if (error) throw error;
}

async function sbGetQueue(doctorId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from('queue_entries')
    .select('*, patients(*), appointments(*)')
    .eq('doctor_id', doctorId)
    .eq('queue_date', today)
    .order('queue_number', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbAdvanceQueue(queueEntryId) {
  await db.from('queue_entries').update({ status: 'completed' }).eq('id', queueEntryId);
}

async function sbMarkNoShow(queueEntryId, appointmentId) {
  await db.from('queue_entries').update({ status: 'no_show' }).eq('id', queueEntryId);
  await db.from('appointments').update({ status: 'No-Show' }).eq('id', appointmentId);
}

async function sbGetEHR(patientId) {
  const { data, error } = await db
    .from('ehr_records')
    .select('*, doctors(*)')
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false });
  if (error) throw error;
  return data;
}

async function sbSaveEHR(record) {
  // Try to find existing record for this appointment first
  const { data: existing } = await db
    .from('ehr_records')
    .select('id')
    .eq('appointment_id', record.appointment_id)
    .maybeSingle();
  let result, error;
  if (existing?.id) {
    ({ data: result, error } = await db
      .from('ehr_records').update(record).eq('id', existing.id).select().single());
  } else {
    ({ data: result, error } = await db
      .from('ehr_records').insert(record).select().single());
  }
  if (error) throw error;
  return result;
}

async function sbGetPatients() {
  const { data, error } = await db.from('patients').select('*').order('last_name');
  if (error) throw error;
  return data;
}

async function sbGetMyPatientRecord(profileId) {
  const { data } = await db.from('patients').select('*').eq('profile_id', profileId).maybeSingle();
  return data || null;
}

async function sbUpdatePatient(patientId, updates) {
  const { error } = await db.from('patients').update(updates).eq('id', patientId);
  if (error) throw error;
}

async function sbGetBookedTimes(doctorId, dateStr) {
  const { data } = await db
    .from('appointments')
    .select('time')
    .eq('doctor_id', doctorId)
    .eq('date', dateStr)
    .in('status', ['Confirmed', 'Pending']);
  return (data || []).map(a => a.time);
}

async function sbCheckProfileRole(userId) {
  const { data } = await db.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role || null;
}

async function sbUpdatePassword(newPassword) {
  const { error } = await db.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

async function sbUploadPhoto(bucket, filePath, file) {
  const { error } = await db.storage.from(bucket).upload(filePath, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = db.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl + '?t=' + Date.now();
}

async function sbCreateDoctor({ firstName, lastName, specialty, prcLicense, workDays, workHours, status }) {
  const CLINIC_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
  const { data, error } = await db.from('doctors').insert({
    clinic_id:   CLINIC_ID,
    first_name:  firstName,
    last_name:   lastName,
    specialty,
    prc_license: prcLicense,
    work_days:   workDays,
    work_hours:  workHours,
    status:      status || 'active',
  }).select().single();
  if (error) throw error;
  return data;
}

async function sbUpdateDoctor(id, updates) {
  const { error } = await db.from('doctors').update(updates).eq('id', id);
  if (error) throw error;
}

async function sbDeleteDoctor(id) {
  const { error } = await db.from('doctors').delete().eq('id', id);
  if (error) throw error;
}

// ── CHECK-IN + WALK-IN ──────────────────────────────────────

async function sbCheckInPatient(appointmentId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: appt, error: apptErr } = await db
    .from('appointments').select('*').eq('id', appointmentId).single();
  if (apptErr) throw apptErr;
  const { data: existing } = await db
    .from('queue_entries').select('queue_number')
    .eq('doctor_id', appt.doctor_id).eq('queue_date', today)
    .order('queue_number', { ascending: false }).limit(1);
  const nextNum = existing?.length ? (existing[0].queue_number + 1) : 1;
  const { data: qEntry, error: qErr } = await db.from('queue_entries').insert({
    clinic_id:        appt.clinic_id,
    appointment_id:   appointmentId,
    doctor_id:        appt.doctor_id,
    patient_id:       appt.patient_id,
    queue_date:       today,
    queue_number:     nextNum,
    status:           'waiting',
    appointment_type: appt.appointment_type || 'booked',
  }).select().single();
  if (qErr) throw qErr;
  await db.from('appointments')
    .update({ status: 'Checked In', checked_in_at: new Date().toISOString() })
    .eq('id', appointmentId);
  return { qEntry, queueNumber: nextNum };
}

async function sbAddWalkIn({ patientId, doctorId, purpose }) {
  const CLINIC_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
  const today = new Date().toISOString().slice(0, 10);
  const now   = new Date();
  const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  const { data: appt, error: apptErr } = await db.from('appointments').insert({
    clinic_id: CLINIC_ID, patient_id: patientId, doctor_id: doctorId,
    date: today, time: timeStr,
    purpose: purpose || 'Walk-in visit',
    appointment_type: 'walk_in', status: 'Confirmed',
    checked_in_at: now.toISOString(),
  }).select().single();
  if (apptErr) throw apptErr;
  const { data: existing } = await db
    .from('queue_entries').select('queue_number')
    .eq('doctor_id', doctorId).eq('queue_date', today)
    .order('queue_number', { ascending: false }).limit(1);
  const nextNum = existing?.length ? (existing[0].queue_number + 1) : 1;
  const { data: qEntry, error: qErr } = await db.from('queue_entries').insert({
    clinic_id:        CLINIC_ID,
    appointment_id:   appt.id,
    doctor_id:        doctorId,
    patient_id:       patientId,
    queue_date:       today,
    queue_number:     nextNum,
    status:           'waiting',
    appointment_type: 'walk_in',
  }).select().single();
  if (qErr) throw qErr;
  return { appt, qEntry, queueNumber: nextNum };
}

async function sbGetTodayAppointments() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from('appointments')
    .select('*, doctors(*), patients(*)')
    .eq('date', today)
    .in('status', ['Confirmed', 'Pending', 'Checked In', 'In Session'])
    .order('time', { ascending: true });
  if (error) throw error;
  return data;
}

async function sbCallNext(doctorId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: inSession } = await db.from('queue_entries')
    .select('id, appointment_id')
    .eq('doctor_id', doctorId).eq('queue_date', today).eq('status', 'in_session');
  for (const e of (inSession || [])) {
    await db.from('queue_entries').update({ status: 'completed' }).eq('id', e.id);
    await db.from('appointments').update({ status: 'Completed' }).eq('id', e.appointment_id);
  }
  const { data: next } = await db.from('queue_entries')
    .select('*, patients(*), appointments(*)')
    .eq('doctor_id', doctorId).eq('queue_date', today).eq('status', 'waiting')
    .order('queue_number', { ascending: true }).limit(1);
  if (!next?.length) return null;
  await db.from('queue_entries').update({ status: 'in_session' }).eq('id', next[0].id);
  await db.from('appointments').update({ status: 'In Session' }).eq('id', next[0].appointment_id);
  return next[0];
}
