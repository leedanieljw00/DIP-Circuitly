/**
 * Circuit Automation Script for autocircuits.org
 * 
 * INSTALLATION:
 * 1. Ensure Node.js is installed.
 * 2. Run: npm install playwright
 * 3. Run: npx playwright install  (to download browsers)
 * 
 * USAGE:
 * Run: node circuit_automation.js
 * 
 * CONFIGURATION:
 * - Edit the HEADLESS constant below to true/false to toggle headless mode.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Target Chapters/Topics
const CHAPTERS = [
    "Kirchhoff Laws",
    "DC Equivalent Resistance",
    //"DC Two-Ports",
    "AC Circuits",
    "First-Order circuits",
    "Transfer Functions"
];

// Configuration
const HEADLESS = false; // Set to false to see the browser in action
const MAX_DIAGRAMS = 200; // Maximum number of diagrams to keep per chapter
const SAVE_ERROR_SCREENSHOTS = false; // Set to true for debugging

(async () => {
    // --- CLI Configuration ---
    const args = process.argv.slice(2);
    const getArg = (name, def) => {
        const idx = args.indexOf(name);
        return (idx !== -1 && args[idx + 1]) ? args[idx + 1] : def;
    };

    const isHeadless = args.includes('--headless');
    const durationMins = parseFloat(getArg('--duration', '30'));
    const intervalSecs = parseFloat(getArg('--interval', '60'));

    console.log("\n===========================================");
    console.log("   Circuit Automation - Launcher");
    console.log("===========================================\n");

    const DURATION_MS = durationMins * 60 * 1000;
    const INTERVAL_MS = intervalSecs * 1000;

    console.log(`\n[Settings] Runtime: ${durationMins} mins | Interval: ${intervalSecs}s | Headless: ${isHeadless}`);
    console.log(`Starting execution...\n`);

    const START_TIME = Date.now();

    let browser;
    let context;
    let page;

    try {
        browser = await chromium.launch({
            headless: isHeadless,
            slowMo: 100, // Slow down operations slightly for stability
        });

        context = await browser.newContext({
            acceptDownloads: true
        });

        page = await context.newPage();

        // Initialization: Cleanup and Organize
        console.log('Cleaning up old error/debug files...');
        cleanupOldErrors();

        console.log('Organizing existing files into chapter folders...');
        organizeExistingFiles();

        // Main Loop
        while (true) {
            // Check Runtime
            const elapsed = Date.now() - START_TIME;
            if (elapsed >= DURATION_MS) {
                console.log(`\n[Finished] Time limit of ${durationMins} minutes reached. Stopping.`);
                break;
            }
            const remainingMins = Math.ceil((DURATION_MS - elapsed) / 60000);
            console.log(`[Status] Time Remaining: ~${remainingMins} minutes`);

            // Ensure organization persists (periodic check)
            organizeExistingFiles();

            // 1. Select Random Chapter
            const randomChapter = CHAPTERS[Math.floor(Math.random() * CHAPTERS.length)];
            console.log(`\n--- Starting Cycle: ${new Date().toLocaleTimeString()} ---`);
            console.log(`Selected Chapter: "${randomChapter}"`);

            try {
                // 2. Navigate/Reset
                console.log('Navigating to https://autocircuits.org/autocir_run.php...');
                await page.goto('https://autocircuits.org/autocir_run.php', { waitUntil: 'networkidle' });

                // 3. Click "Chapters"
                console.log('Clicking "Chapters"...');
                const chaptersTab = page.getByText('Chapters', { exact: true });
                await chaptersTab.waitFor({ state: 'visible', timeout: 30000 });
                await chaptersTab.click();

                // Wait for potential dynamic content load
                await page.waitForLoadState('networkidle');

                // 4. Click Selected Chapter
                // Note: The text on the website must match exactly or close enough.
                // We use relaxed matching if exact fails, or try finding it.
                console.log(`Clicking "${randomChapter}"...`);

                // Trying exact match first, then partial
                const chapterLocator = page.getByText(randomChapter, { exact: true });
                if (await chapterLocator.isVisible()) {
                    await chapterLocator.click();
                } else {
                    console.log(`Exact match for "${randomChapter}" not found. Trying loose match...`);
                    await page.getByText(randomChapter, { exact: false }).first().click();
                }

                // Wait for the UI update
                await page.waitForLoadState('networkidle');

                // 5. Generate and Download Flow
                console.log('Starting generation flow...');

                const generateContainer = page.locator('#divImageContainer');
                await generateContainer.waitFor({ state: 'visible', timeout: 10000 });

                // Step 5a: Click to generate
                console.log('Clicking generate icon (1st click)...');
                await generateContainer.click({ force: true });

                // Step 5b: Wait for "Circuit available" text
                console.log('Waiting for circuit generation (text: "Circuit available")...');

                const statusLocator = page.locator('#fileStatusLog').filter({ hasText: /Circuit available/i });
                await statusLocator.waitFor({ state: 'visible', timeout: 120000 });

                console.log('Circuit is available!');

                // Wait a small buffer
                await page.waitForTimeout(3000);

                // Step 5c: Click again to open popup
                console.log('Clicking generate icon again to open popup (2nd click)...');

                // Wait for the icon to be interactive and specific
                const pdfIcon = page.locator('#divImageContainer img[src*="pdf"], #cirDownloadLinkImage, #divImageContainer a').first();
                await pdfIcon.waitFor({ state: 'visible', timeout: 10000 });

                // Small buffer to ensure the click listener is attached
                await page.waitForTimeout(1000);

                // Listen for popup
                const popupPromise = page.waitForEvent('popup', { timeout: 60000 });

                await pdfIcon.click({ force: true });

                const popup = await popupPromise;
                console.log('Popup opened! Waiting for it to load...');
                await popup.waitForLoadState();

                // Step 5d: Download logic
                let downloadBuffer;
                let downloadedFilename = 'autocircuit.pdf';

                if (popup.url().endsWith('.pdf')) {
                    console.log('Popup is directly a PDF.');
                    const response = await context.request.get(popup.url());
                    downloadBuffer = await response.body();
                } else {
                    console.log('Popup is a page. Clicking download button...');
                    const popupDownloadBtn = popup.locator('a[download], button:has-text("Download"), a:has-text("Download"), .download-btn, i.fa-download').first();

                    // Helper to wait for download
                    const downloadPromise = popup.waitForEvent('download', { timeout: 30000 });

                    if (await popupDownloadBtn.count() > 0) {
                        await popupDownloadBtn.click();
                    } else {
                        const clickHere = popup.getByText('click here', { exact: false });
                        if (await clickHere.isVisible()) {
                            await clickHere.click();
                        } else {
                            // Heuristic fallback: press Enter (sometimes works) or click generic body if it's an overlay
                            console.log("Locating download button failed. Trying generic clicks.");
                        }
                    }

                    const download = await downloadPromise;
                    const stream = await download.createReadStream();
                    // Read stream to buffer for consistency in renaming later (or just save directly)
                    downloadedFilename = await download.path(); // Temporary path
                    // simpler:
                    await download.saveAs(path.resolve(__dirname, 'temp_download.pdf'));
                    downloadBuffer = fs.readFileSync(path.resolve(__dirname, 'temp_download.pdf'));
                    fs.unlinkSync(path.resolve(__dirname, 'temp_download.pdf'));
                }

                // Step 6: Save with Correct Name and Manage Retention
                // Name format: ChapterName/ChapterName_Timestamp.pdf

                // Sanitize chapter name for folder and filename
                const safeChapterName = randomChapter.replace(/[^a-zA-Z0-9]/g, '_');
                const chapterDir = path.resolve(__dirname, safeChapterName);

                // Ensure chapter directory exists
                if (!fs.existsSync(chapterDir)) {
                    fs.mkdirSync(chapterDir);
                    console.log(`Created directory: ${chapterDir}`);
                }

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const finalFilename = `${safeChapterName}_${timestamp}.pdf`;
                const finalPath = path.resolve(chapterDir, finalFilename);

                if (downloadBuffer) {
                    fs.writeFileSync(finalPath, downloadBuffer);
                    console.log(`SUCCESS: Saved to ${path.relative(__dirname, finalPath)}`);

                    // Manage Retention
                    manageRetention(chapterDir);

                    // --- AUTOMATIC EXTRACTION (TEXT ONLY) ---
                    try {
                        console.log('--- Starting Text Extraction ---');
                        const { processAll } = require('./extract_circuits.js');
                        await processAll();
                        console.log('--- Text Extraction & Excel Update Complete ---');
                    } catch (extErr) {
                        console.error('Extraction failed:', extErr.message);
                    }

                } else {
                    console.error('Failed to capture download content.');
                }

                // Close popup
                if (!popup.isClosed()) await popup.close();

            } catch (err) {
                console.error(`Error in cycle for "${randomChapter}":`, err.message);

                if (SAVE_ERROR_SCREENSHOTS) {
                    const errorDir = path.resolve(__dirname, 'Errors');
                    if (!fs.existsSync(errorDir)) fs.mkdirSync(errorDir);
                    const screenshotPath = path.join(errorDir, `error_${Date.now()}.png`);
                    await page.screenshot({ path: screenshotPath });
                    console.log(`Error screenshot saved to: ${screenshotPath}`);

                    // Limit Errors folder size
                    manageRetention(errorDir, 5); // Keep only last 5 error screenshots
                }
            }

            console.log(`Waiting ${INTERVAL_MS / 1000} seconds before next cycle...`);
            await page.waitForTimeout(INTERVAL_MS);
        }

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();

// Helper Functions

function organizeExistingFiles() {
    try {
        const rootDir = __dirname;
        const files = fs.readdirSync(rootDir);

        CHAPTERS.forEach(chapter => {
            const safeChapterName = chapter.replace(/[^a-zA-Z0-9]/g, '_');
            const chapterDir = path.join(rootDir, safeChapterName);

            // Create directory if it doesn't exist
            if (!fs.existsSync(chapterDir)) {
                fs.mkdirSync(chapterDir);
                // console.log(`Created directory: ${chapterDir}`);
            }

            // identify files matching this chapter in the root directory
            const matchingFiles = files.filter(f =>
                f.startsWith(safeChapterName + '_') && f.endsWith('.pdf') &&  // Match pattern
                fs.statSync(path.join(rootDir, f)).isFile() // Ensure it's a file
            );

            matchingFiles.forEach(file => {
                const oldPath = path.join(rootDir, file);
                const newPath = path.join(chapterDir, file);

                // Move file
                try {
                    fs.renameSync(oldPath, newPath);
                    console.log(`[Organization] Moved ${file} to ${safeChapterName}/`);
                } catch (err) {
                    console.error(`Failed to move ${file}:`, err);
                }
            });

            // Run retention check on the folder
            manageRetention(chapterDir);
        });

    } catch (err) {
        console.error('Error during file organization:', err);
    }
}

function manageRetention(dirPath, limit = MAX_DIAGRAMS) {
    try {
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath)
            .filter(f => f.endsWith('.pdf') || f.endsWith('.png')) // Manage both PDFs and screenshots
            .map(f => ({
                name: f,
                path: path.join(dirPath, f),
                ctime: fs.statSync(path.join(dirPath, f)).ctimeMs
            }))
            .sort((a, b) => b.ctime - a.ctime); // Sort new to old

        if (files.length > limit) {
            console.log(`[Retention] ${path.basename(dirPath)}: ${files.length} files found. Removing old files (Limit: ${limit})...`);
            const filesToDelete = files.slice(limit);
            for (const file of filesToDelete) {
                try {
                    fs.unlinkSync(file.path);
                    console.log(`Deleted old file: ${file.name}`);
                } catch (err) {
                    console.error(`Failed to delete ${file.name}:`, err);
                }
            }
        }
    } catch (err) {
        console.error(`Error managing retention for ${dirPath}:`, err);
    }
}

function cleanupOldErrors() {
    try {
        const rootDir = __dirname;
        const files = fs.readdirSync(rootDir);

        // Patterns for files to cleanup
        const cleanupPatterns = [
            /^error_.*\.png$/,
            /^site_debug\.png$/,
            /^site_dump\.txt$/,
            /^diagram_debug\.png$/
        ];

        files.forEach(file => {
            const isMatch = cleanupPatterns.some(pattern => pattern.test(file));
            if (isMatch) {
                const filePath = path.join(rootDir, file);
                if (fs.statSync(filePath).isFile()) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`[Cleanup] Deleted: ${file}`);
                    } catch (err) {
                        console.error(`Failed to delete ${file}:`, err.message);
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error during cleanup:', err.message);
    }
}
