const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to autocircuits.org...');
    await page.goto('https://autocircuits.org/autocir_run.php', { waitUntil: 'networkidle' });

    // Click Kirchhoff Laws
    console.log('Selecting Kirchhoff Laws...');
    await page.getByText('Chapters', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.getByText('Kirchhoff Laws', { exact: true }).click();
    await page.waitForLoadState('networkidle');

    // Generate
    console.log('Generating circuit...');
    const generateContainer = page.locator('#divImageContainer');
    await generateContainer.click({ force: true });

    // Wait for "Circuit available"
    console.log('Waiting for availability...');
    await page.locator('#fileStatusLog').filter({ hasText: /Circuit available/i }).waitFor({ state: 'visible', timeout: 60000 });

    // NOW EXPLORE
    console.log('Exploring elements...');

    // 1. Take screenshot of the whole page to see layout
    await page.screenshot({ path: 'site_debug.png', fullPage: true });

    // 2. Take screenshot of the image container specifically
    await generateContainer.screenshot({ path: 'diagram_debug.png' });

    // 3. Dump the HTML status log and look for solution
    const logText = await page.locator('#fileStatusLog').innerText();
    console.log('--- Status Log ---');
    console.log(logText);

    // 4. Look for "Solution" or "Result" elements
    const bodyText = await page.innerText('body');
    fs.writeFileSync('site_dump.txt', bodyText);

    // 5. Look for buttons or tabs that might reveal the answer
    const buttons = await page.locator('button, a, .tab').allInnerTexts();
    console.log('--- Interactive Elements ---');
    console.log(buttons.join(' | '));

    await browser.close();
    console.log('Done exploring.');
})();
