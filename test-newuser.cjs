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
  page.on('pageerror', err => logs.push('PAGEERROR: ' + err.message));

  await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => showRegister());
  await new Promise(r => setTimeout(r, 500));

  await page.type('#r-fname', 'New');
  await page.type('#r-lname', 'Patient');
  await page.type('#r-email', 'newpatient_test3@yopmail.com');
  await page.type('#r-pass', 'testpass123');
  await page.type('#r-pass2', 'testpass123');

  await page.evaluate(() => doRegister());
  await new Promise(r => setTimeout(r, 8000));

  console.log('=== LOGS ===');
  logs.forEach(l => console.log(l));

  const state = await page.evaluate(() => ({
    patientApp: document.getElementById('patientApp').className,
    welcomeTitle: document.getElementById('welcomeTitle').textContent,
    welcomeSub: document.getElementById('welcomeSub') ? document.getElementById('welcomeSub').textContent : 'N/A',
    statUpcoming: document.getElementById('stat-upcoming').textContent,
    statCompleted: document.getElementById('stat-completed').textContent,
    statRecords: document.getElementById('stat-records').textContent,
    dashApptRows: document.getElementById('dash-appt-tbody') ? document.getElementById('dash-appt-tbody').innerHTML.trim().slice(0,100) : 'N/A',
  }));
  console.log('\n=== STATE ===');
  Object.entries(state).forEach(([k,v]) => console.log(k + ':', v));

  await page.screenshot({ path: 'temporary screenshots/new-user-dashboard.png' });
  console.log('\nScreenshot saved.');

  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
