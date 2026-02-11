window.Home = function ({ onStart, topicProgress }) {
    const container = document.createElement('div');
    container.className = 'animate-slide-in';
    container.style.padding = '20px';
    container.style.paddingBottom = '80px'; // Space for scroll

    const title = document.createElement('h1');
    title.textContent = "Circuitly";
    title.style.marginBottom = '8px';
    title.style.textAlign = 'center';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = "Select a topic to begin";
    subtitle.style.color = 'var(--text-muted)';
    subtitle.style.textAlign = 'center';
    subtitle.style.marginBottom = '24px';
    container.appendChild(subtitle);

    const topics = window.DataService.getTopics();

    topics.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '12px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        const name = document.createElement('h3');
        name.textContent = `${topic.id}. ${topic.name}`;
        header.appendChild(name);

        card.appendChild(header);

        // Progress Bar
        const stats = (topicProgress && topicProgress[topic.id]) ? topicProgress[topic.id] : { xp: 0 };
        const level = Math.floor(stats.xp / 100) + 1;
        const currentLevelXP = stats.xp % 100;

        const progressRow = document.createElement('div');
        progressRow.style.marginTop = '8px';

        const progressLabel = document.createElement('div');
        progressLabel.style.display = 'flex';
        progressLabel.style.justifyContent = 'space-between';
        progressLabel.style.fontSize = '0.85rem';
        progressLabel.style.color = '#9ca3af';
        progressLabel.style.marginBottom = '4px';
        progressLabel.innerHTML = `<span>Lvl ${level}</span><span>${currentLevelXP} / 100 XP</span>`;
        progressRow.appendChild(progressLabel);

        const pTrack = document.createElement('div');
        pTrack.style.height = '8px';
        pTrack.style.background = '#374151';
        pTrack.style.borderRadius = '4px';
        pTrack.style.overflow = 'hidden';

        const pBar = document.createElement('div');
        pBar.style.height = '100%';
        pBar.style.background = 'var(--secondary)'; // Purple for topic progress
        pBar.style.width = `${currentLevelXP}%`;
        pTrack.appendChild(pBar);

        progressRow.appendChild(pTrack);
        card.appendChild(progressRow);

        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.style.marginBottom = '0';
        btn.style.padding = '12px';
        btn.style.fontSize = '1rem';
        btn.textContent = 'START';
        btn.onclick = () => onStart(topic.id);

        card.appendChild(btn);
        container.appendChild(card);
    });

    // ADMIN / IMPORT SECTION
    const divider = document.createElement('hr');
    divider.style.borderColor = '#374151';
    divider.style.margin = '32px 0';
    container.appendChild(divider);

    const importContainer = document.createElement('div');
    importContainer.style.textAlign = 'center';

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
                // Force reload to see changes
                location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        };
        reader.readAsText(file);
    };

    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-secondary';
    importBtn.style.fontSize = '0.9rem';
    importBtn.innerHTML = '📂 Update Questions (.csv)';
    importBtn.onclick = () => importInput.click();

    importContainer.appendChild(importInput);
    importContainer.appendChild(importBtn);

    // Reset Data Button (Questions)
    const resetDataBtn = document.createElement('button');
    resetDataBtn.style.background = 'transparent';
    resetDataBtn.style.color = '#4b5563';
    resetDataBtn.style.border = '1px solid #d1d5db';
    resetDataBtn.style.padding = '4px 8px';
    resetDataBtn.style.borderRadius = '4px';
    resetDataBtn.style.marginTop = '12px';
    resetDataBtn.style.fontSize = '0.8rem';
    resetDataBtn.textContent = 'Reset Data (Questions)';
    resetDataBtn.style.cursor = 'pointer';
    resetDataBtn.onclick = () => {
        if (confirm('Reset custom questions to default?')) {
            window.DataService.resetToDefault();
            location.reload();
        }
    };

    // Reset Progress Button (XP/Skill)
    const resetProgressBtn = document.createElement('button');
    resetProgressBtn.style.background = 'transparent';
    resetProgressBtn.style.color = '#ef4444'; // Red to indicate destructive
    resetProgressBtn.style.border = '1px solid #ef4444';
    resetProgressBtn.style.padding = '4px 8px';
    resetProgressBtn.style.borderRadius = '4px';
    resetProgressBtn.style.marginTop = '12px';
    resetProgressBtn.style.marginLeft = '8px';
    resetProgressBtn.style.fontSize = '0.8rem';
    resetProgressBtn.textContent = 'Reset Progress (XP/Skill)';
    resetProgressBtn.style.cursor = 'pointer';
    resetProgressBtn.onclick = () => {
        if (confirm('Reset ALL progress (XP, Skill, Hearts)? This cannot be undone.')) {
            localStorage.removeItem('circuitly_state');
            location.reload();
        }
    };

    importContainer.appendChild(document.createElement('br'));
    importContainer.appendChild(resetDataBtn);
    importContainer.appendChild(resetProgressBtn);

    container.appendChild(importContainer);

    return container;
};
