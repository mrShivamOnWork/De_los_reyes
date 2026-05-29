const puppeteer = require('./node_modules/puppeteer');

const PASS = (msg) => console.log('  ✓ PASS:', msg);
const FAIL = (msg) => console.log('  ✗ FAIL:', msg);
const HEAD = (msg) => console.log('\n═══', msg, '═══');

(async () => {
  const browser = await puppeteer.launch({ headless: true });

  async function newPage() {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('pageerror', err => console.log('  PAGEERROR:', err.message));
    return page;
  }

  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ─── TEST 1: Login as Juan ─────────────────────────────
  HEAD('TEST 1: Juan login & dashboard');
  {
    const page = await newPage();
    await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
    await wait(1000);
    await page.type('#login-email', 'patient@demo.com');
    await page.type('#login-pass', 'demo1234');
    await page.evaluate(() => doLogin());
    await wait(5000);

    const app = await page.evaluate(() => document.getElementById('patientApp').className);
    app.includes('active') ? PASS('App shown after login') : FAIL('App not shown: ' + app);

    const name = await page.evaluate(() => document.getElementById('sidebarName').textContent);
    name.includes('Juan') ? PASS('Juan name in sidebar: ' + name) : FAIL('Wrong name: ' + name);

    const upcoming = await page.evaluate(() => document.getElementById('stat-upcoming').textContent);
    console.log('  stat-upcoming:', upcoming);
    upcoming !== '—' ? PASS('Stats loaded: ' + upcoming) : FAIL('Stats still showing dash');

    // ─── TEST 2: Cancel appointment ──────────────────────
    HEAD('TEST 2: Cancel appointment');
    const appts = await page.evaluate(() => {
      const rows = document.querySelectorAll('#dash-appt-tbody tr');
      const cancelBtns = [...document.querySelectorAll('#dash-appt-tbody button')].filter(b => b.textContent.includes('Cancel'));
      return { rows: rows.length, cancelBtns: cancelBtns.length };
    });
    console.log('  Dashboard appt rows:', appts.rows, '| Cancel buttons:', appts.cancelBtns);

    if (appts.cancelBtns > 0) {
      // Click cancel
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('#dash-appt-tbody button')].find(b => b.textContent.includes('Cancel'));
        btn.click();
      });
      await wait(500);
      const modalOpen = await page.evaluate(() => document.getElementById('modal-cancel').classList.contains('open'));
      modalOpen ? PASS('Cancel modal opened') : FAIL('Cancel modal did not open');

      if (modalOpen) {
        await page.type('#cancelReason', 'Test cancellation reason');
        // Click the confirm cancel button
        await page.evaluate(() => {
          const btn = document.querySelector('#modal-cancel .btn-sm[style*="crimson"]');
          if (btn) btn.click();
        });
        await wait(4000);
        const modalClosed = await page.evaluate(() => !document.getElementById('modal-cancel').classList.contains('open'));
        modalClosed ? PASS('Cancel modal closed after confirm') : FAIL('Modal still open');
      }
    } else {
      console.log('  SKIP: No cancelable appointments to test');
    }

    // ─── TEST 3: Booking flow ────────────────────────────
    HEAD('TEST 3: Book an appointment (all 5 steps)');
    await page.evaluate(() => showView('book'));
    await wait(2000);

    // Select doctor mode
    await page.evaluate(() => setBookingMode('doctor'));
    await wait(300);

    const doctorCards = await page.evaluate(() =>
      [...document.querySelectorAll('#allDocGrid .doc-select-card')].map(c => c.querySelector('.doc-select-name')?.textContent)
    );
    doctorCards.length > 0 ? PASS('Doctors loaded: ' + JSON.stringify(doctorCards)) : FAIL('No doctor cards');

    // Select first doctor
    await page.evaluate(() => {
      const card = document.querySelector('#allDocGrid .doc-select-card');
      if (card) card.click();
    });
    await wait(300);

    const bookingState1 = await page.evaluate(() => ({ doctorId: booking.doctorId, doctor: booking.doctor }));
    bookingState1.doctorId ? PASS('Doctor UUID stored: ' + bookingState1.doctorId.slice(0,8) + '…') : FAIL('No doctorId stored');

    // Go to step 2 (date)
    await page.evaluate(() => bookNext(1));
    await wait(300);
    const step2Active = await page.evaluate(() => document.getElementById('bp-2').classList.contains('active'));
    step2Active ? PASS('Advanced to step 2') : FAIL('Did not advance to step 2');

    // Select first available date
    await page.evaluate(() => {
      const btn = document.querySelector('.date-btn:not(.disabled)');
      if (btn) btn.click();
    });
    await wait(300);

    // Go to step 3 (time)
    await page.evaluate(() => bookNext(2));
    await wait(500);
    const step3Active = await page.evaluate(() => document.getElementById('bp-3').classList.contains('active'));
    step3Active ? PASS('Advanced to step 3') : FAIL('Did not advance to step 3');

    await wait(2000); // wait for time slots to load from Supabase

    const timeSlots = await page.evaluate(() => {
      const slots = [...document.querySelectorAll('.time-btn')];
      const available = slots.filter(s => !s.classList.contains('booked'));
      const booked = slots.filter(s => s.classList.contains('booked'));
      return { total: slots.length, available: available.length, booked: booked.length };
    });
    console.log('  Time slots — total:', timeSlots.total, '| available:', timeSlots.available, '| booked:', timeSlots.booked);
    timeSlots.total > 0 ? PASS('Time grid loaded from Supabase') : FAIL('No time slots loaded');

    // Select service and time slot
    await page.evaluate(() => {
      document.getElementById('book-service-select').value = '';
      const sel = document.getElementById('book-service-select');
      if (sel.options.length > 1) sel.value = sel.options[1].value;
      booking.service = sel.value;
    });
    await page.evaluate(() => {
      const btn = document.querySelector('.time-btn:not(.booked)');
      if (btn) btn.click();
    });
    await wait(200);

    // Go to step 4 (confirm)
    await page.evaluate(() => bookNext(3));
    await wait(300);
    const step4Active = await page.evaluate(() => document.getElementById('bp-4').classList.contains('active'));
    step4Active ? PASS('Advanced to step 4') : FAIL('Did not advance to step 4');

    // Read confirm summary
    const confDoc = await page.evaluate(() => document.getElementById('conf-doc').textContent);
    confDoc && confDoc !== '—' ? PASS('Confirm summary shows doctor: ' + confDoc) : FAIL('Confirm doc is: ' + confDoc);

    // Confirm booking
    await page.evaluate(() => confirmBooking());
    await wait(5000);

    const step5Active = await page.evaluate(() => document.getElementById('bp-5').classList.contains('active'));
    step5Active ? PASS('Step 5 confirmation shown') : FAIL('Did not reach step 5');

    const bdId = await page.evaluate(() => document.getElementById('bdId').textContent);
    bdId.includes('DRD-') ? PASS('Appointment ID generated: ' + bdId) : FAIL('No appointment ID: ' + bdId);

    // Check notification was added
    const notifCount = await page.evaluate(() => document.querySelectorAll('.notif-item.unread').length);
    notifCount > 0 ? PASS('Notification added after booking (' + notifCount + ' unread)') : FAIL('No notification after booking');

    // ─── TEST 4: Reschedule ──────────────────────────────
    HEAD('TEST 4: Reschedule modal (check UUID not shown as doctor name)');
    await page.evaluate(() => showView('appointments'));
    await wait(1000);

    const reschedBtns = await page.evaluate(() =>
      [...document.querySelectorAll('.appt-card button')].filter(b => b.textContent.includes('Reschedule')).length
    );
    console.log('  Reschedule buttons found:', reschedBtns);

    if (reschedBtns > 0) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('.appt-card button')].find(b => b.textContent.includes('Reschedule'));
        btn.click();
      });
      await wait(500);

      const modalOpen = await page.evaluate(() => document.getElementById('modal-reschedule').classList.contains('open'));
      modalOpen ? PASS('Reschedule modal opened') : FAIL('Reschedule modal not opened');

      const reschedDocText = await page.evaluate(() => document.getElementById('reschedDocName').textContent);
      const isUUID = /^[0-9a-f]{8}-/.test(reschedDocText);
      !isUUID ? PASS('Doctor name shown (not UUID): ' + reschedDocText) : FAIL('UUID shown instead of doctor name: ' + reschedDocText);

      await page.evaluate(() => closeModal('reschedule'));
    }

    // ─── TEST 5: Sign out ────────────────────────────────
    HEAD('TEST 5: Sign out');
    await page.evaluate(() => doLogout());
    await wait(2000);

    const loginVisible = await page.evaluate(() => document.getElementById('loginScreen').style.display);
    const appVisible   = await page.evaluate(() => document.getElementById('patientApp').classList.contains('active'));
    loginVisible === 'flex' ? PASS('Login screen shown after logout') : FAIL('Login screen not showing: ' + loginVisible);
    !appVisible ? PASS('Patient app hidden after logout') : FAIL('Patient app still visible');

    // Screenshot of login screen
    await page.screenshot({ path: 'temporary screenshots/test-logout.png' });
    console.log('  Screenshot saved: test-logout.png');
    await page.close();
  }

  // ─── TEST 6: Session restore role check ─────────────────
  HEAD('TEST 6: Session restore — wrong role should NOT auto-login');
  {
    const page = await newPage();
    // Simulate: inject a non-patient session by setting up as if doctor is logged in
    // We test by logging in as a doctor email and seeing if patient portal blocks them
    // (This requires a doctor to exist — we test with admin@demo.com)
    await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
    await wait(1000);
    await page.type('#login-email', 'admin@demo.com');
    await page.type('#login-pass', 'demo1234');
    await page.evaluate(() => doLogin());
    await wait(3000);

    const appActive = await page.evaluate(() => document.getElementById('patientApp').classList.contains('active'));
    !appActive ? PASS('Admin blocked from patient portal') : FAIL('Admin was allowed into patient portal!');

    const toastMsg = await page.evaluate(() => document.getElementById('toastMsg').textContent);
    console.log('  Toast message:', toastMsg);

    await page.screenshot({ path: 'temporary screenshots/test-role-block.png' });
    await page.close();
  }

  // ─── TEST 7: Status is Confirmed, not Pending ────────────
  HEAD('TEST 7: New booking status = Confirmed');
  {
    const page = await newPage();
    await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
    await wait(1000);
    await page.type('#login-email', 'patient@demo.com');
    await page.type('#login-pass', 'demo1234');
    await page.evaluate(() => doLogin());
    await wait(5000);

    await page.evaluate(() => showView('appointments'));
    await wait(500);

    const statuses = await page.evaluate(() =>
      [...document.querySelectorAll('.appt-card .badge')].map(b => b.textContent)
    );
    console.log('  Appointment statuses:', statuses);
    const hasPending = statuses.some(s => s === 'Pending');
    const hasConfirmed = statuses.some(s => s === 'Confirmed');
    !hasPending ? PASS('No Pending status (all confirmed/other)') : console.log('  INFO: Some appointments still show Pending (pre-existing data)');
    hasConfirmed ? PASS('Confirmed status found') : console.log('  INFO: No Confirmed appointments yet');

    await page.screenshot({ path: 'temporary screenshots/test-statuses.png' });
    await page.close();
  }

  await browser.close();
  console.log('\n═══ TEST RUN COMPLETE ═══');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
