window.Home = function ({ topicProgress, revisionPoolCount, onStart, onStartRevision }) {
    const topics = window.DataService.getTopics();
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';

    // Header Section
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `
        <h1 class="brand-title">Circuitly</h1>
        <p class="brand-motto">Master the flow of energy.</p>
    `;
    container.appendChild(header);

    // Topics Grid
    const grid = document.createElement('div');
    grid.className = 'topic-grid';

    // Render regular topics
    topics.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'card-glass';

        // Header (ID Badge)
        const idBadge = document.createElement('div');
        idBadge.className = 'topic-id';
        idBadge.textContent = topic.id;
        card.appendChild(idBadge);

        // Title
        const title = document.createElement('h3');
        title.style.fontSize = '1.25rem';
        title.style.marginBottom = '8px';
        title.style.fontWeight = '700';
        title.textContent = topic.name;
        card.appendChild(title);

        // Subtitle/ID text (Optional, matching previous style)
        const sub = document.createElement('div');
        sub.style.fontSize = '0.85rem';
        sub.style.color = 'var(--text-muted)';
        sub.style.marginBottom = '16px';
        sub.textContent = `Module ${topic.id}`;
        card.appendChild(sub);

        // Progress Section
        const stats = (topicProgress && topicProgress[topic.id]) ? topicProgress[topic.id] : { xp: 0 };
        const level = Math.floor(stats.xp / 100) + 1;
        const currentLevelXP = stats.xp % 100;

        const progressInfo = document.createElement('div');
        progressInfo.style.display = 'flex';
        progressInfo.style.justifyContent = 'space-between';
        progressInfo.style.fontSize = '0.8rem';
        progressInfo.style.marginBottom = '6px';
        progressInfo.style.color = '#cbd5e1';
        progressInfo.innerHTML = `
            <span>Lvl ${level}</span>
            <span style="color:var(--accent)">${currentLevelXP} / 100 XP</span>
        `;
        card.appendChild(progressInfo);

        const rail = document.createElement('div');
        rail.className = 'progress-rail';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${currentLevelXP}%`;
        rail.appendChild(fill);
        card.appendChild(rail);

        // Action Button
        const btn = document.createElement('button');
        btn.className = 'btn-glass-action';
        btn.textContent = 'Play Now';
        btn.onclick = (e) => {
            e.stopPropagation();
            onStart(topic.id);
        };
        card.appendChild(btn);

        card.onclick = () => onStart(topic.id);
        grid.appendChild(card);
    });

    // Revision Module Card (Matching Style)
    if (revisionPoolCount > 0) {
        const revCard = document.createElement('div');
        revCard.className = 'card-glass';
        revCard.style.borderColor = 'var(--accent)';
        revCard.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)';

        // Header (ID Badge - using refresh icon)
        const revBadge = document.createElement('div');
        revBadge.className = 'topic-id';
        revBadge.style.background = 'var(--accent)';
        revBadge.innerHTML = '&#8635;';
        revCard.appendChild(revBadge);

        // Title
        const title = document.createElement('h3');
        title.style.fontSize = '1.25rem';
        title.style.marginBottom = '8px';
        title.style.fontWeight = '700';
        title.style.color = 'var(--accent)';
        title.textContent = "Revision Module";
        revCard.appendChild(title);

        const sub = document.createElement('div');
        sub.style.fontSize = '0.85rem';
        sub.style.color = 'var(--text-muted)';
        sub.style.marginBottom = '16px';
        sub.textContent = `${revisionPoolCount} Questions Pending`;
        revCard.appendChild(sub);

        // Action Button
        const btn = document.createElement('button');
        btn.className = 'btn-glass-action';
        btn.style.background = 'linear-gradient(45deg, var(--accent), var(--primary))';
        btn.textContent = 'Practice';
        btn.onclick = (e) => {
            e.stopPropagation();
            onStartRevision();
        };
        revCard.appendChild(btn);

        revCard.onclick = () => onStartRevision();
        grid.appendChild(revCard);
    }

    container.appendChild(grid);

    // Footer Section
    const footer = document.createElement('div');
    footer.className = 'dashboard-header'; // Re-using style for footer padding/center
    footer.style.padding = '40px 0';
    footer.style.marginTop = '40px';
    footer.style.borderTop = '1px solid var(--surface-border)';

    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.csv';
    importInput.style.display = 'none';
    importInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = window.DataService.importCSV(event.target.result);
            if (result.success) {
                alert(`Success! Loaded ${result.count} questions.`);
                location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        };
        reader.readAsText(file);
    };

    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-secondary';
    importBtn.style.fontSize = '0.85rem';
    importBtn.style.padding = '8px 16px';
    importBtn.style.marginRight = '8px';
    importBtn.textContent = 'Import CSV';
    importBtn.onclick = () => importInput.click();

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.style.fontSize = '0.85rem';
    resetBtn.style.padding = '8px 16px';
    resetBtn.textContent = 'Reset Data';
    resetBtn.onclick = () => {
        if (confirm('Reset all progress and questions?')) {
            window.DataService.resetToDefault();
            location.reload();
        }
    };

    footer.appendChild(importInput);
    footer.appendChild(importBtn);
    footer.appendChild(resetBtn);
    container.appendChild(footer);

    return container;
};
