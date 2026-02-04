// Main App Entry
const app = document.getElementById('app');

const ROUTES = {
    HOME: 'home',
    QUIZ: 'quiz',
    RESULT: 'result'
};

// State Management with Persistence
const STATE_KEY = 'circuitly_state';
const loadState = () => {
    const stored = localStorage.getItem(STATE_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return {
        view: ROUTES.HOME,
        xp: 0,
        hearts: 5,
        activeTopicId: null,
        topicProgress: {} // { topicId: { xp: 0, level: 1 } }
    };
};

const State = loadState();

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(State));
}

function render() {
    app.innerHTML = ''; // Clear

    // Header (Hearts/XP)
    const header = document.createElement('div');
    header.className = 'header-bar';
    header.innerHTML = `
        <div class="stat-pill">❤️ ${State.hearts}</div>
        <div class="stat-pill">⚡ ${State.xp} XP</div>
    `;
    app.appendChild(header);

    // View Content
    let component;
    switch (State.view) {
        case ROUTES.HOME:
            // Ensure Home is loaded
            if (window.Home) {
                component = window.Home({
                    topicProgress: State.topicProgress, // Pass progress data
                    onStart: (topicId) => {
                        State.activeTopicId = topicId;
                        State.view = ROUTES.QUIZ;
                        saveState();
                        render();
                    }
                });
            }
            break;
        case ROUTES.QUIZ:
            // Ensure Quiz is loaded
            if (window.Quiz) {
                component = window.Quiz({
                    topicId: State.activeTopicId,
                    onComplete: (score) => {
                        State.xp += score; // Global XP

                        // Update Topic Progress
                        if (!State.topicProgress) State.topicProgress = {};
                        if (!State.topicProgress[State.activeTopicId]) {
                            State.topicProgress[State.activeTopicId] = { xp: 0 };
                        }
                        State.topicProgress[State.activeTopicId].xp += score;

                        saveState();
                        State.view = ROUTES.HOME;
                        render();
                    },
                    onExit: () => {
                        State.view = ROUTES.HOME;
                        saveState();
                        render();
                    }
                });
            }
            break;
    }

    if (component) app.appendChild(component);
}

// Initial Render
// Initial Render
// Wait for DataService to load CSV
if (window.DataService && window.DataService.init) {
    window.DataService.init().then(() => {
        render();
    });
} else {
    render();
}
