const db = require('../backend/config/db');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

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
        const topicMap = {}; // Name -> ID

        console.log("Mapping topics from Info.xlsx...");
        infoSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const topicId = row.getCell(2).value;
            const topicName = row.getCell(3).value;
            if (topicId && topicName) {
                topicMap[topicName.toString().trim()] = parseInt(topicId);
            }
        });

        console.log("Topic Mapping:", JSON.stringify(topicMap, null, 2));

        const questionsSheet = workbook.getWorksheet(1);

        console.log("Truncating questions table...");
        await db.query('TRUNCATE TABLE questions RESTART IDENTITY');

        console.log(`Starting data insertion... sheet row count: ${questionsSheet.rowCount}`);

        function getCellValue(cell) {
            if (!cell.value) return null;
            if (typeof cell.value === 'object') {
                if (cell.value.richText) {
                    return cell.value.richText.map(rt => rt.text).join('').trim();
                }
                if (cell.value.text) return cell.value.text.toString().trim();
                return JSON.stringify(cell.value); // Fallback
            }
            return cell.value.toString().trim();
        }

        const manualMapping = {
            'Basic Laws': 1,
            'Nodal & Mesh': 1,
            'Theorems': 1,
            'Energy Storage': 2,
            'Step Response': 3,
            'Phasors': 7,
            'AC Steady State': 7,
            'Op-Amps': 4,
            'Ideal Op-Amps': 4
        };

        let count = 0;
        // Iterate through rows starting from row 1
        for (let i = 1; i <= questionsSheet.rowCount; i++) {
            const row = questionsSheet.getRow(i);

            const topicNameRaw = getCellValue(row.getCell(1));
            const topicName = topicNameRaw?.trim();
            const prompt = getCellValue(row.getCell(2));
            const optionA = getCellValue(row.getCell(3));
            const optionB = getCellValue(row.getCell(4));
            const optionC = getCellValue(row.getCell(5));
            const optionD = getCellValue(row.getCell(6));
            const answer = getCellValue(row.getCell(7));
            const difficulty = getCellValue(row.getCell(8));
            const explanation = getCellValue(row.getCell(9));

            if (i <= 10) {
                console.log(`Row ${i}: Topic="${topicName}", Prompt="${prompt ? prompt.substring(0, 30) : 'null'}", Ans="${answer}"`);
            }

            if (!prompt || !answer) continue;

            let topicId = topicMap[topicName] || manualMapping[topicName];

            // Try partial match if no direct match
            if (!topicId && topicName) {
                const key = Object.keys(topicMap).find(k => k.includes(topicName) || topicName.includes(k));
                if (key) topicId = topicMap[key];
            }

            if (!topicId) {
                if (i <= 10) console.warn(`   Row ${i} skipped: Unknown topic "${topicName}"`);
                continue;
            }

            try {
                await db.query(
                    `INSERT INTO questions (topic_id, type, difficulty, prompt, option_a, option_b, option_c, option_d, answer, explanation) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        topicId,
                        'mcq',
                        difficulty?.toLowerCase() || 'medium',
                        prompt,
                        optionA,
                        optionB,
                        optionC,
                        optionD,
                        answer,
                        explanation
                    ]
                );
                count++;
                if (count % 10 === 0) console.log(`Inserted ${count} questions...`);
            } catch (err) {
                console.error(`Error inserting row ${i}:`, err.message);
            }
        }

        console.log(`Seeding complete! Inserted ${count} questions.`);
        process.exit(0);

    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
