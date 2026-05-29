import puppeteer from './node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => {
  if (!msg.text().includes('[DOM]')) logs.push(msg.type() + ': ' + msg.text());
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

console.log('=== LOGS ===');
logs.forEach(l => console.log(l));

const state = await page.evaluate(() => ({
  loginScreen: document.getElementById('loginScreen')?.style.display,
  registerScreen: document.getElementById('registerScreen')?.style.display,
  patientApp: document.getElementById('patientApp')?.className,
  toastText: document.querySelector('.toast')?.textContent?.trim()
}));
console.log('State:', JSON.stringify(state, null, 2));

await browser.close();
