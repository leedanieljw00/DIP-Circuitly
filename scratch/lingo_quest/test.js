const fs = require('fs');
const jsFIle = fs.readFileSync('C:/Users/rog/OneDrive/Desktop/Circuitly/scratch/lingo_quest/js/services/DataService.js', 'utf8');
const dataJs = fs.readFileSync('C:/Users/rog/OneDrive/Desktop/Circuitly/scratch/lingo_quest/js/services/QuestionBankData.js', 'utf8');

global.window = {};
eval(jsFIle);
eval(dataJs);

try {
    const qs = window.DataService.parseCSV(window.QuestionBankData);
    console.log(`Parsed ${qs.length} questions.`);
    const filtered = qs.filter(q => q.topicId === 1);
    console.log(`Topic 1 has ${filtered.length} questions`);
} catch(e) {
    console.log("ERROR:");
    console.log(e);
}
