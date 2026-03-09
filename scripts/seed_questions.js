const db = require('../backend/config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seed() {
    const filePath = path.join(__dirname, '../frontend/js/services/QuestionBankData.js');
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract the content between the first and last backtick
    const startIdx = content.indexOf('`');
    const endIdx = content.lastIndexOf('`');

    if (startIdx === -1 || endIdx === -1) {
        console.error("Could not find data in QuestionBankData.js");
        process.exit(1);
    }

    const dataString = content.substring(startIdx + 1, endIdx);
    const lines = dataString.trim().split('\n').slice(1); // Skip header

    console.log("Starting seeding of " + lines.length + " questions...");

    for (const line of lines) {
        if (!line.trim()) continue;

        // Split by comma but ignore commas inside quotes
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length < 8) {
            console.warn("Skipping malformed line: " + line);
            continue;
        }

        const [id, topicId, prompt, a, b, c, ans, exp] = parts.map(s =>
            s.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
        );

        try {
            await db.query(
                'INSERT INTO questions (topic_id, prompt, option_a, option_b, option_c, answer, explanation) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [parseInt(topicId), prompt, a, b, c, ans, exp]
            );
        } catch (err) {
            console.error("Failed to insert question " + id + ": " + err.message);
        }
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed();
