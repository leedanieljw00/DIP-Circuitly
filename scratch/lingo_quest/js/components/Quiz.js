window.Quiz = function ({ topicId, onComplete, onExit }) {
    const questions = window.DataService.getQuestions(topicId);
    let currentIndex = 0;
    let score = 0;

    // Adaptive State
    const adaptiveStats = {
        mode: 'NORMAL',
        wrongCount: 0,
        recoveryCount: 0
    };

    const container = document.createElement('div');
    container.className = 'dashboard-container animate-slide-in';
    container.style.maxWidth = '800px'; // Limit width for centering
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100vh'; // Full height for vertical centering effect
    container.style.justifyContent = 'center';

    // Back Button (Top Left)
    const headerRow = document.createElement('div');
    headerRow.style.width = '100%';
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.alignItems = 'center';
    headerRow.style.marginBottom = '20px';

    const backBtn = document.createElement('button');
    backBtn.innerHTML = '&#8592; Exit';
    backBtn.className = 'btn btn-secondary';
    backBtn.style.padding = '8px 16px';
    backBtn.style.fontSize = '0.9rem';
    backBtn.onclick = () => {
        if (confirm('Exit quiz? Progress will be lost.')) {
            onExit();
        }
    };
    headerRow.appendChild(backBtn);

    // Score/Progress Text
    const progressText = document.createElement('div');
    progressText.className = 'text-gradient';
    progressText.style.fontWeight = '700';
    progressText.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
    headerRow.appendChild(progressText);

    container.appendChild(headerRow);

    // Main Quiz Card
    const quizCard = document.createElement('div');
    quizCard.className = 'card-glass';
    quizCard.style.padding = '40px';
    quizCard.style.display = 'flex';
    quizCard.style.flexDirection = 'column';
    quizCard.style.gap = '24px';
    container.appendChild(quizCard);

    // Progress Bar
    const rail = document.createElement('div');
    rail.className = 'progress-rail';
    rail.style.marginBottom = '10px';

    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = '0%';
    fill.style.transition = 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

    rail.appendChild(fill);
    quizCard.appendChild(rail);

    // Question Text
    const questionText = document.createElement('h2');
    questionText.style.textAlign = 'center';
    questionText.style.fontSize = '1.8rem';
    questionText.style.marginBottom = '10px';
    questionText.style.lineHeight = '1.4';
    quizCard.appendChild(questionText);

    // Image Area
    const questionImage = document.createElement('img');
    questionImage.style.maxWidth = '100%';
    questionImage.style.maxHeight = '300px';
    questionImage.style.borderRadius = 'var(--border-radius)';
    questionImage.style.alignSelf = 'center';
    questionImage.style.display = 'none';
    questionImage.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
    quizCard.appendChild(questionImage);

    // Options Area
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'grid';
    optionsContainer.style.gap = '16px';
    quizCard.appendChild(optionsContainer);

    // Check Button
    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'CHECK ANSWER';
    checkBtn.style.marginTop = '20px';
    checkBtn.style.width = '100%';
    checkBtn.style.padding = '18px';
    checkBtn.style.fontSize = '1.1rem';
    quizCard.appendChild(checkBtn);

    // Feedback Overlay (Glass style)
    const feedbackOverlay = document.createElement('div');
    feedbackOverlay.style.position = 'fixed';
    feedbackOverlay.style.bottom = '0';
    feedbackOverlay.style.left = '0';
    feedbackOverlay.style.right = '0';
    feedbackOverlay.style.padding = '32px';
    feedbackOverlay.style.background = 'rgba(15, 23, 42, 0.95)';
    feedbackOverlay.style.backdropFilter = 'blur(16px)';
    feedbackOverlay.style.borderTop = '1px solid rgba(255,255,255,0.1)';
    feedbackOverlay.style.transform = 'translateY(100%)';
    feedbackOverlay.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    feedbackOverlay.style.zIndex = '100';
    feedbackOverlay.style.display = 'flex';
    feedbackOverlay.style.flexDirection = 'column';
    feedbackOverlay.style.alignItems = 'center';
    feedbackOverlay.style.gap = '16px';
    document.body.appendChild(feedbackOverlay);

    let selectedOption = null;
    let isAnswered = false;
    const incorrectResponses = [];

    function renderQuestion() {
        if (currentIndex >= questions.length) {
            feedbackOverlay.remove();
            if (incorrectResponses.length > 0) {
                renderReviewScreen();
            } else {
                onComplete(score);
            }
            return;
        }

        const q = questions[currentIndex];
        questionText.innerHTML = q.prompt;

        // Image
        if (q.image) {
            const src = (q.image.startsWith('data:') || q.image.startsWith('http'))
                ? q.image
                : `assets/images/${q.image}`;
            questionImage.src = src;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        // Progress
        const p = (currentIndex / questions.length) * 100;
        fill.style.width = `${p}%`;
        progressText.textContent = `Question ${currentIndex + 1} / ${questions.length}`;

        // Options
        optionsContainer.innerHTML = '';
        selectedOption = null;
        isAnswered = false;

        // Reset UI
        feedbackOverlay.style.transform = 'translateY(100%)';
        checkBtn.textContent = 'CHECK ANSWER';
        checkBtn.disabled = true;
        checkBtn.style.opacity = '0.5';

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary'; // Base style
            btn.innerHTML = opt;
            btn.style.justifyContent = 'flex-start'; // Align text left
            btn.style.textAlign = 'left';
            btn.style.width = '100%';

            btn.onclick = () => {
                if (isAnswered) return;

                // Reset styling
                Array.from(optionsContainer.children).forEach(c => {
                    c.style.borderColor = 'rgba(255,255,255,0.1)';
                    c.style.background = 'rgba(255,255,255,0.05)';
                    c.style.boxShadow = 'none';
                });

                // Active styling
                btn.style.borderColor = 'var(--primary)';
                btn.style.background = 'rgba(59, 130, 246, 0.15)';
                btn.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.2)';

                selectedOption = opt;
                checkBtn.disabled = false;
                checkBtn.style.opacity = '1';
            };
            optionsContainer.appendChild(btn);
        });
    }

    // Review Screen Logic (Kept mostly logic-same, just styled)
    function renderReviewScreen() {
        container.innerHTML = '';
        container.style.height = 'auto';
        container.style.paddingTop = '40px';
        container.style.justifyContent = 'flex-start';

        const title = document.createElement('h1');
        title.className = 'brand-title';
        title.style.fontSize = '2.5rem';
        title.style.textAlign = 'center';
        title.textContent = 'Session Review';
        container.appendChild(title);

        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '24px';
        list.style.width = '100%';
        list.style.maxWidth = '800px';
        list.style.margin = '0 auto';

        incorrectResponses.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'card-glass';

            let imgHTML = '';
            if (item.image) {
                const src = (item.image.startsWith('data:') || item.image.startsWith('http'))
                    ? item.image
                    : `assets/images/${item.image}`;
                imgHTML = `<img src="${src}" style="max-width:100%; max-height:200px; border-radius:8px; margin-bottom:16px; display:block;">`;
            }

            card.innerHTML = `
                <div style="font-weight:700; margin-bottom:12px; color:var(--text-main); font-size:1.1rem;">${idx + 1}. ${item.question}</div>
                ${imgHTML}
                <div style="margin-bottom:8px; color:var(--error);">Your Answer: ${item.userAnswer}</div>
                <div style="margin-bottom:16px; color:var(--accent);">Correct Answer: ${item.correctAnswer}</div>
                <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:8px; font-size:0.9rem; line-height:1.5; color:var(--text-muted);">
                    <strong>Explanation:</strong> ${item.explanation || "No explanation provided."}
                </div>
            `;
            list.appendChild(card);
        });
        container.appendChild(list);

        const finishBtn = document.createElement('button');
        finishBtn.className = 'btn btn-primary';
        finishBtn.textContent = 'RETURN TO DASHBOARD';
        finishBtn.style.margin = '40px auto';
        finishBtn.style.width = '100%';
        finishBtn.style.maxWidth = '300px';
        finishBtn.onclick = () => onComplete(score);
        container.appendChild(finishBtn);
    }

    checkBtn.onclick = () => {
        if (!isAnswered && selectedOption) {
            const q = questions[currentIndex];
            isAnswered = true;

            // Logic identical to before
            const isCorrect = (selectedOption === q.correctAnswer);

            feedbackOverlay.innerHTML = '';

            if (isCorrect) {
                score += 10;
                // Adaptive Logic
                if (Number(topicId) === 8 && adaptiveStats.mode === 'THEORY') {
                    adaptiveStats.recoveryCount++;
                }

                feedbackOverlay.style.borderTopColor = 'var(--accent)';
                feedbackOverlay.innerHTML = `
                    <h2 style="color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin:0;">Correct!</h2>
                    <button class="btn btn-primary" id="next-btn" style="min-width:200px;">CONTINUE</button>
                `;
            } else {
                if (Number(topicId) === 8) adaptiveStats.wrongCount++;

                incorrectResponses.push({
                    question: q.prompt,
                    image: q.image,
                    userAnswer: selectedOption,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                });

                feedbackOverlay.style.borderTopColor = 'var(--error)';
                feedbackOverlay.innerHTML = `
                    <h2 style="color:var(--error); text-transform:uppercase; letter-spacing:1px; margin:0;">Incorrect</h2>
                    <p style="color:var(--text-main); margin-bottom:10px;">Correct Answer: <strong>${q.correctAnswer}</strong></p>
                    ${q.explanation ? `<div style="max-width:600px; text-align:center; color:var(--text-muted); font-size:0.9rem;">${q.explanation}</div>` : ''}
                    <button class="btn btn-secondary" id="next-btn" style="min-width:200px; margin-top:12px; border-color:var(--error); color:var(--error);">GOT IT</button>
                `;
            }

            // Adaptive Transitions
            if (Number(topicId) === 8) {
                if (adaptiveStats.mode !== 'THEORY' && adaptiveStats.wrongCount >= 2) {
                    adaptiveStats.mode = 'THEORY';
                    adaptiveStats.recoveryCount = 0;
                    for (let i = currentIndex + 1; i < questions.length; i++) {
                        const newQ = window.DataService.getTheoryQuestion(topicId);
                        if (newQ) questions[i] = newQ;
                    }
                } else if (adaptiveStats.mode === 'THEORY' && adaptiveStats.recoveryCount >= 3) {
                    adaptiveStats.mode = 'CIRCUIT';
                    adaptiveStats.wrongCount = 0;
                    for (let i = currentIndex + 1; i < questions.length; i++) {
                        const newQ = window.DataService.getCircuitQuestion(topicId);
                        if (newQ) questions[i] = newQ;
                    }
                }
            }

            // Append button handler
            feedbackOverlay.querySelector('#next-btn').onclick = () => {
                currentIndex++;
                renderQuestion();
            };

            feedbackOverlay.style.transform = 'translateY(0)';
        }
    };

    renderQuestion();
    return container;
};
