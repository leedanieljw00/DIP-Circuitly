const db = require('../backend/config/db');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

function parseNull(val) {
    if (val === undefined || val === null) return null;
    const str = val.toString().trim();
    if (str === 'NULL' || str === '') return null;
    return str;
}

async function seed() {
    try {
        const csvPath = path.join(__dirname, '../database/questions.csv');
        const workbook = new ExcelJS.Workbook();
        const worksheet = await workbook.csv.readFile(csvPath);

        console.log("Truncating table...");
        await db.query('TRUNCATE TABLE questions RESTART IDENTITY');

        let count = 0;

        // Find column indices based on header row (row 1)
        const headerRow = worksheet.getRow(1);
        const headers = headerRow.values.slice(1);

        const colIdx = {};
        headers.forEach((h, i) => {
            colIdx[h.trim()] = i + 1; // 1-based index
        });

        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);

            // Extract values using determined column indices
            const topic_id = parseNull(row.getCell(colIdx['topic_id']).value);
            let difficulty = parseNull(row.getCell(colIdx['difficulty']).value);
            const prompt = parseNull(row.getCell(colIdx['prompt']).value);
            const option_a = parseNull(row.getCell(colIdx['option_a']).value);
            const option_b = parseNull(row.getCell(colIdx['option_b']).value);
            const option_c = parseNull(row.getCell(colIdx['option_c']).value);
            const option_d = parseNull(row.getCell(colIdx['option_d']).value);
            const answer = parseNull(row.getCell(colIdx['answer']).value);
            const image_url = parseNull(row.getCell(colIdx['image_url']).value);
            const explanation = parseNull(row.getCell(colIdx['explanation']).value);
            let type = parseNull(row.getCell(colIdx['type']).value);

            if (!prompt || !topic_id) continue;

            if (!difficulty) difficulty = 'medium';
            if (!type) type = 'mcq';

            try {
                await db.query(
                    `INSERT INTO questions (topic_id, type, difficulty, prompt, option_a, option_b, option_c, option_d, answer, image_url, explanation) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [topic_id, type, difficulty, prompt, option_a, option_b, option_c, option_d, answer, image_url, explanation]
                );
                count++;
            } catch (err) {
                console.error(`Error inserting Row ${i}: ${err.message}`);
                console.error(prompt, topic_id);
            }
        }

        console.log(`Seeding complete! ${count} questions inserted from CSV.`);
        process.exit(0);

    } catch (err) {
        console.error("Fatal Error:", err);
        process.exit(1);
    }
}

seed();
