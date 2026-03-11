const fs = require('fs');

function parseCSVLine(line) {
    const values = [];
    let inQuote = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

function stringifyCSVLine(row) {
    return row.map(val => {
        if (val.includes(',') || val.includes('"')) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    }).join(',');
}

function processFile(filePath, isJs = false) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];

    let startIdx = 1;

    if (isJs) {
        newLines.push('window.QuestionBankData = `id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty');
    } else {
        newLines.push('id,topicId,question,optionA,optionB,optionC,answer,image,explanation,difficulty');
    }

    const topicItems = {};

    // First pass to group by topic
    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim() || line.trim() === '`;') continue;

        const row = parseCSVLine(line);
        const topicId = Number(row[1]);

        if (!topicItems[topicId]) {
            topicItems[topicId] = [];
        }
        topicItems[topicId].push({ originalLine: i, row: row });
    }

    const difficulties = {};

    // Assign difficulties
    for (const [topicId, items] of Object.entries(topicItems)) {
        const n = items.length;
        const chunk = Math.floor(n / 3);

        items.forEach((item, idx) => {
            let diff = 1;
            if (n >= 3) {
                if (idx < chunk) diff = 1;
                else if (idx < 2 * chunk) diff = 2;
                else diff = 3;
            }
            difficulties[item.originalLine] = diff;
        });
    }

    // Second pass to construct the new file
    for (let i = startIdx; i < lines.length; i++) {
        let line = lines[i];
        if (!line.trim()) {
            newLines.push(line);
            continue;
        }
        if (line.trim() === '`;') {
            newLines.push(line);
            continue;
        }

        const row = parseCSVLine(line);

        let newRow = row;

        // Ensure there are at least 8 elements (0 to 7) before difficulty format
        // The original format could be just 8 items (0-7): id,topicId,question,optionA,optionB,optionC,answer,explanation
        // Let's systematically reconstruct it as:
        // 0: id
        // 1: topicId
        // 2: question
        // 3: optionA
        // 4: optionB
        // 5: optionC
        // 6: answer
        // 7: image (new)
        // 8: explanation (was at 7)
        // 9: difficulty

        const id = row[0];
        const tId = row[1];
        const q = row[2];
        const oa = row[3];
        const ob = row[4];
        const oc = row[5];
        const ans = row[6];

        // determine if row[7] is image or explanation natively 
        // older version had explanation at [7], no image.
        // Let's safely inject empty image
        const img = '';
        const explanation = row[7] || '';
        const diff = difficulties[i] || 1;

        newRow = [id, tId, q, oa, ob, oc, ans, img, explanation, String(diff)];

        newLines.push(stringifyCSVLine(newRow));
    }

    // Write out
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

const csvPath = 'questions/QuestionBank.csv';
const jsPath = 'js/services/QuestionBankData.js';

console.log("Processing files with Node...");
try {
    processFile(csvPath, false);
    processFile(jsPath, true);
    console.log("Done!");
} catch (e) {
    console.error(e);
}
