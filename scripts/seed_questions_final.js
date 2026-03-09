const db = require('../backend/config/db');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

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

const manualMapping = {
    'W1': 1, 'W2': 2, 'W3': 3, 'W4': 4, 'W5': 5, 'W6': 6, 'W7': 7, 'W8': 8,
    'Basic Laws': 1, 'Fundamentals': 1, 'Theorems': 1, 'Nodal & Mesh': 1,
    'Energy Storage': 2, 'Energy Storage Elements': 2, 'Capacitors': 2, 'Inductors': 2,
    'Transient': 3, 'Step Response': 3, 'Steady State': 3, 'Transient & Steady-State': 3, 'Transient and steady-state responses': 3,
    'Op-Amps': 4, 'Ideal Op-Amps': 4,
    'Laplace': 5, 'Laplace Transforms': 5,
    'Network Functions': 6,
    'DC vs AC': 7, 'DC vs. AC': 7, 'Phasors': 7, 'AC Steady State': 7,
    'Three Phase': 8, 'Three-Phase': 8, 'Three-Phase Circuits': 8
};

const diffMap = {
    'very easy': 'easy',
    'easy': 'easy',
    'moderate': 'medium',
    'medium': 'medium',
    'hard': 'hard',
    'very hard': 'hard'
};

async function seed() {
    try {
        const bankPath = path.join(__dirname, '../database/EE DIP QUESTION BANK.xlsx');
        const infoPath = path.join(__dirname, '../database/Info.xlsx');

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(bankPath);
        const qSheet = workbook.getWorksheet(1);

        const infoWorkbook = new ExcelJS.Workbook();
        await infoWorkbook.xlsx.readFile(infoPath);
        const infoSheet = infoWorkbook.getWorksheet(1);

        const topicMap = {};
        for (let i = 2; i <= infoSheet.rowCount; i++) {
            const row = infoSheet.getRow(i);
            const id = getVal(row.getCell(1).value);
            const name = getVal(row.getCell(2).value);
            if (id && name && !isNaN(id)) {
                topicMap[name] = parseInt(id);
            }
        }

        console.log("Truncating table...");
        await db.query('TRUNCATE TABLE questions RESTART IDENTITY');

        let count = 0;
        console.log(`Processing ${qSheet.rowCount} rows...`);

        for (let i = 2; i <= qSheet.rowCount; i++) {
            const row = qSheet.getRow(i);
            const vals = row.values;
            if (!vals || vals.length < 3) continue;

            let topicName, prompt, a, b, c, d, answer, difficulty, explanation;

            // Strategy: Check if it looks like a question row
            // Correct row has Correct Answer in Col 7 or Col 8
            const col1 = getVal(vals[1]);
            const col2 = getVal(vals[2]);
            const col7 = getVal(vals[7]);
            const col8 = getVal(vals[8]);

            if (col1 && col1.includes('W') && col7 && col7.length === 1) {
                // Topic 1 style
                topicName = col1;
                prompt = col2;
                a = getVal(vals[3]);
                b = getVal(vals[4]);
                c = getVal(vals[5]);
                d = getVal(vals[6]);
                answer = col7;
                explanation = getVal(vals[8]);
            } else if (col1 && col1.length > 5 && col7 && col7.length === 1) {
                // Topic 2+ style
                topicName = col1;
                prompt = col2;
                a = getVal(vals[3]);
                b = getVal(vals[4]);
                c = getVal(vals[5]);
                d = getVal(vals[6]);
                answer = col7;
            } else if (col2 && col2.length > 5 && col8 && col8.length === 1) {
                // Shifted?
                topicName = col1;
                prompt = col2;
                a = getVal(vals[3]);
                b = getVal(vals[4]);
                c = getVal(vals[5]);
                d = getVal(vals[6]);
                answer = col8;
            }

            if (!prompt || !answer || answer.length > 1) continue;

            // Heuristic Difficulty
            difficulty = 'medium';
            const lowerTopic = topicName.toLowerCase();
            if (lowerTopic.includes('veryeasy')) difficulty = 'easy';
            else if (lowerTopic.includes('easy')) difficulty = 'easy';
            else if (lowerTopic.includes('moderate')) difficulty = 'medium';
            else if (lowerTopic.includes('medium')) difficulty = 'medium';
            else if (lowerTopic.includes('hard')) difficulty = 'hard';
            else if (lowerTopic.includes('veryhard')) difficulty = 'hard';

            let topicId = null;
            const combinedMapping = { ...topicMap, ...manualMapping };

            // Try specific prefix match first
            const match = topicName.match(/W(\d)/i);
            if (match) {
                topicId = parseInt(match[1]);
            } else {
                // Fuzzy match
                for (const [key, id] of Object.entries(combinedMapping)) {
                    if (topicName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(topicName.toLowerCase())) {
                        topicId = id;
                        break;
                    }
                }
            }

            if (!topicId) continue;

            try {
                await db.query(
                    `INSERT INTO questions (topic_id, type, difficulty, prompt, option_a, option_b, option_c, option_d, answer, explanation) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [topicId, 'mcq', difficulty, prompt, a, b, c, d, answer.toLowerCase(), explanation]
                );
                count++;
                if (count % 100 === 0) console.log(`Inserted ${count}...`);
            } catch (err) {
                // console.error(`Error Row ${i}:`, err.message);
            }
        }

        console.log(`Seeding complete! ${count} questions inserted.`);
        process.exit(0);

    } catch (err) {
        console.error("Fatal Error:", err);
        process.exit(1);
    }
}

seed();
