// Minimal Playwright-based tests for the two demo pages
// Tests:
// - Proper page: user should be able to complete the data load (detect __properLoaded)
// - Malformed page: user attempt should fail to open popup (detect __popupAttempted && !__popupOpened)

const { chromium } = require('playwright');
const path = require('path');
const httpServer = require('http-server');

(async () => {
  // Start a static file server from the repo root
  const root = path.resolve(__dirname, '..');
  const server = httpServer.createServer({ root });
  const listener = server.listen(0);
  const port = listener.address().port;
  const base = `http://localhost:${port}`;
  console.log('Serving', root, 'on', base);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test proper page
  try {
    await page.goto(base + '/index.html');
    // Upload the sample CSV
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('input#fileInput')
    ]);
    await fileChooser.setFiles(path.join(root, 'sample.csv'));
    await page.click('button#loadBtn');
    // Wait for window flag
    await page.waitForFunction(() => window.__properLoaded === true, { timeout: 3000 });
    console.log('PROPER: PASS - data loaded into memory');
  } catch (err) {
    console.error('PROPER: FAIL', err);
  }

  // Test malformed page
  try {
    const mpage = await context.newPage();
    await mpage.goto(base + '/malformed.html');
    const [fileChooser2] = await Promise.all([
      mpage.waitForEvent('filechooser'),
      mpage.click('input#fileInput')
    ]);
    await fileChooser2.setFiles(path.join(root, 'sample.csv'));
    await mpage.click('button#loadBtn');

    // Wait briefly then inspect flags
    await mpage.waitForTimeout(1000);
    const popupAttempted = await mpage.evaluate(() => !!window.__popupAttempted);
    const popupOpened = await mpage.evaluate(() => !!window.__popupOpened);

    if (popupAttempted && !popupOpened) {
      console.log('MALFORMED: PASS - popup attempted and blocked (as expected)');
    } else if (popupAttempted && popupOpened) {
      console.warn('MALFORMED: WARNING - popup opened (browser allowed it)');
    } else {
      console.error('MALFORMED: FAIL - popup was not attempted');
    }
  } catch (err) {
    console.error('MALFORMED: FAIL', err);
  }

  await browser.close();
  listener.close();
})();
