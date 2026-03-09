const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const ExcelJS = require('exceljs');

const CHAPTERS = [
    "Kirchhoff Laws",
    "DC Equivalent Resistance",
    "DC Two-Ports",
    "AC Circuits",
    "First-Order circuits",
    "Transfer Functions"
];

const ROOT_DIR = __dirname;
const EXTRACTED_DIR = path.join(ROOT_DIR, 'Extracted');
const EXCEL_PATH = path.join(ROOT_DIR, 'Circuit_Data.xlsx');

/**
 * Aggressively cleans text by removing licensing boilerplate, 
 * website metadata, and excessive whitespace.
 */
function cleanText(text) {
    if (!text) return "";
    let cleaned = text;
    const licenseRE = /This work is licensed under a Creative Commons Attribution-NonCommercial4\.0 International License\./gi;
    cleaned = cleaned.replace(licenseRE, '');
    const generatedRE = /Generated on \w+ \d+, \d+ by\s*autoCircuits\.org/gi;
    cleaned = cleaned.replace(generatedRE, '');
    cleaned = cleaned.replace(/autoCircuits\.org/gi, '');
    cleaned = cleaned.replace(/http[s]?:\/\/autociruits\.org/gi, '');
    cleaned = cleaned.replace(/([vRiL])\s+(\d+)/gi, '$1$2');
    cleaned = cleaned.replace(/\s*=\s*/g, ' = ');
    cleaned = cleaned.replace(/\s\s+/g, ' ').trim();
    return cleaned;
}

async function extractFromPDF(pdfPath, chapterName, questionNumber) {
    const filename = path.basename(pdfPath, '.pdf');
    const safeChapter = chapterName.replace(/[^a-zA-Z0-9]/g, '_');
    const outputSubdir = path.join(EXTRACTED_DIR, safeChapter, filename);

    if (!fs.existsSync(outputSubdir)) {
        fs.mkdirSync(outputSubdir, { recursive: true });
    }

    const diagramPath = path.join(outputSubdir, 'diagram.png');
    const answerPath = path.join(outputSubdir, 'answer.txt');
    const questionPath = path.join(outputSubdir, 'question.txt');

    console.log(`Processing: ${filename}...`);

    let browser;
    let canvasScreenshotPath = null;
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        // --- TEXT PARSING ---
        const rawLines = data.text.split(/\r?[\n\f]/);
        const joinedText = rawLines.map(line => line.trim()).filter(line => line).join(' ');

        const problemMatch = joinedText.match(/Problem:\s*(.+?)(?=\s*Solution|\s*Generated\s+on|\s*This\s+work\s+is\s+licensed|$)/i);
        let questionText = problemMatch ? problemMatch[1].trim() : "Problem text not found.";
        questionText = cleanText(questionText);
        fs.writeFileSync(questionPath, questionText);

        const solutionMatch = joinedText.match(/Solution\s+(.+?)(?=\s*This\s+work\s+is\s+licensed|\s*Generated\s+on|$)/i);
        let answerText = solutionMatch ? solutionMatch[1].trim() : "Solution text not found.";
        answerText = cleanText(answerText);
        fs.writeFileSync(answerPath, answerText);

        // --- DIAGRAM EXTRACTION (via PDF.js) ---
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const base64Pdf = dataBuffer.toString('base64');

        await page.setContent(`
            <html>
            <head>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
            </head>
            <body style="margin:0; background:white;">
                <canvas id="pdf-canvas"></canvas>
                <script>
                    const pdfData = atob("${base64Pdf}");
                    const loadingTask = pdfjsLib.getDocument({data: pdfData});
                    loadingTask.promise.then(pdf => {
                        pdf.getPage(1).then(page => {
                            const scale = 3.0; // High resolution for clear diagrams
                            const viewport = page.getViewport({scale: scale});
                            const canvas = document.getElementById('pdf-canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
                            const renderContext = {
                                canvasContext: context,
                                viewport: viewport
                            };
                            page.render(renderContext).promise.then(() => {
                                window.pdfRendered = true;
                            });
                        });
                    });
                </script>
            </body>
            </html>
        `);

        // Wait for rendering to actually finish painting
        await page.waitForFunction(() => window.pdfRendered === true, { timeout: 30000 });

        canvasScreenshotPath = path.join(outputSubdir, 'canvas_temp.png');
        const canvas = await page.$('#pdf-canvas');
        await canvas.screenshot({ path: canvasScreenshotPath });

        // Smart Crop with 10px safety margin
        await sharp(canvasScreenshotPath)
            .trim({ threshold: 10 })
            .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFile(diagramPath);

        console.log(`  Success: Extracted Pure Text & Diagram`);

        return {
            no: questionNumber,
            type: chapterName,
            question: questionText,
            diagramPath: diagramPath,
            answer: answerText
        };

    } catch (err) {
        console.error(`  Error: ${err.message}`);
        return null;
    } finally {
        if (browser) await browser.close();
        if (canvasScreenshotPath && fs.existsSync(canvasScreenshotPath)) {
            fs.unlinkSync(canvasScreenshotPath);
        }
        // Cleanup any accidental raw_page.png from other tools
        const rawPagePath = path.join(outputSubdir, 'raw_page.png');
        if (fs.existsSync(rawPagePath)) fs.unlinkSync(rawPagePath);
    }
}

async function generateExcel(dataList) {
    console.log("\nGenerating Full Content Excel file...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Circuits');

    worksheet.columns = [
        { header: 'No', key: 'no', width: 8, style: { alignment: { horizontal: 'center' } } },
        { header: 'Question Type', key: 'type', width: 25, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
        { header: 'Diagram', key: 'diagram', width: 60 },
        { header: 'Question', key: 'question', width: 80, style: { alignment: { wrapText: true, vertical: 'middle' } } },
        { header: 'Correct Answer', key: 'answer', width: 40, style: { alignment: { wrapText: true, vertical: 'middle' } } }
    ];

    const rowHeight = 220; // Enough height for visible diagrams

    for (let i = 0; i < dataList.length; i++) {
        const item = dataList[i];
        const row = worksheet.addRow({
            no: item.no,
            type: item.type,
            question: item.question,
            answer: item.answer
        });

        row.height = rowHeight;

        if (fs.existsSync(item.diagramPath)) {
            const imageId = workbook.addImage({
                filename: item.diagramPath,
                extension: 'png',
            });

            // Embed image in the Diagram column (column 3)
            worksheet.addImage(imageId, {
                tl: { col: 2.1, row: row.number - 0.9 }, // Position inside cell
                ext: { width: 380, height: rowHeight - 40 }
            });
        }
    }

    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).height = 30;
    worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    await workbook.xlsx.writeFile(EXCEL_PATH);
    console.log(`Excel file saved: ${EXCEL_PATH}`);
}

async function processAll() {
    console.log("Starting Smart Content Extraction...");

    if (!fs.existsSync(EXTRACTED_DIR)) fs.mkdirSync(EXTRACTED_DIR, { recursive: true });

    const allData = [];
    let count = 1;

    for (const chapter of CHAPTERS) {
        const safeName = chapter.replace(/[^a-zA-Z0-9]/g, '_');
        const chapterDir = path.join(ROOT_DIR, safeName);
        if (fs.existsSync(chapterDir)) {
            const files = fs.readdirSync(chapterDir).filter(f => f.endsWith('.pdf'));
            console.log(`\nChapter: ${chapter} (${files.length} files)`);
            for (const file of files) {
                const pdfPath = path.join(chapterDir, file);
                const filename = path.basename(file, '.pdf');
                const safeChapter = chapter.replace(/[^a-zA-Z0-9]/g, '_');
                const outputSubdir = path.join(EXTRACTED_DIR, safeChapter, filename);

                const diagramPath = path.join(outputSubdir, 'diagram.png');
                const answerPath = path.join(outputSubdir, 'answer.txt');
                const questionPath = path.join(outputSubdir, 'question.txt');

                let result;
                // Skip if already extracted
                if (fs.existsSync(diagramPath) && fs.existsSync(answerPath) && fs.existsSync(questionPath)) {
                    console.log(`Skipping: ${filename} (Already exists)`);
                    result = {
                        no: count++,
                        type: chapter,
                        question: fs.readFileSync(questionPath, 'utf8'),
                        diagramPath: diagramPath,
                        answer: fs.readFileSync(answerPath, 'utf8')
                    };
                } else {
                    result = await extractFromPDF(pdfPath, chapter, count++);
                }

                if (result) allData.push(result);
            }
        }
    }

    if (allData.length > 0) await generateExcel(allData);
    console.log("\nBatch extraction complete!");
}

if (require.main === module) processAll();

module.exports = { extractFromPDF, generateExcel, processAll, cleanText };
