const ExcelJS = require('exceljs');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const MCQ_BANK_PATH = path.join(__dirname, '../../database/EE DIP QUESTION BANK.xlsx');

const PRIMARY_TOPIC_MAP = {
    'Basic Laws': 1,
    'Energy Storage Elements': 2,
    'Transient and steady-state responses': 3,
    'Basic (Opamp)': 4,
    'Intermediate (Opamp)': 4,
    '5. Circuit analysis using Laplace transforms': 5,
    'NetworkFunctions': 6,
    'TwoPortNetwork': 6
};

const GENERIC_TOPICS = ['Fundamental questions', 'simple', 'intermediate'];

async function importQuestions() {
    console.log('Starting question import...');
    const client = await dbPool.connect();

    try {
        console.log('Clearing old questions...');
        await client.query('DELETE FROM questions');

        console.log('Importing MCQs from EE DIP QUESTION BANK.xlsx...');
        const mcqWorkbook = new ExcelJS.Workbook();
        await mcqWorkbook.xlsx.readFile(MCQ_BANK_PATH);
        const mcqSheet = mcqWorkbook.worksheets[0];

        let mcqCount = 0;
        let currentTopicId = 1;

        for (let i = 2; i <= mcqSheet.rowCount; i++) {
            const row = mcqSheet.getRow(i);
            const stageContent = row.getCell(1).value?.toString().trim();
            const prompt = row.getCell(2).value?.toString().trim();

            // 1. Update currentTopicId
            if (stageContent) {
                if (PRIMARY_TOPIC_MAP[stageContent]) {
                    currentTopicId = PRIMARY_TOPIC_MAP[stageContent];
                    console.log(`Topic Header: ${stageContent} -> Topic ${currentTopicId}`);
                } else if (stageContent.startsWith('DCvsAC')) {
                    currentTopicId = 7;
                } else if (GENERIC_TOPICS.includes(stageContent) && !prompt) {
                    // Only switch to 1 on generic header if not already in a specific topic
                    if (currentTopicId > 1 && currentTopicId < 7) {
                        // Stay in current topic (e.g. Laplace or Opamp)
                    } else {
                        currentTopicId = 1;
                    }
                }
            }

            // 2. Extract queston data
            if (!prompt || prompt.length < 5) continue; // Skip header rows

            const optA = row.getCell(3).value?.toString().trim() || '';
            const optB = row.getCell(4).value?.toString().trim() || '';
            const optC = row.getCell(5).value?.toString().trim() || '';
            const optD = row.getCell(6).value?.toString().trim() || '';

            const correctLetter = row.getCell(7).value?.toString().toLowerCase().trim();
            let answer = '';
            if (correctLetter === 'a') answer = optA;
            else if (correctLetter === 'b') answer = optB;
            else if (correctLetter === 'c') answer = optC;
            else if (correctLetter === 'd') answer = optD;
            else answer = optA; // Fallback

            const imageCell = row.getCell(8).value;
            let imageUrl = null;
            if (imageCell) {
                if (typeof imageCell === 'object' && imageCell.text) imageUrl = imageCell.text;
                else imageUrl = imageCell.toString();
            }

            await client.query(
                'INSERT INTO questions (topic_id, type, prompt, option_a, option_b, option_c, option_d, answer, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [currentTopicId, 'mcq', prompt, optA, optB, optC, optD, answer, imageUrl]
            );
            mcqCount++;
        }
        console.log(`Imported ${mcqCount} MCQs successfully.`);

    } catch (err) {
        console.error('Import failed:', err);
    } finally {
        client.release();
        await dbPool.end();
        console.log('Database connection closed.');
    }
}

importQuestions();
