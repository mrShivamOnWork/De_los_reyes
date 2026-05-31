const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'temporary screenshots');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const rect = await page.evaluate(() => {
    const el = document.getElementById('portal');
    if (!el) return null;
    return { top: el.getBoundingClientRect().top + window.scrollY };
  });

  // Scroll 300px past the portal section top to see the cards
  await page.evaluate((scrollY) => { window.scrollTo(0, scrollY); }, rect.top + 200);
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, 'portal-cards.png'), fullPage: false });
  console.log('Saved portal-cards.png');

  await browser.close();
})();
