import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'screenshot';
const outDir = path.join(__dirname, 'temporary screenshots');
const outFile = path.join(outDir, `${label}-${Date.now()}.png`);

const script = `
  const puppeteer = require('puppeteer');
  const fs = require('fs');
  fs.mkdirSync(${JSON.stringify(outDir)}, { recursive: true });
  (async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(${JSON.stringify(url)}, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: ${JSON.stringify(outFile)}, fullPage: true });
    await browser.close();
    console.log('Screenshot saved:', ${JSON.stringify(outFile)});
  })();
`;

exec(`node -e "${script.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`, (err, stdout, stderr) => {
  if (err) {
    console.error('Screenshot failed (is puppeteer installed?):', stderr || err.message);
    process.exit(1);
  }
  console.log(stdout);
});
