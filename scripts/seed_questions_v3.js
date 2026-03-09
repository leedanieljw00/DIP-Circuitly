const db = require('../backend/config/db');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

function getCellValue(cell) {
    if (!cell || !cell.value) return null;
    if (typeof cell.value === 'object') {
        if (cell.value.richText) {
            return cell.value.richText.map(rt => rt.text).join('').trim();
        }
        if (cell.value.text) return cell.value.text.toString().trim();
        if (cell.value.result !== undefined) return cell.value.result.toString().trim();
        return JSON.stringify(cell.value); // Last resort
    }
    return cell.value.toString().trim();
}

// Helper to get text from potential richText/object in values array
function getVal(v) {
    if (v === undefined || v === null) return null;
    if (typeof v === 'object') {
        if (v.richText) return v.richText.map(rt => rt.text).join('').trim();
        if (v.text) return v.text.toString().trim();
        if (v.result !== undefined) return v.result.toString().trim();
        return JSON.stringify(v);
    }
    return v.toString().trim();
}

async function seed() {
    const workbook = new ExcelJS.Workbook();
    const infoWorkbook = new ExcelJS.Workbook();

    const bankPath = path.join(__dirname, '../database/EE DIP QUESTION BANK.xlsx');
    const infoPath = path.join(__dirname, '../database/Info.xlsx');

    try {
        console.log("Loading Excel files...");
        await workbook.xlsx.readFile(bankPath);
        await infoWorkbook.xlsx.readFile(infoPath);

        const infoSheet = infoWorkbook.getWorksheet(1);
        const topicMap = {};

        console.log("Mapping topics from Info.xlsx...");
        infoSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const topicId = getCellValue(row.getCell(2));
            const topicName = getCellValue(row.getCell(3));
            if (topicId && topicName) {
                topicMap[topicName] = parseInt(topicId);
            }
        });

        const manualMapping = {
            'Basic Laws': 1,
            'Fundamentals': 1,
            'Theorems': 1,
            'Nodal & Mesh': 1,
            'Energy Storage Elements': 2,
            'Energy Storage': 2,
            'Capacitors & Inductors': 2,
            'Transient & Steady-State': 3,
            'Step Response': 3,
            'Steady State': 3,
            'Ideal Op-Amps': 4,
            'Op-Amps': 4,
            'Laplace Transforms': 5,
            'Laplace': 5,
            'Network Functions': 6,
            'DC vs. AC': 7,
            'Phasors': 7,
            'AC Steady State': 7,
            'Three-Phase Circuits': 8,
            'Three-Phase': 8
        };

        const questionsSheet = workbook.getWorksheet(1);
        console.log("Truncating questions table...");
        await db.query('TRUNCATE TABLE questions RESTART IDENTITY');

        console.log(`Starting data insertion... total rows: ${questionsSheet.rowCount}`);
        let count = 0;

        async function processRow(rowNumber, topicName, prompt, a, b, c, d, ans, diff, exp) {
            let topicId = topicMap[topicName] || manualMapping[topicName];
            if (!topicId && topicName) {
                const key = Object.keys(topicMap).find(k => k.toLowerCase().includes(topicName.toLowerCase()) || topicName.toLowerCase().includes(k.toLowerCase()));
                if (key) topicId = topicMap[key];
                if (!topicId) {
                    const manualKey = Object.keys(manualMapping).find(k => k.toLowerCase().includes(topicName.toLowerCase()) || topicName.toLowerCase().includes(k.toLowerCase()));
                    if (manualKey) topicId = manualMapping[manualKey];
                }
            }

            if (!topicId) {
                // if (rowNumber <= 50) console.warn(`Row ${rowNumber}: Unknown topic "${topicName}"`);
                return;
            }

            try {
                await db.query(
                    `INSERT INTO questions (topic_id, type, difficulty, prompt, option_a, option_b, option_c, option_d, answer, explanation) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [topicId, 'mcq', diff?.toLowerCase() || 'medium', prompt, a, b, c, d, ans, exp]
                );
                count++;
                if (count % 100 === 0) console.log(`Inserted ${count} questions...`);
            } catch (err) {
                console.error(`Error inserting row ${rowNumber}:`, err.message);
            }
        }

        for (let i = 2; i <= questionsSheet.rowCount; i++) {
            const row = questionsSheet.getRow(i);
            const vals = row.values;

            if (i === 3) {
                console.log(`DEBUG ROW 3 VALS:`, JSON.stringify(vals));
            }

            if (!vals || vals.length < 3) continue;

            const topicName = getVal(vals[2]);
            const prompt = getVal(vals[3]);
            const optionA = getVal(vals[4]);
            const optionB = getVal(vals[5]);
            const optionC = getVal(vals[6]);
            const optionD = getVal(vals[7]);
            const answer = getVal(vals[8]);
            const difficulty = getVal(vals[9]);
            const explanation = getVal(vals[10]);

            if (!prompt || !answer) {
                // Try shifted positions
                const altTopic = getVal(vals[1]);
                const altPrompt = getVal(vals[2]);
                const altAnswer = getVal(vals[7]);
                if (altPrompt && altAnswer) {
                    await processRow(i, altTopic, altPrompt, getVal(vals[3]), getVal(vals[4]), getVal(vals[5]), getVal(vals[6]), altAnswer, getVal(vals[8]), getVal(vals[9]));
                }
                continue;
            }

            await processRow(i, topicName, prompt, optionA, optionB, optionC, optionD, answer, difficulty, explanation);
        }

        console.log(`Seeding complete! Inserted ${count} questions.`);
        process.exit(0);

    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
