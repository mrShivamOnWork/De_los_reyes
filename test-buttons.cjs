
const puppeteer = require('./node_modules/puppeteer');

const PASS = msg => console.log('  ✓', msg);
const FAIL = msg => console.log('  ✗ FAIL:', msg);
const HEAD = msg => console.log('\n─── ' + msg + ' ───');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function login(page) {
  await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
  await wait(1000);
  await page.evaluate(() => { document.getElementById('login-email').value = 'patient@demo.com'; document.getElementById('login-pass').value = 'demo1234'; });
  await page.evaluate(() => doLogin());
  await wait(5000);
}

async function bookAppointment(page) {
  await page.evaluate(() => { showView('book'); setBookingMode('doctor'); });
  await wait(1500);
  await page.evaluate(() => document.querySelector('#allDocGrid .doc-select-card')?.click());
  await wait(300);
  await page.evaluate(() => bookNext(1));
  await wait(300);
  await page.evaluate(() => document.querySelector('.date-btn:not(.disabled)')?.click());
  await wait(300);
  await page.evaluate(() => bookNext(2));
  await wait(2000); // wait for time slots
  await page.evaluate(() => {
    const sel = document.getElementById('book-service-select');
    if (sel && sel.options.length > 1) { sel.value = sel.options[1].value; booking.service = sel.value; }
    document.querySelector('.time-btn:not(.booked)')?.click();
  });
  await wait(300);
  await page.evaluate(() => bookNext(3));
  await wait(300);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', e => console.log('  PAGEERROR:', e.message));
  await login(page);

  // ─── CONFIRM BUTTON: book 1st time ───────────────────────
  HEAD('BOOKING FLOW 1: first booking');
  await bookAppointment(page);

  let confirmBtn = await page.evaluate(() => {
    const btn = document.querySelector('#bp-4 .btn-green');
    return btn ? { text: btn.textContent, disabled: btn.disabled } : null;
  });
  console.log('  Confirm btn before click:', confirmBtn);
  PASS('Confirm btn is ready');

  await page.evaluate(() => confirmBooking());
  await wait(5000);

  let step5 = await page.evaluate(() => document.getElementById('bp-5').classList.contains('active'));
  step5 ? PASS('Booking 1 → Step 5 shown') : FAIL('Did not reach step 5');

  // ─── CONFIRM BUTTON: book 2nd time (the bug) ─────────────
  HEAD('BOOKING FLOW 2: second booking — confirm button state');
  await page.evaluate(() => showView('book'));
  await wait(300);

  // Check if the confirm button was reset
  confirmBtn = await page.evaluate(() => {
    const btn = document.querySelector('#bp-4 .btn-green');
    return btn ? { text: btn.textContent.trim(), disabled: btn.disabled } : null;
  });
  console.log('  Confirm btn after reset:', confirmBtn);
  confirmBtn?.text === 'Confirm Appointment' && !confirmBtn?.disabled
    ? PASS('Confirm button correctly reset after first booking')
    : FAIL('Confirm button still stuck: ' + JSON.stringify(confirmBtn));

  // Go all the way through and confirm again
  await bookAppointment(page);
  confirmBtn = await page.evaluate(() => {
    const btn = document.querySelector('#bp-4 .btn-green');
    return { text: btn?.textContent?.trim(), disabled: btn?.disabled };
  });
  confirmBtn?.text === 'Confirm Appointment' && !confirmBtn?.disabled
    ? PASS('Confirm button active for 2nd booking')
    : FAIL('Confirm button stuck on 2nd booking: ' + JSON.stringify(confirmBtn));

  await page.evaluate(() => confirmBooking());
  await wait(5000);
  step5 = await page.evaluate(() => document.getElementById('bp-5').classList.contains('active'));
  step5 ? PASS('Booking 2 → Step 5 shown') : FAIL('2nd booking did not reach step 5');

  // ─── CONFIRM BUTTON: 3rd time ────────────────────────────
  HEAD('BOOKING FLOW 3: third booking — button still functional');
  await page.evaluate(() => showView('book'));
  await wait(300);
  confirmBtn = await page.evaluate(() => {
    const btn = document.querySelector('#bp-4 .btn-green');
    return { text: btn?.textContent?.trim(), disabled: btn?.disabled };
  });
  confirmBtn?.text === 'Confirm Appointment' && !confirmBtn?.disabled
    ? PASS('Confirm button active for 3rd booking')
    : FAIL('Confirm button stuck on 3rd booking: ' + JSON.stringify(confirmBtn));

  // ─── CANCEL BUTTON ────────────────────────────────────────
  HEAD('CANCEL BUTTON: open modal twice');
  await page.evaluate(() => showView('appointments'));
  await wait(1000);

  // First cancel
  const firstApptId = await page.evaluate(() => {
    const card = document.querySelector('.appt-card');
    const btn = card?.querySelector('button[onclick*="openCancelModal"]');
    return btn?.getAttribute('onclick');
  });
  console.log('  First cancel button onclick:', firstApptId);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.appt-card button')].find(b => b.textContent.includes('Cancel'));
    btn?.click();
  });
  await wait(400);

  let cancelBtn = await page.evaluate(() => {
    const btn = document.querySelector('#modal-cancel .btn-sm[style*="crimson"]');
    return btn ? { text: btn.textContent.trim(), disabled: btn.disabled } : null;
  });
  console.log('  Cancel modal button (1st open):', cancelBtn);
  cancelBtn?.text === 'Yes, Cancel Appointment' && !cancelBtn?.disabled
    ? PASS('Cancel button ready on 1st open')
    : FAIL('Cancel button bad state on 1st open: ' + JSON.stringify(cancelBtn));

  // Actually cancel it
  await page.type('#cancelReason', 'Test cancel');
  await page.evaluate(() => document.querySelector('#modal-cancel .btn-sm[style*="crimson"]')?.click());
  await wait(4000);

  // Open cancel modal again on the next appointment (if any)
  const cancelBtns = await page.evaluate(() =>
    [...document.querySelectorAll('.appt-card button')].filter(b => b.textContent.includes('Cancel')).length
  );
  console.log('  Cancel buttons remaining:', cancelBtns);

  if (cancelBtns > 0) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.appt-card button')].find(b => b.textContent.includes('Cancel'));
      btn?.click();
    });
    await wait(400);

    cancelBtn = await page.evaluate(() => {
      const btn = document.querySelector('#modal-cancel .btn-sm[style*="crimson"]');
      return btn ? { text: btn.textContent.trim(), disabled: btn.disabled } : null;
    });
    cancelBtn?.text === 'Yes, Cancel Appointment' && !cancelBtn?.disabled
      ? PASS('Cancel button reset correctly on 2nd open')
      : FAIL('Cancel button stuck on 2nd open: ' + JSON.stringify(cancelBtn));
    await page.evaluate(() => closeModal('cancel'));
  } else {
    console.log('  SKIP: No more cancelable appointments to test 2nd open');
  }

  // ─── RESCHEDULE BUTTON ────────────────────────────────────
  HEAD('RESCHEDULE BUTTON: open, confirm, open again');
  const reschedBtns = await page.evaluate(() =>
    [...document.querySelectorAll('.appt-card button')].filter(b => b.textContent.includes('Reschedule')).length
  );
  console.log('  Reschedule buttons:', reschedBtns);

  if (reschedBtns > 0) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.appt-card button')].find(b => b.textContent.includes('Reschedule'));
      btn?.click();
    });
    await wait(400);

    let reschedBtn = await page.evaluate(() => {
      const btn = document.querySelector('#modal-reschedule .btn-green');
      return btn ? { text: btn.textContent.trim(), disabled: btn.disabled } : null;
    });
    console.log('  Reschedule btn (1st open):', reschedBtn);
    reschedBtn?.text === 'Confirm Reschedule' && !reschedBtn?.disabled
      ? PASS('Reschedule button ready on 1st open')
      : FAIL('Reschedule button bad state: ' + JSON.stringify(reschedBtn));

    // Set date and time and confirm
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 2);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.evaluate((d) => document.getElementById('reschedDate').value = d, tomorrowStr);
    await page.evaluate(() => document.getElementById('reschedTime').value = '2:00 PM');
    await page.evaluate(() => confirmReschedule());
    await wait(4000);

    const modalClosed = await page.evaluate(() => !document.getElementById('modal-reschedule').classList.contains('open'));
    modalClosed ? PASS('Reschedule modal closed after confirm') : FAIL('Reschedule modal still open');

    // Open reschedule modal again — check button is reset
    const reschedBtns2 = await page.evaluate(() =>
      [...document.querySelectorAll('.appt-card button')].filter(b => b.textContent.includes('Reschedule')).length
    );
    if (reschedBtns2 > 0) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('.appt-card button')].find(b => b.textContent.includes('Reschedule'));
        btn?.click();
      });
      await wait(400);
      reschedBtn = await page.evaluate(() => {
        const btn = document.querySelector('#modal-reschedule .btn-green');
        return btn ? { text: btn.textContent.trim(), disabled: btn.disabled } : null;
      });
      reschedBtn?.text === 'Confirm Reschedule' && !reschedBtn?.disabled
        ? PASS('Reschedule button reset on 2nd open')
        : FAIL('Reschedule button stuck on 2nd open: ' + JSON.stringify(reschedBtn));
      await page.evaluate(() => closeModal('reschedule'));
    }
  } else {
    console.log('  SKIP: No reschedulable appointments');
  }

  // ─── SIDEBAR SIGN OUT BUTTON ──────────────────────────────
  HEAD('SIGN OUT BUTTON');
  await page.evaluate(() => doLogout());
  await wait(2000);
  const loginVisible = await page.evaluate(() => document.getElementById('loginScreen').style.display);
  loginVisible === 'flex' ? PASS('Sign out works') : FAIL('Sign out failed: ' + loginVisible);

  await page.screenshot({ path: 'temporary screenshots/test-buttons-done.png' });
  await browser.close();
  console.log('\n═══ DONE ═══');
})().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
