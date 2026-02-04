window.Quiz = function ({ topicId, onComplete, onExit }) {
    const questions = window.DataService.getQuestions(topicId);
    let currentIndex = 0;
    let score = 0;

    // Adaptive State
    const adaptiveStats = {
        mode: 'NORMAL', // 'NORMAL', 'THEORY', 'CIRCUIT'
        wrongCount: 0,    // Accumulated errors
        recoveryCount: 0  // Correct answers while in THEORY mode
    };

    const container = document.createElement('div');
    container.className = 'animate-slide-in';
    container.style.padding = '20px';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Header Row (Back Button)
    const headerRow = document.createElement('div');
    headerRow.style.width = '100%';
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'flex-start';
    headerRow.style.marginBottom = '12px';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← MENU';
    backBtn.className = 'btn';
    backBtn.style.padding = '8px 16px';
    backBtn.style.background = '#4b5563';
    backBtn.style.fontSize = '0.9rem';
    backBtn.onclick = () => {
        if (confirm('Exit quiz? Progress will be lost.')) {
            onExit();
        }
    };
    headerRow.appendChild(backBtn);
    container.appendChild(headerRow);

    // Progress Bar (Below Back Button)
    const progressContainer = document.createElement('div');
    progressContainer.style.background = '#374151';
    progressContainer.style.height = '12px';
    progressContainer.style.borderRadius = '6px';
    progressContainer.style.width = '100%';
    progressContainer.style.marginBottom = '8px';
    progressContainer.style.overflow = 'hidden';

    const progressBar = document.createElement('div');
    progressBar.style.background = 'var(--primary)';
    progressBar.style.height = '100%';
    progressBar.style.width = '0%';
    progressBar.style.transition = 'width 0.3s ease';
    progressContainer.appendChild(progressBar);
    container.appendChild(progressContainer);

    // Question Counter Text
    const counterText = document.createElement('div');
    counterText.style.width = '100%';
    counterText.style.textAlign = 'right';
    counterText.style.color = '#9ca3af';
    counterText.style.fontSize = '0.85rem';
    counterText.style.marginBottom = '24px';
    counterText.textContent = `Question 1 / ${questions.length}`;
    container.appendChild(counterText);

    // Question Area
    const questionContainer = document.createElement('div');
    questionContainer.style.display = 'flex';
    questionContainer.style.flexDirection = 'column';
    questionContainer.style.alignItems = 'center';
    questionContainer.style.gap = '16px';
    questionContainer.style.marginBottom = '32px';
    container.appendChild(questionContainer);

    const questionImage = document.createElement('img');
    questionImage.style.maxWidth = '100%';
    questionImage.style.maxHeight = '200px';
    questionImage.style.borderRadius = '12px';
    questionImage.style.display = 'none'; // Hidden by default
    questionImage.style.border = '2px solid #374151';
    questionContainer.appendChild(questionImage);

    const questionText = document.createElement('h2');
    questionText.style.textAlign = 'center';
    questionContainer.appendChild(questionText);

    // Options Area
    const optionsContainer = document.createElement('div');
    optionsContainer.style.flex = '1';
    container.appendChild(optionsContainer);

    // Footer / Action Area
    const footer = document.createElement('div');
    footer.style.marginTop = 'auto'; // Push to bottom
    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'CHECK';
    checkBtn.style.marginBottom = '0'; // Override for sticky feel
    footer.appendChild(checkBtn);
    container.appendChild(footer);

    // Feedback Overlay
    const feedbackOverlay = document.createElement('div');
    feedbackOverlay.style.position = 'fixed';
    feedbackOverlay.style.bottom = '0';
    feedbackOverlay.style.left = '0';
    feedbackOverlay.style.right = '0';
    feedbackOverlay.style.padding = '24px';
    feedbackOverlay.style.borderTopLeftRadius = '24px';
    feedbackOverlay.style.borderTopRightRadius = '24px';
    feedbackOverlay.style.transform = 'translateY(100%)';
    feedbackOverlay.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    feedbackOverlay.style.zIndex = '100';
    document.body.appendChild(feedbackOverlay); // Append to body to overlay everything

    let selectedOption = null;
    let isAnswered = false;

    const incorrectResponses = []; // Track detailed errors for review

    function renderQuestion() {
        if (currentIndex >= questions.length) {
            feedbackOverlay.remove(); // Clean up overlay

            // If they got everything right, or we want to show review
            if (incorrectResponses.length > 0) {
                renderReviewScreen();
            } else {
                onComplete(score);
            }
            return;
        }

        const q = questions[currentIndex];
        questionText.innerHTML = q.prompt;

        // Handle Image
        if (q.image) {
            if (q.image.startsWith('data:') || q.image.startsWith('http')) {
                questionImage.src = q.image;
            } else {
                questionImage.src = `assets/images/${q.image}`;
            }
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        // Update Progress
        const progress = (currentIndex / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
        counterText.textContent = `Question ${currentIndex + 1} / ${questions.length}`;

        // Render Options
        optionsContainer.innerHTML = '';
        selectedOption = null;
        isAnswered = false;

        // Reset Feedback
        feedbackOverlay.style.transform = 'translateY(100%)';
        checkBtn.textContent = 'CHECK';
        checkBtn.className = 'btn btn-primary'; // Reset color
        checkBtn.disabled = true;
        checkBtn.style.opacity = '0.5';

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.innerHTML = opt;
            btn.onclick = () => {
                if (isAnswered) return;

                // Visual Select
                Array.from(optionsContainer.children).forEach(c => {
                    c.style.borderColor = '#374151';
                    c.style.backgroundColor = 'var(--surface)';
                });
                btn.style.borderColor = 'var(--secondary)';
                btn.style.backgroundColor = 'rgba(206, 130, 255, 0.1)';

                selectedOption = opt;
                checkBtn.disabled = false;
                checkBtn.style.opacity = '1';
            };
            optionsContainer.appendChild(btn);
        });
    }

    function renderReviewScreen() {
        container.innerHTML = '';
        container.style.overflowY = 'auto'; // Enable scrolling for list

        const title = document.createElement('h2');
        title.textContent = 'Review Incorrect Answers';
        title.style.marginBottom = '20px';
        title.style.borderBottom = '1px solid #374151';
        title.style.paddingBottom = '10px';
        container.appendChild(title);

        const list = document.createElement('div');
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '20px';
        list.style.marginBottom = '30px';

        incorrectResponses.forEach((item, idx) => {
            const card = document.createElement('div');
            card.style.background = '#1f2937';
            card.style.padding = '16px';
            card.style.borderRadius = '12px';
            card.style.border = '1px solid #374151';

            let imgHTML = '';
            if (item.image) {
                // Determine src like in renderQuestion
                const src = (item.image.startsWith('data:') || item.image.startsWith('http'))
                    ? item.image
                    : `assets/images/${item.image}`;
                imgHTML = `<img src="${src}" style="max-width:100%; max-height:150px; border-radius:8px; margin-bottom:12px; display:block;">`;
            }

            card.innerHTML = `
                <div style="font-weight:bold; margin-bottom:10px; color:#e5e7eb;">${idx + 1}. ${item.question}</div>
                ${imgHTML}
                <div style="font-size:0.9rem; margin-bottom:8px;">
                    <span style="color:#ef4444;">Your Answer: ${item.userAnswer}</span>
                </div>
                <div style="font-size:0.9rem; margin-bottom:8px;">
                    <span style="color:#10b981;">Correct Answer: ${item.correctAnswer}</span>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; font-size:0.85rem; color:#d1d5db; margin-top:8px;">
                    <strong>Explanation:</strong> ${item.explanation || "No specific explanation available."}
                </div>
            `;
            list.appendChild(card);
        });
        container.appendChild(list);

        const finishBtn = document.createElement('button');
        finishBtn.className = 'btn btn-primary';
        finishBtn.textContent = 'FINISH QUIZ';
        finishBtn.style.marginTop = 'auto'; // Push to bottom if flex
        finishBtn.onclick = () => {
            onComplete(score);
        };
        container.appendChild(finishBtn);
    }

    checkBtn.onclick = () => {
        if (!isAnswered) {
            // CHECK LOGIC
            const q = questions[currentIndex];
            isAnswered = true;

            if (selectedOption === q.correctAnswer) {
                // CORRECT
                score += 10; // 10 XP per Q

                // Adaptive Logic
                if (Number(topicId) === 8) {
                    if (adaptiveStats.mode === 'THEORY') {
                        adaptiveStats.recoveryCount++;
                    }
                }

                // Audio would go here
                feedbackOverlay.style.backgroundColor = '#d7ffb8'; // Light Green
                feedbackOverlay.style.color = '#58a700';
                feedbackOverlay.innerHTML = `<h2 style="margin-bottom:12px">Nicely Done!</h2>`;

                // Add Next Button to Overlay
                const nextBtn = document.createElement('button');
                nextBtn.className = 'btn btn-primary';
                nextBtn.textContent = 'CONTINUE';
                nextBtn.onclick = nextQuestion;
                feedbackOverlay.appendChild(nextBtn);

            } else {
                // INCORRECT
                // Disable Adaptive switching here to keep it simple, or track errors
                if (Number(topicId) === 8) {
                    adaptiveStats.wrongCount++;
                }

                // Store for Review
                incorrectResponses.push({
                    question: q.prompt,
                    image: q.image,
                    userAnswer: selectedOption,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                });

                feedbackOverlay.style.backgroundColor = '#ffdfe0'; // Light Red
                feedbackOverlay.style.color = '#ea2b2b';

                let explanationHTML = `<h2 style="margin-bottom:12px">Incorrect</h2>
                    <p style="margin-bottom:16px">Correct answer: <strong>${q.correctAnswer}</strong></p>`;

                if (q.explanation) {
                    explanationHTML += `<div style="background:rgba(255,255,255,0.5); padding:12px; border-radius:12px; margin-bottom:16px; font-size:0.9rem; color:#b91c1c;">
                        <strong>Why:</strong> ${q.explanation}
                    </div>`;
                }

                feedbackOverlay.innerHTML = explanationHTML;

                const nextBtn = document.createElement('button');
                nextBtn.className = 'btn';
                nextBtn.style.backgroundColor = '#ff4b4b';
                nextBtn.style.color = 'white';
                nextBtn.style.boxShadow = '0 4px 0 #ea2b2b';
                nextBtn.textContent = 'GOT IT';
                nextBtn.onclick = nextQuestion;
                feedbackOverlay.appendChild(nextBtn);
            }

            // ADAPTIVE LOGIC EXECUTION (Post-Check)
            if (Number(topicId) === 8) {
                // Check Transitions
                if (adaptiveStats.mode !== 'THEORY' && adaptiveStats.wrongCount >= 2) {
                    adaptiveStats.mode = 'THEORY';
                    adaptiveStats.recoveryCount = 0;
                    console.log("Adaptive: Switching to THEORY.");
                    for (let i = currentIndex + 1; i < questions.length; i++) {
                        const newQ = window.DataService.getTheoryQuestion(topicId);
                        if (newQ) questions[i] = newQ;
                    }
                }
                else if (adaptiveStats.mode === 'THEORY' && adaptiveStats.recoveryCount >= 3) {
                    adaptiveStats.mode = 'CIRCUIT';
                    adaptiveStats.wrongCount = 0;
                    console.log("Adaptive: Switching to CIRCUITS.");
                    for (let i = currentIndex + 1; i < questions.length; i++) {
                        const newQ = window.DataService.getCircuitQuestion(topicId);
                        if (newQ) questions[i] = newQ;
                    }
                }
            }

            feedbackOverlay.style.transform = 'translateY(0)';

        } else {
            // Should be handled by overlay button, but fallback
            nextQuestion();
        }
    };

    function nextQuestion() {
        currentIndex++;
        renderQuestion(); // Check for end is inside renderQuestion
    }

    // Initial Start
    renderQuestion();

    return container;
};
