window.UnfamiliarConceptsModule = function ({ onExit }) {
    const profile = window.ProfileService.getActiveProfile();
    const unfamiliarPool = profile ? (profile.unfamiliarPool || []) : [];
    const topics = window.DataService.getTopics();

    const container = document.createElement('div');
    container.className = 'dashboard-container animate-slide-in';
    container.style.maxWidth = '1000px';

    // Header
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.alignItems = 'center';
    headerRow.style.marginBottom = '30px';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.innerHTML = '&#8592; Back to Dashboard';
    backBtn.onclick = () => onExit();
    headerRow.appendChild(backBtn);

    const title = document.createElement('h1');
    title.className = 'brand-title';
    title.style.fontSize = '2rem';
    title.textContent = ''; // Removed 'Unfamiliar Concepts' as requested
    headerRow.appendChild(title);

    container.appendChild(headerRow);

    if (unfamiliarPool.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.padding = '40px';
        emptyMsg.textContent = "You don't have any unfamiliar concepts logged yet. Keep practicing!";
        container.appendChild(emptyMsg);
        return container;
    }

    // Group by topic
    const grouped = {};
    unfamiliarPool.forEach(item => {
        if (!grouped[item.topicId]) grouped[item.topicId] = [];
        grouped[item.topicId].push(item);
    });

    // Helper to format math text outside of Quiz.js
    function formatMathText(text) {
        if (!text) return "";

        const hasCustomDelimiters = text.includes('$') || text.includes('\\(') || text.includes('\\[') || text.includes('$$');

        // Text replacements for symbols and formatting (do this before catching variables)
        text = text.replace(/\bInf\b/g, '\\(\\infty\\)');
        text = text.replace(/\b(?:Mega\s*Ohm|mega\s*ohm|MegaOhm|M\s*Ohm)\b/gi, '\\(\\text{M}\\Omega\\)');
        text = text.replace(/\b(?:kilo\s*ohm|kiloohm|k\s*Ohm)\b/gi, '\\(\\text{k}\\Omega\\)');
        text = text.replace(/\b(?:Ohm|ohm)s?\b/g, '\\(\\Omega\\)');
        text = text.replace(/([A-Za-z0-9_]+)\s*=\s*/g, '$1 = ');

        // Already contains delimiters? Skip auto-wrapping but keep for typesetting
        if (hasCustomDelimiters) return text;

        // Pattern 1: Exponents like 10^-9 or 2^3 or 10^6
        const exponentPattern = /(\d+\^\{-?\d+\}|\d+\^-?\d+)/g;
        text = text.replace(exponentPattern, '\\($1\\)');

        // Pattern 2: Scientific notation like 1.5x10^-3
        const scientificPattern = /(\d+\.?\d*\s*[x*×]\s*10\^\{-?\d+\}|\d+\.?\d*\s*[x*×]\s*10\^-?\d+)/gi;
        text = text.replace(scientificPattern, '\\($1\\)');

        // Pattern 3: Square Roots like sqrt(2) or sq(LC)
        const sqrtPattern = /\bsq(?:rt)?\(([^)]+)\)/g;
        text = text.replace(sqrtPattern, '\\(\\sqrt{$1}\\)');

        // Pattern 4: Circuit Subscripts (Vph, V_ph, R1, etc.)
        const underscorePattern = /\b([VvIiRLCZP])_([a-z0-9]+)\b/g;
        text = text.replace(underscorePattern, '\\($1_{$2}\\)');

        const digitPattern = /\b([VvIiRLCZP])(\d+)\b/g;
        text = text.replace(digitPattern, '\\($1_{$2}\\)');

        // Whitelist for common compound variables
        const whitelistPattern = /\b(Vph|Iph|Vrms|Irms|Vline|Iline|Vload|Iload|Vm|Im|Rth|Vth|Rn|In|Zth|Ztr)\b/g;
        text = text.replace(whitelistPattern, match => '\\(' + match[0] + '_{' + match.substring(1) + '}\\)');

        // Pattern 5: Fractions like A/B or ratio
        // Now handles previously wrapped expressions like \(V_{m}\)
        const fractionPattern = /((?:[\w\d()]+|\\\([\s\S]*?\\\))\s*)\/\s*((?:[\w\d()]+|\\\([\s\S]*?\\\))\s*)/g;
        text = text.replace(fractionPattern, (match, p1, p2) => {
            const clean1 = p1.replace(/\\\(/g, '').replace(/\\\)/g, '');
            const clean2 = p2.replace(/\\\(/g, '').replace(/\\\)/g, '');
            return '\\(\\frac{' + clean1.trim() + '}{' + clean2.trim() + '}\\)';
        });

        // Cleanup: merge adjacent math blocks separated by '*' to render as \cdot
        // Example: \(V_{m}\) * \(\sqrt{2}\) -> \(V_{m} \cdot \sqrt{2}\)
        text = text.replace(/\\\)\s*\*\s*\\\(/g, ' \\cdot ');

        return text;
    }

    // Dynamically derives a clean short title from any question string.
    // Future-proof: works automatically for any new questions added to the bank.
    function generateConceptTitle(question) {
        if (!question) return 'Concept';

        // Known acronyms — always kept uppercase
        const ACRONYMS = new Set([
            'KCL', 'KVL', 'RMS', 'DC', 'AC', 'RC', 'RL', 'LC', 'RLC', 'CMRR', 'PSRR', 'GBP',
            'SIL', 'ESR', 'EMI', 'NIC', 'THD', 'CT', 'PT', 'SRF', 'PF', 'BJT', 'MOSFET',
            'IC', 'PCB', 'ADC', 'DAC', 'PWM', 'FFT', 'ABCD', 'PRF', 'VCO', 'PLL', 'VCVS',
            'VCCS', 'CCVS', 'CCCS', 'OTA', 'NPN', 'PNP', 'IGBT', 'SCR', 'TRIAC'
        ]);

        let text = question.trim();

        // 1. Strip trailing colon (question is phrased as incomplete sentence)
        text = text.replace(/\s*:\s*$/, '');

        // 2. Strip trailing incomplete predicate: "have same", "is based on conservation of", etc.
        text = text.replace(
            /\s+(is|are|has|have|was|were|equals?|implies?|defined?\s*as|stands?\s*for|represents?|relates?\s*to|occurs?(?:\s+when)?|consists?\s*of|contains?|uses?|shows?|gives?|determines?|measured\s*in|found\s*(?:by|in|when)|provided\s*by|obtained\s*(?:by|from))(\s+\w+){0,4}\s*$/i,
            ''
        );

        // 3. Strip leading question/instruction words
        text = text.replace(
            /^(What|Which|Why|How|Where|When|Who|Identify|Calculate|Find|State|Explain|Define|Describe|Determine|Name|List|Give)\s+(is|are|does|do|the|a|an|can|will|was|were)?\s*/i,
            ''
        );

        // 4. Remove trailing question mark
        text = text.replace(/\?$/, '').trim();

        // 5. Remove leading quantity/article words that aren't part of the concept
        text = text.replace(/^(Two|Three|Four|Five|A|An|The)\s+(?=[A-Z])/i, '');

        // 6. If still > 5 words, trim at a natural preposition/conjunction boundary
        const words = text.split(/\s+/);
        if (words.length > 5) {
            const CUT = new Set(['of', 'for', 'in', 'on', 'at', 'to', 'with', 'and', 'or', 'that', 'when', 'if', 'by', 'from', 'between', 'among']);
            let cut = -1;
            for (let i = Math.min(words.length - 1, 5); i >= 2; i--) {
                if (CUT.has(words[i].toLowerCase())) { cut = i; break; }
            }
            text = (cut > 1 ? words.slice(0, cut) : words.slice(0, 5)).join(' ');
        }

        // 7. Title-case, preserving acronyms
        const LOWER_WORDS = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'nor', 'as', 'via']);
        text = text.split(/\s+/).map((word, i) => {
            const clean = word.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (ACRONYMS.has(clean)) return clean;
            if (i === 0 || !LOWER_WORDS.has(word.toLowerCase())) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            return word.toLowerCase();
        }).join(' ');

        return text || 'Concept';
    }

    Object.keys(grouped).forEach(topicId => {

        const topicIdNum = parseInt(topicId);
        const topic = topics.find(t => t.id === topicIdNum);

        const section = document.createElement('div');
        section.style.marginBottom = '40px';

        const sectionTitle = document.createElement('h2');
        sectionTitle.style.fontSize = '1.5rem';
        sectionTitle.style.marginBottom = '20px';
        sectionTitle.style.color = 'var(--text-main)';
        sectionTitle.style.borderBottom = '1px solid var(--surface-border)';
        sectionTitle.style.paddingBottom = '10px';
        sectionTitle.textContent = 'Module ' + topicId + ': ' + (topic ? topic.name : 'Unknown Topic');
        section.appendChild(sectionTitle);

        const grid = document.createElement('div');
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
        grid.style.gap = '16px';

        // Load all questions for this topic locally so we can match the saved ones
        // DataService.questions has all questions.
        const allQuestions = window.DataService.questions.filter(q => q.topicId === topicIdNum) || [];

        grouped[topicId].forEach(item => {
            const q = allQuestions.find(qObj => Number(qObj.id) === Number(item.id));
            if (!q) return;

            const card = document.createElement('div');
            card.className = 'card-glass';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.padding = '28px 32px';
            card.style.gap = '0';

            // ── Concept title
            const conceptTitle = document.createElement('div');
            conceptTitle.style.fontWeight = '700';
            conceptTitle.style.fontSize = '1.3rem';
            conceptTitle.style.marginBottom = '8px';
            conceptTitle.style.color = 'var(--text-main)';
            conceptTitle.style.lineHeight = '1.4';
            conceptTitle.textContent = generateConceptTitle(q.question);
            card.appendChild(conceptTitle);

            // ── Full question text
            const qText = document.createElement('div');
            qText.style.fontSize = '1rem';
            qText.style.color = 'var(--text-muted)';
            qText.style.marginBottom = '20px';
            qText.style.lineHeight = '1.6';
            qText.innerHTML = formatMathText(q.question);
            card.appendChild(qText);

            // ── Optional diagram image
            if (q.image) {
                const img = document.createElement('img');
                img.src = q.image.startsWith('http') || q.image.startsWith('data:') ? q.image : 'assets/images/' + q.image;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '200px';
                img.style.objectFit = 'contain';
                img.style.borderRadius = '10px';
                img.style.marginBottom = '20px';
                card.appendChild(img);
            }

            // ── Divider
            const divider = document.createElement('div');
            divider.style.height = '1px';
            divider.style.background = 'rgba(255,255,255,0.07)';
            divider.style.marginBottom = '20px';
            card.appendChild(divider);

            // ── Buttons (vertically stacked, full width)
            const btnStack = document.createElement('div');
            btnStack.style.display = 'flex';
            btnStack.style.flexDirection = 'column';
            btnStack.style.gap = '10px';

            if (q.pdfFile) {
                const reviewPage = q.pdfPage || 1;
                const reviewBtn = document.createElement('button');
                reviewBtn.className = 'btn btn-primary';
                reviewBtn.style.width = '100%';
                reviewBtn.style.padding = '14px';
                reviewBtn.style.fontSize = '1rem';
                reviewBtn.textContent = `📄 Open Lecture Notes · p.${reviewPage}`;
                reviewBtn.onclick = () => {
                    const page = q.pdfPage || 1;
                    let pdfPath = q.pdfFile;
                    if (!pdfPath.startsWith('http') && !pdfPath.startsWith('/') && !pdfPath.includes('/')) {
                        pdfPath = 'pdfs/' + pdfPath;
                    }
                    const parts = pdfPath.split('/');
                    parts[parts.length - 1] = encodeURIComponent(parts[parts.length - 1]);
                    window.open(parts.join('/') + '#page=' + page, '_blank');
                };
                btnStack.appendChild(reviewBtn);
            }

            // Search Online
            const conceptQuery = encodeURIComponent(generateConceptTitle(q.question) + ' circuit analysis explained');
            const searchBtn = document.createElement('button');
            searchBtn.className = q.pdfFile ? 'btn btn-secondary' : 'btn btn-primary';
            searchBtn.style.width = '100%';
            searchBtn.style.padding = '14px';
            searchBtn.style.fontSize = '1rem';
            searchBtn.innerHTML = '🔍 Search Online';
            searchBtn.onclick = () => window.open(`https://www.google.com/search?q=${conceptQuery}`, '_blank');
            btnStack.appendChild(searchBtn);

            card.appendChild(btnStack);

            // ── Remove (muted link below buttons)
            const removeWrap = document.createElement('div');
            removeWrap.style.marginTop = '14px';
            removeWrap.style.textAlign = 'right';

            const removeBtn = document.createElement('button');
            removeBtn.style.cssText = `
                background: none; border: none; cursor: pointer; padding: 4px 0;
                color: var(--text-muted); font-size: 0.85rem; opacity: 0.65;
                transition: opacity 0.2s;
            `;
            removeBtn.textContent = '✕ Remove from list';
            removeBtn.onmouseover = () => removeBtn.style.opacity = '1';
            removeBtn.onmouseout = () => removeBtn.style.opacity = '0.65';
            removeBtn.onclick = () => {
                const updatedPool = profile.unfamiliarPool.filter(p => p.id !== item.id);
                profile.unfamiliarPool = updatedPool;
                window.ProfileService.updateProgress(profile.studentId, { unfamiliarPool: updatedPool });
                card.remove();
                if (grid.children.length === 0) section.remove();
            };
            removeWrap.appendChild(removeBtn);
            card.appendChild(removeWrap);


            grid.appendChild(card);
        });

        if (grid.children.length > 0) {
            section.appendChild(grid);
            container.appendChild(section);
        }
    });

    setTimeout(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([container]).catch(err => console.error("MathJax Error:", err));
        }
    }, 50);

    return container;
};
