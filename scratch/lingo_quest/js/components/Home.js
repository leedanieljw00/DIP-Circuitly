window.Home = function ({ onStart, topicProgress }) {
    // 1. Main Container
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';

    // 2. Header Section
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `
        <h1 class="brand-title">Circuitly</h1>
        <p class="brand-subtitle">Master the Circuit. Rule the Grid.</p>
    `;
    container.appendChild(header);

    // 3. Import / Admin Tools (Subtle, top right or bottom? Let's keep it at bottom for now, or maybe a small icon row)
    // For now, let's keep the main focus on content.

    // 4. Topics Grid
    const topics = window.DataService.getTopics();

    const grid = document.createElement('div');
    grid.className = 'topic-grid';

    topics.forEach(topic => {
        // Card
        const card = document.createElement('div');
        card.className = 'card-glass';

        // Header (Title)
        const title = document.createElement('h3');
        title.style.fontSize = '1.25rem';
        title.style.marginBottom = '8px';
        title.style.fontWeight = '700';
        title.textContent = topic.name;
        card.appendChild(title);

        // Subtitle / ID
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
        btn.onclick = () => onStart(topic.id);
        card.appendChild(btn);

        grid.appendChild(card);
    });

    container.appendChild(grid);

    // 5. Admin / Footer Section (Restored functionality but styled)
    const footer = document.createElement('div');
    footer.style.marginTop = '60px';
    footer.style.textAlign = 'center';
    footer.style.borderTop = '1px solid var(--surface-border)';
    footer.style.paddingTop = '20px';

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
