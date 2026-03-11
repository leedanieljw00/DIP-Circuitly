window.Quiz = function ({ topicId, onComplete, onExit }) {
    const questions = window.DataService.getQuestions(topicId);
    let currentIndex = 0;
    let score = 0;
    let sessionTime = 0; // Seconds
    let questionStartTime = Date.now();

    // Adaptive State
    const adaptiveStats = {
        mode: 'NORMAL',
        wrongCount: 0,
        recoveryCount: 0
    };

    // Dynamic Difficulty State
    let successStreak = 0;
    let failStreak = 0;
    let currentDifficulty = 1; // Start on easy (1)
    const seenQuestionIds = []; // Prevent repeating questions

    const container = document.createElement('div');
    container.className = 'dashboard-container animate-slide-in';
    container.style.maxWidth = '800px'; // Limit width for centering
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100vh';
    container.style.overflowY = 'auto'; // Enable vertical scrolling
    container.style.justifyContent = 'center'; // Center vertically
    container.style.paddingTop = '10px';
    container.style.paddingBottom = '10px';

    // Back Button (Top Left)
    const headerRow = document.createElement('div');
    headerRow.style.width = '100%';
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'flex-start'; // Align Left
    headerRow.style.alignItems = 'center';
    headerRow.style.marginBottom = '20px';

    const backBtn = document.createElement('button');
    backBtn.innerHTML = '&#8592; Exit';
    backBtn.className = 'btn btn-secondary';
    backBtn.style.padding = '8px 16px';
    backBtn.style.fontSize = '0.9rem';
    backBtn.onclick = () => {
        onExit();
    };
    headerRow.appendChild(backBtn);

    // Score/Progress Text - Moved to main card to avoid overlap with Stats
    const progressText = document.createElement('div');
    progressText.className = 'text-gradient';
    progressText.style.fontWeight = '700';
    progressText.style.textAlign = 'center';
    progressText.style.marginBottom = '5px';
    progressText.textContent = `Question ${currentIndex + 1} / ${questions.length}`;

    // Difficulty Text
    const difficultyText = document.createElement('div');
    difficultyText.style.textAlign = 'center';
    difficultyText.style.fontSize = '0.85rem';
    difficultyText.style.color = 'var(--text-muted)';
    difficultyText.style.marginBottom = '15px';
    difficultyText.style.textTransform = 'uppercase';
    difficultyText.style.letterSpacing = '1px';

    container.appendChild(headerRow);

    // Main Quiz Card
    const quizCard = document.createElement('div');
    quizCard.className = 'card-glass';
    quizCard.style.padding = '20px'; // Reduced padding
    quizCard.style.display = 'flex';
    quizCard.style.flexDirection = 'column';
    quizCard.style.gap = '12px'; // Reduced gap
    quizCard.style.flexShrink = '0'; // Prevent shrinking in flex container
    quizCard.style.overflow = 'visible'; // Allow content to flow out if needed (fixes clipping)
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
    quizCard.appendChild(progressText); // Moved here

    // Question Text
    const questionText = document.createElement('h2');
    questionText.style.textAlign = 'center';
    questionText.style.fontSize = '1.2rem'; // Reduced font size
    questionText.style.marginBottom = '5px';
    questionText.style.lineHeight = '1.3';
    quizCard.appendChild(questionText);

    // Explicitly add a fallback text and a solid background to difficultyText to guarantee visibility
    difficultyText.innerHTML = "<strong>Loading Difficulty...</strong>";
    difficultyText.style.background = "rgba(255, 255, 255, 0.1)";
    difficultyText.style.padding = "5px";
    difficultyText.style.borderRadius = "5px";
    quizCard.appendChild(difficultyText);

    // Image Area
    const questionImage = document.createElement('img');
    questionImage.style.maxWidth = '100%';
    questionImage.style.maxHeight = '25vh'; // Increased from 15vh (1.5x) height (approx 100-150px)
    questionImage.style.borderRadius = 'var(--border-radius)';
    questionImage.style.alignSelf = 'center';
    questionImage.style.display = 'none';
    questionImage.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
    questionImage.style.objectFit = 'contain'; // Ensure aspect ratio
    quizCard.appendChild(questionImage);

    // Options Area
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'grid';
    optionsContainer.style.gridTemplateColumns = '1fr 1fr'; // 2x2 Layout
    optionsContainer.style.gap = '8px'; // Compact gap
    quizCard.appendChild(optionsContainer);

    // Check Button
    const checkBtn = document.createElement('button');
    checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'CHECK ANSWER';
    checkBtn.style.marginTop = '10px';
    checkBtn.style.width = '100%';
    checkBtn.style.padding = '12px';
    checkBtn.style.fontSize = '1rem';
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
    let correctCount = 0; // New tracking
    const incorrectResponses = [];

    function renderQuestion() {
        if (currentIndex >= questions.length) {
            feedbackOverlay.remove();
            // Always show review screen now to show Pass/Fail status clearly
            renderReviewScreen();
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

        // Difficulty update
        let diffLabel = "EASY";
        let diffColor = "var(--text-main)";
        if (q.difficulty == 2) {
            diffLabel = "MEDIUM";
            diffColor = "var(--warning)"; // Optional: Add a medium color
        } else if (q.difficulty >= 3) {
            diffLabel = "HARD";
            diffColor = "var(--error)";
        }
        difficultyText.innerHTML = `<span style="opacity: 0.7;">Level ${q.difficulty || 1}:</span> <strong style="color: ${diffColor};">${diffLabel}</strong>`;

        // Options
        optionsContainer.innerHTML = '';
        selectedOption = null;
        isAnswered = false;

        // Reset UI
        feedbackOverlay.style.transform = 'translateY(100%)';
        checkBtn.textContent = 'CHECK ANSWER';
        checkBtn.disabled = true;
        checkBtn.style.opacity = '0.5';

        questionStartTime = Date.now();

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary'; // Base style
            btn.innerHTML = opt;
            btn.style.justifyContent = 'center'; // Center text in 2x2
            btn.style.textAlign = 'center';
            btn.style.width = '100%';
            btn.style.minHeight = '45px'; // Compact touch target
            btn.style.padding = '6px'; // Minimal padding
            btn.style.fontSize = '0.9rem'; // Slightly smaller font
            btn.style.whiteSpace = 'normal'; // Allow wrapping
            btn.style.lineHeight = '1.1';

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

        // Track that we've seen this question
        if (q.id) {
            seenQuestionIds.push(q.id);
        }

        // Render math equations if MathJax is available
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([quizCard]).catch(err => console.warn('MathJax error:', err));
        }
    }

    // Review Screen Logic
    function renderReviewScreen() {
        container.innerHTML = '';
        container.style.height = 'auto';
        container.style.paddingTop = '40px';
        container.style.justifyContent = 'flex-start';

        // Calculate functionality
        const total = questions.length;
        const percentage = Math.round((correctCount / total) * 100);
        const passed = percentage >= 80;

        const title = document.createElement('h1');
        title.className = 'brand-title';
        title.style.fontSize = '2.5rem';
        title.style.textAlign = 'center';
        title.textContent = passed ? 'Module Passed!' : 'Module Failed';
        title.style.color = passed ? 'var(--accent)' : 'var(--error)';
        container.appendChild(title);

        const subTitle = document.createElement('div');
        subTitle.style.textAlign = 'center';
        subTitle.style.marginBottom = '30px';
        subTitle.style.color = 'var(--text-main)';
        subTitle.innerHTML = `
            <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Score: ${percentage}%</h2>
            <p style="color: var(--text-muted);">${correctCount} / ${total} Correct</p>
            ${!passed ? '<p style="color: var(--error); margin-top: 8px;">You need 80% to pass. A heart has been lost.</p>' : '<p style="color: var(--accent); margin-top: 8px;">Great job! +XP awarded.</p>'}
        `;
        container.appendChild(subTitle);

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
                <div style="font-weight:700; margin-bottom:12px; color:var(--text-main); font-size:1.1rem;">Question: ${item.question}</div>
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
        finishBtn.onclick = () => onComplete({ score, correctCount, totalQuestions: total, timeSpent: sessionTime });
        container.appendChild(finishBtn);

        // Render math equations in review screen
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([container]).catch(err => console.warn('MathJax error:', err));
        }
    }

    checkBtn.onclick = () => {
        if (!isAnswered && selectedOption) {
            const q = questions[currentIndex];
            isAnswered = true;

            // Calculate time for this question
            const now = Date.now();
            const timeForQ = (now - questionStartTime) / 1000;
            sessionTime += timeForQ;

            // Logic identical to before
            const isCorrect = (selectedOption === q.correctAnswer);
            const isNotFamiliar = (selectedOption === "NOT_FAMILIAR");

            feedbackOverlay.innerHTML = '';

            if (isCorrect) {
                score += 1;
                correctCount++; // Increment correct count
                // Adaptive Logic
                if (Number(topicId) === 8 && adaptiveStats.mode === 'THEORY') {
                    adaptiveStats.recoveryCount++;
                }

                // Dynamic Difficulty Logic (Streak)
                successStreak++;
                failStreak = 0;
                if (successStreak >= 3 && currentDifficulty < 3) {
                    currentDifficulty++;
                    // You leveled up! Swap ALL remaining questions for harder ones
                    console.log(`Level Up to Difficulty ${currentDifficulty}! Swapping remaining questions.`);
                    for (let i = currentIndex + 1; i < questions.length; i++) {
                        const harderQ = window.DataService.getQuestionByDifficulty(topicId, currentDifficulty, seenQuestionIds);
                        if (harderQ) {
                            questions[i] = harderQ;
                            seenQuestionIds.push(harderQ.id); // Prevent picking the same one in this loop
                        }
                    }
                    successStreak = 0; // Reset streak after level up
                }

                feedbackOverlay.style.borderTopColor = 'var(--accent)';
                feedbackOverlay.innerHTML = `
                    <h2 style="color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin:0;">Correct!</h2>
                    <button class="btn btn-primary" id="next-btn" style="min-width:200px;">CONTINUE</button>
                `;
            } else {
                if (Number(topicId) === 8) adaptiveStats.wrongCount++;

                // Dynamic Difficulty Logic (Strike)
                failStreak++;
                successStreak = 0;
                if (failStreak >= 2 && currentDifficulty > 1) {
                    currentDifficulty--;
                    // You leveled down! Swap ALL remaining questions for easier ones
                    console.log(`Level Down to Difficulty ${currentDifficulty}. Swapping remaining questions.`);
                    for (let i = currentIndex + 1; i < questions.length; i++) {
                        const easierQ = window.DataService.getQuestionByDifficulty(topicId, currentDifficulty, seenQuestionIds);
                        if (easierQ) {
                            questions[i] = easierQ;
                            seenQuestionIds.push(easierQ.id); // Prevent picking the same one in this loop
                        }
                    }
                    failStreak = 0; // Reset strike after level down
                }

                incorrectResponses.push({
                    question: q.prompt,
                    image: q.image,
                    userAnswer: isNotFamiliar ? "Not familiar with the concept" : selectedOption,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                });

                // If not familiar, add to unfamiliarPool
                // Note: generated questions (Module 8 circuit problems) have no CSV id,
                // so skip them — they can't be linked back to a PDF reference.
                if (isNotFamiliar && q.id != null) {
                    const profileService = window.ProfileService;
                    const activeProfile = profileService.getActiveProfile();
                    if (activeProfile) {
                        if (!activeProfile.unfamiliarPool) activeProfile.unfamiliarPool = [];
                        if (!activeProfile.unfamiliarPool.some(p => p.id === q.id)) {
                            activeProfile.unfamiliarPool.push({
                                id: q.id,
                                topicId: Number(topicId), // Always store as number to avoid type mismatches
                                timestamp: new Date().toISOString()
                            });
                            profileService.updateProgress(activeProfile.studentId, { unfamiliarPool: activeProfile.unfamiliarPool });
                        }
                    }
                } else if (isNotFamiliar && q.id == null) {
                    // Generated question — inform user it can't be saved to the unfamiliar pool
                    console.warn('Skipped adding generated question to unfamiliar pool (no CSV id).');
                }

                const accentColor = isNotFamiliar ? 'var(--warning, #f59e0b)' : 'var(--error)';
                const titleText = isNotFamiliar
                    ? (q.id != null ? 'Concept Logged' : "Note: Generated Question")
                    : 'Incorrect';
                const subtitleExtra = (isNotFamiliar && q.id == null)
                    ? `<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:10px;">Generated circuit questions can't be saved to the Unfamiliar pool — only static theory questions can.</p>`
                    : '';

                feedbackOverlay.style.borderTopColor = accentColor;
                feedbackOverlay.innerHTML = `
                    <h2 style="color:${accentColor}; text-transform:uppercase; letter-spacing:1px; margin:0;">${titleText}</h2>
                    ${subtitleExtra}
                    <p style="color:var(--text-main); margin-bottom:10px;">Correct Answer: <strong>${formatMathText(q.correctAnswer)}</strong></p>
                    ${q.explanation ? `<div style="max-width:600px; text-align:center; color:var(--text-muted); font-size:0.9rem;">${formatMathText(q.explanation)}</div>` : ''}
                    <button class="btn btn-secondary" id="next-btn" style="min-width:200px; margin-top:12px; border-color:${accentColor}; color:${accentColor};">GOT IT</button>
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

            // Render math equations in feedback if MathJax is available
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([feedbackOverlay]).catch(err => console.warn('MathJax error:', err));
            }
        }
    };

    renderQuestion();
    return container;
};
