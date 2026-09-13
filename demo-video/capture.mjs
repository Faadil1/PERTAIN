import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.PERTAIN_URL || 'https://pertain.faadil-casecraft.workers.dev/';
const outDir = path.resolve('public/capture');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 1,
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(5000);

const save = async (name, selector, fullPage = false) => {
  const target = page.locator(selector).first();
  if ((await target.count()) > 0 && await target.isVisible().catch(() => false)) {
    await target.screenshot({ path: path.join(outDir, `${name}.png`) });
    return;
  }
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage });
};

await page.screenshot({ path: path.join(outDir, 'hero.png'), fullPage: false });
await save('statement', '.dispatch-card');
await save('partition', '.switchboard-section');
await save('execution', '.worker-section');
await save('proof', '.proof-receipt');
await page.screenshot({ path: path.join(outDir, 'full-page.png'), fullPage: true });

console.log(`Captured PERTAIN from ${url}`);
await browser.close();
