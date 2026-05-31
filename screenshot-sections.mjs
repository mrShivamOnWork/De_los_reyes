import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'temporary screenshots');

const sections = ['faq', 'location', 'portal'];

for (const id of sections) {
  const outFile = path.join(outDir, `section-${id}-${Date.now()}.png`);
  const script = `
    const puppeteer = require('puppeteer');
    const fs = require('fs');
    fs.mkdirSync(${JSON.stringify(outDir)}, { recursive: true });
    (async () => {
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 800));
      await page.evaluate((sectionId) => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'instant' });
      }, ${JSON.stringify(id)});
      await new Promise(r => setTimeout(r, 600));
      const el = await page.$('#${id}');
      if (el) {
        await el.screenshot({ path: ${JSON.stringify(outFile)} });
        console.log('Saved: ' + ${JSON.stringify(outFile)});
      } else {
        console.log('Element #${id} not found');
      }
      await browser.close();
    })();
  `;
  await new Promise((resolve) => {
    exec(`node -e "${script.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`, (err, stdout, stderr) => {
      if (err) console.error(`Failed for ${id}:`, stderr || err.message);
      else console.log(stdout);
      resolve();
    });
  });
}
