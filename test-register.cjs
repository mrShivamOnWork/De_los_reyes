const puppeteer = require('./node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => {
    const t = msg.text();
    if (!t.includes('[DOM]') && !t.includes('Password field')) logs.push(msg.type() + ': ' + t);
  });

  await page.goto('http://localhost:3000/patient-portal.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => showRegister());
  await new Promise(r => setTimeout(r, 500));

  await page.type('#r-fname', 'Test');
  await page.type('#r-lname', 'User');
  await page.type('#r-email', 'testuser99@yopmail.com');
  await page.type('#r-pass', 'testpass123');
  await page.type('#r-pass2', 'testpass123');

  const hasDob = await page.$('#r-dob');
  if (hasDob) await page.type('#r-dob', '1995-06-15');
  const hasSex = await page.$('#r-sex');
  if (hasSex) await page.select('#r-sex', 'Male');

  await page.evaluate(() => doRegister());
  await new Promise(r => setTimeout(r, 7000));

  console.log('=== CONSOLE LOGS ===');
  logs.forEach(l => console.log(l));

  const state = await page.evaluate(() => ({
    loginScreen: document.getElementById('loginScreen') ? document.getElementById('loginScreen').style.display : 'N/A',
    registerScreen: document.getElementById('registerScreen') ? document.getElementById('registerScreen').style.display : 'N/A',
    patientApp: document.getElementById('patientApp') ? document.getElementById('patientApp').className : 'N/A',
    toastText: document.querySelector('.toast') ? document.querySelector('.toast').textContent.trim() : 'no toast'
  }));
  console.log('=== STATE ===');
  console.log(JSON.stringify(state, null, 2));

  await browser.close();
})().catch(e => console.error('ERROR:', e.message));
