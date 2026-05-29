const puppeteer = require('./node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const logs = [];
  page.on('console', msg => {
    const t = msg.text();
    if (!t.includes('[DOM]') && !t.includes('Password field')) logs.push(msg.type() + ': ' + t);
  });

  // Login as Juan
  await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.type('#login-email', 'patient@demo.com');
  await page.type('#login-pass', 'demo1234');
  await page.evaluate(() => doLogin());
  await new Promise(r => setTimeout(r, 7000));

  // Check initial state
  const before = await page.evaluate(() => ({
    statUpcoming: document.getElementById('stat-upcoming').textContent,
    sidebarName: document.getElementById('sidebarName').textContent,
  }));
  console.log('Before booking:', JSON.stringify(before));

  // Navigate to book view
  await page.evaluate(() => showView('book'));
  await new Promise(r => setTimeout(r, 2000));

  // Check that doctors loaded dynamically
  const doctorCards = await page.evaluate(() => {
    return [...document.querySelectorAll('#allDocGrid .doc-select-card')].map(c => c.querySelector('.doc-select-name')?.textContent);
  });
  console.log('Doctor cards loaded:', doctorCards);

  await page.screenshot({ path: 'temporary screenshots/book-step1.png' });

  // Select first doctor (Dr. Maria Santos)
  const firstCard = await page.$('#allDocGrid .doc-select-card');
  if (!firstCard) { console.log('ERROR: No doctor cards found'); await browser.close(); return; }

  // Switch to doctor mode first
  await page.evaluate(() => setBookingMode('doctor'));
  await new Promise(r => setTimeout(r, 300));

  const doctorCard = await page.$('#allDocGrid .doc-select-card');
  await doctorCard.click();
  await new Promise(r => setTimeout(r, 300));

  const bookingState = await page.evaluate(() => ({
    doctorId: booking.doctorId,
    doctor: booking.doctor,
    specialty: booking.specialty
  }));
  console.log('Booking state after doctor select:', JSON.stringify(bookingState));

  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
