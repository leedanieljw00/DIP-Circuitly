// ==========================================
// HOW TO ADD NEW QUESTIONS
// ==========================================
// 1. Scroll down to "RAW_DATA".
// 2. Copy an existing line (everything between { and },).
// 3. Paste it on a new line.
// 4. Update the "topicId" to match the topic you want (see TOPICS list below).
//    - 1: Fundamentals
//    - 2: Energy Storage
//    - ... etc
// 5. Change the "question", "optionA", "optionB", "optionC", and "answer".
// 6. Save this file and reload index.html.

// MASTER DATA "SHEET"
// topicId must match the TOPICS list below.

const TOPICS = [
    { id: 1, name: "Fundamentals & Theorems" },
    { id: 2, name: "Energy Storage Elements" },
    { id: 3, name: "Transient & Steady-State" },
    { id: 4, name: "Ideal Op-Amps" },
    { id: 5, name: "Laplace Transforms" },
    { id: 6, name: "Network Functions" },
    { id: 7, name: "DC vs. AC" },
    { id: 8, name: "Three-Phase Circuits" }
];

const STORAGE_KEY = 'circuitly_data';

// Data Service
window.DataService = {
    questions: [], // In-memory store

    getTopics: () => TOPICS,

    // Initialize: Fetch CSV
    init: async () => {
        try {
            const response = await fetch('questions/QuestionBank.csv');
            if (!response.ok) throw new Error('Failed to load Question Bank CSV');
            const text = await response.text();
            window.DataService.questions = window.DataService.parseCSV(text);
            console.log(`Loaded ${window.DataService.questions.length} questions from CSV.`);
        } catch (e) {
            console.log("CSV load failed (likely local file:// protocol). Switching to embedded data fallback.");
            if (window.QuestionBankData) {
                window.DataService.questions = window.DataService.parseCSV(window.QuestionBankData);
                console.log(`Loaded ${window.DataService.questions.length} questions from Embedded Data.`);
            } else {
                // Fallback if even embedded data is missing
                window.DataService.questions = [
                    { id: 991, topicId: 1, question: "Critical Error: Data Missing.", optionA: "OK", optionB: "Retry", optionC: "Help", answer: "OK", explanation: "Please check QuestionBankData.js." }
                ];
            }
        }
    },

    // Simple CSV Parser
    parseCSV: (text) => {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());

        return lines.slice(1).map(line => {
            const values = [];
            let inQuote = false;
            let current = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"' && line[i + 1] === '"') { // Handle escaped double quotes ""
                    current += '"';
                    i++;
                } else if (char === '"') { // Toggle inQuote state
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) { // Split on comma outside quotes
                    values.push(current.trim());
                    current = '';
                } else { // Add character to current value
                    current += char;
                }
            }
            values.push(current.trim()); // Add the last value

            const row = {};
            headers.forEach((h, i) => {
                let val = values[i] || '';
                // Remove leading/trailing quotes if present
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.slice(1, -1);
                }
                row[h] = val;
            });

            // Map types and structure
            return {
                id: Number(row.id),
                topicId: Number(row.topicId),
                question: row.question,
                optionA: row.optionA,
                optionB: row.optionB,
                optionC: row.optionC,
                answer: row.answer,
                image: row.image || null, // Assuming 'image' column exists or defaults to null
                explanation: row.explanation || null // Assuming 'explanation' column exists or defaults to null
            };
        });
    },

    getQuestions: (topicId) => {
        // Helper to shuffle array (Fisher-Yates)
        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        let qs = window.DataService.questions;

        // Filter by topic
        let questions = qs.filter(q => q.topicId === Number(topicId));

        // Shuffle ALL available questions first
        shuffle(questions);

        // Map to standard format
        // NOTE: We map BEFORE limiting count if we want to process all, 
        // OR we can slice first then map to save perf.
        // Let's slice first to be efficient, but we need to map after?
        // Wait, the map logic below uses the `row` from the filtered `qs`.
        // Let's shuffle `questions` (which are raw rows) then slice.

        const MAX_QUESTIONS = 15;

        // If Three-Phase Topic (8), ensure 30% Theory (Static) and 70% Circuits (Generated)
        if (Number(topicId) === 8 && window.ThreePhaseCircuitGenerator) {
            // Already handled below with specific logic, 
            // but we need to ensure the BASE questions are mapped correctly.
            // Let's refactor slightly to be cleaner.

            // 1. Get Theory Questions (Static)
            // 'questions' is currently ALL static questions for this topic (shuffled).

            // Map them to standardized format
            let standardizedQs = questions.map(row => ({
                id: row.id,
                prompt: row.question,
                options: [row.optionA, row.optionB, row.optionC],
                correctAnswer: row.answer,
                image: row.image || null,
                explanation: row.explanation || null
            }));

            // Limit theory part to 30% of Target (approx 5)
            const theoryCount = Math.round(MAX_QUESTIONS * 0.3);
            if (standardizedQs.length > theoryCount) {
                standardizedQs = standardizedQs.slice(0, theoryCount);
            }

            // 2. Fill rest with Generated
            const needed = Math.max(0, MAX_QUESTIONS - standardizedQs.length);

            // Track prompts to ensure uniqueness in this session
            const existingPrompts = new Set(standardizedQs.map(q => q.prompt));

            for (let i = 0; i < needed; i++) {
                let attempts = 0;
                let newQ = null;

                // Retry generation up to 5 times if duplicate prompt found
                do {
                    newQ = window.ThreePhaseCircuitGenerator.generate();
                    attempts++;
                } while (existingPrompts.has(newQ.prompt) && attempts < 5);

                if (newQ) {
                    standardizedQs.push(newQ);
                    existingPrompts.add(newQ.prompt);
                }
            }

            return shuffle(standardizedQs); // Reshuffle to mix theory and generated

        } else {
            // Standard Topics
            // Limit to MAX_QUESTIONS
            if (questions.length > MAX_QUESTIONS) {
                questions = questions.slice(0, MAX_QUESTIONS);
            }

            // Map to standard format
            return questions.map(row => ({
                id: row.id,
                prompt: row.question,
                options: [row.optionA, row.optionB, row.optionC],
                correctAnswer: row.answer,
                image: row.image || null,
                explanation: row.explanation || null
            }));
        }
    },

    // Adaptive Helpers
    getTheoryQuestion: (topicId) => {
        let theoryQs = [];
        if (window.DataService.questions) {
            theoryQs = window.DataService.questions.filter(d => d.topicId === Number(topicId));
        }

        if (theoryQs.length === 0) return null;

        const row = theoryQs[Math.floor(Math.random() * theoryQs.length)];
        return {
            id: row.id,
            prompt: row.question,
            options: [row.optionA, row.optionB, row.optionC],
            correctAnswer: row.answer,
            image: null,
            explanation: row.explanation
        };
    },

    getCircuitQuestion: (topicId) => {
        if (Number(topicId) === 8 && window.ThreePhaseCircuitGenerator) {
            return window.ThreePhaseCircuitGenerator.generate();
        }
        return null;
    },

    importCSV: (csvText) => {
        try {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            const results = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                // Simple regex to handle commas inside quotes would be better, 
                // but for simple Excel CSV export this split is standard for browser-based simple tools.
                // Assuming standard CSV without escaped commas for this MVP.
                const currentline = lines[i].split(',');

                if (currentline.length < 9) continue; // Updated to expect 9 columns (0-8)

                const obj = {};
                obj.id = currentline[0].trim();
                obj.topicId = Number(currentline[1].trim());
                obj.question = currentline[2].trim();
                obj.optionA = currentline[3].trim();
                obj.optionB = currentline[4].trim();
                obj.optionC = currentline[5].trim();
                obj.answer = currentline[6].trim();
                // Column 8 is image (index 7)
                if (currentline[7] && currentline[7].trim() !== '') {
                    obj.image = currentline[7].trim();
                } else {
                    obj.image = null;
                }
                // Column 9 is explanation (index 8)
                if (currentline[8] && currentline[8].trim() !== '') {
                    obj.explanation = currentline[8].trim();
                } else {
                    obj.explanation = null;
                }

                results.push(obj);
            }

            if (results.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
                return { success: true, count: results.length };
            } else {
                return { success: false, error: "No valid rows found" };
            }
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    resetToDefault: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
