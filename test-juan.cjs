const puppeteer = require('./node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.type('#login-email', 'patient@demo.com');
  await page.type('#login-pass', 'demo1234');
  await page.evaluate(() => doLogin());
  await new Promise(r => setTimeout(r, 7000));

  const state = await page.evaluate(() => ({
    welcomeTitle: document.getElementById('welcomeTitle').textContent,
    welcomeSub: document.getElementById('welcomeSub') ? document.getElementById('welcomeSub').textContent : 'N/A',
    statUpcoming: document.getElementById('stat-upcoming').textContent,
    statCompleted: document.getElementById('stat-completed').textContent,
    statRecords: document.getElementById('stat-records').textContent,
    sidebarName: document.getElementById('sidebarName').textContent,
  }));
  console.log('=== JUAN STATE ===');
  Object.entries(state).forEach(([k, v]) => console.log(k + ':', v));

  await page.screenshot({ path: 'temporary screenshots/juan-dashboard.png' });
  console.log('Screenshot saved.');
  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
