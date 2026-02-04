const fs = require('fs');

const file = 'f:/DIP - Copy/scratch/lingo_quest/questions/QuestionBank.csv';

try {
    const data = fs.readFileSync(file, 'utf8');
    const lines = data.split('\n').filter(l => l.trim().length > 0);

    console.log(`Total lines: ${lines.length}`);

    lines.forEach((line, index) => {
        // Simple parser logic mirrored from DataService
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

        // Expected columns: id, topicId, question, A, B, C, Ans, Exp (8 columns)
        // Some might have Images? The header says: id,topicId,question,optionA,optionB,optionC,answer,explanation
        // So 8 columns.

        if (values.length !== 8) {
            console.log(`[Line ${index + 1}] Has ${values.length} columns instead of 8.`);
            console.log(`Content: ${line}`);
        }
    });

    console.log('Validation complete.');

} catch (e) {
    console.error(e);
}
