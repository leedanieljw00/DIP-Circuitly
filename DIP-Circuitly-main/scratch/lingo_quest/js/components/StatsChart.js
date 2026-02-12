window.StatsChart = function ({ stats, onClose }) {
    try {
        console.log("Opening StatsChart with:", stats);

        // Modal Container
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.backgroundColor = 'rgba(0,0,0,0.85)';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.padding = '20px';

        // Content Card
        const card = document.createElement('div');
        card.className = 'animate-pop';
        card.style.backgroundColor = '#1f2937';
        card.style.borderRadius = '16px';
        card.style.padding = '20px';
        card.style.width = '100%';
        card.style.maxWidth = '500px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '16px';
        card.style.border = '1px solid #374151';

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        const title = document.createElement('h3');
        title.textContent = "Proficiency Radar";
        title.style.margin = '0';
        header.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#9ca3af';
        closeBtn.style.fontSize = '1.5rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => modal.remove();
        header.appendChild(closeBtn);
        card.appendChild(header);

        // Chart Container
        const canvasContainer = document.createElement('div');
        canvasContainer.style.position = 'relative';
        canvasContainer.style.height = '300px';
        canvasContainer.style.width = '100%';

        const canvas = document.createElement('canvas');
        canvasContainer.appendChild(canvas);
        card.appendChild(canvasContainer);

        // Stats Summary Text
        const summaryDiv = document.createElement('div');
        summaryDiv.style.display = 'flex';
        summaryDiv.style.justifyContent = 'space-around';
        summaryDiv.style.background = '#374151';
        summaryDiv.style.padding = '12px';
        summaryDiv.style.borderRadius = '12px';
        summaryDiv.style.marginTop = '8px';

        // Calculate Totals
        let totalXP = 0;
        let totalSeconds = 0;
        if (stats) {
            Object.values(stats).forEach(s => {
                if (s.xp) totalXP += s.xp;
                if (s.time) totalSeconds += s.time;
            });
        }

        // Format time
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        const timeStr = `${mins}m ${secs}s`;

        summaryDiv.innerHTML = `
            <div style="text-align:center">
                 <div style="font-size:0.8rem; color:#9ca3af">Total XP</div>
                 <div style="font-size:1.2rem; font-weight:bold; color:var(--primary)">${totalXP}</div>
            </div>
            <div style="text-align:center">
                 <div style="font-size:0.8rem; color:#9ca3af">Time Spent</div>
                 <div style="font-size:1.2rem; font-weight:bold; color:#10b981">${timeStr}</div>
            </div>
        `;
        card.appendChild(summaryDiv);

        // Topic Breakdown
        const breakdownList = document.createElement('div');
        breakdownList.style.display = 'flex';
        breakdownList.style.flexDirection = 'column';
        breakdownList.style.gap = '8px';
        breakdownList.style.marginTop = '12px';
        breakdownList.style.maxHeight = '150px';
        breakdownList.style.overflowY = 'auto';
        breakdownList.style.borderTop = '1px solid #374151';
        breakdownList.style.paddingTop = '12px';

        // Default 8 topics
        const labels = [
            "Fundamentals", "Energy Storage", "Transient/Steady",
            "Op-Amps", "Laplace", "Network Func",
            "DC vs AC", "3-Phase"
        ];

        labels.forEach((label, idx) => {
            const topicId = idx + 1;
            const s = stats && stats[topicId] ? stats[topicId] : { time: 0 };
            const t = Math.floor(s.time || 0);
            const m = Math.floor(t / 60);
            const sc = t % 60;

            if (t > 0) { // Only show topics with time
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.fontSize = '0.85rem';
                row.style.color = '#d1d5db';
                row.innerHTML = `
                    <span>${label}</span>
                    <span style="font-family:monospace; color:#10b981">${m}m ${sc}s</span>
                `;
                breakdownList.appendChild(row);
            }
        });

        if (breakdownList.children.length === 0) {
            breakdownList.innerHTML = '<div style="text-align:center; color:#6b7280; font-size:0.8rem;">No activity recorded yet.</div>';
        }

        card.appendChild(breakdownList);

        // Close Action
        const closeAction = document.createElement('button');
        closeAction.className = 'btn btn-primary';
        closeAction.textContent = 'CLOSE';
        closeAction.onclick = () => modal.remove();
        card.appendChild(closeAction);

        modal.appendChild(card);
        document.body.appendChild(modal);

        // Prepare Data for Chart
        const dataPoints = [1, 2, 3, 4, 5, 6, 7, 8].map(id => {
            if (stats && stats[id]) {
                // Normalize? Assuming XP determines level. 
                // Let's cap at 100 for graph visual
                return Math.min(stats[id].xp || 0, 100);
            }
            return 0;
        });

        // Render Chart
        if (window.Chart) {
            new Chart(canvas, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Proficiency (XP)',
                        data: dataPoints,
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: '#374151' },
                            grid: { color: '#374151' },
                            pointLabels: {
                                color: '#e5e7eb',
                                font: { size: 10 }
                            },
                            ticks: {
                                display: false,
                                maxTicksLimit: 5,
                                backdropColor: 'transparent'
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } else {
            canvasContainer.innerHTML = '<p style="text-align:center; color:red;">Chart.js library not loaded.</p>';
        }

        return modal;
    } catch (e) {
        console.error("Error in StatsChart:", e);
        alert("Error opening stats chart: " + e.message);
    }
};
