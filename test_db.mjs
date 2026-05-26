import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('dialog', async dialog => {
    console.log('ALERT MESSAGE:', dialog.message());
    await dialog.accept();
    await browser.close();
  });
  
  await page.goto('http://localhost:5173');
  
  // Wait for the topic node 1 to appear and click it
  await page.waitForSelector('text=Chặng 1');
  const buttons = await page.$$('button');
  
  // Click the first stage button in the list fallback
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.includes('Chặng 1')) {
      await btn.click();
      break;
    }
  }
  
  // Wait a bit for the alert
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
