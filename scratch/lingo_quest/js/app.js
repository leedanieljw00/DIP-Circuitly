// Main App Entry
const app = document.getElementById('app');

const ROUTES = {
    HOME: 'home',
    QUIZ: 'quiz',
    RESULT: 'result',
    PROFILES: 'profiles'
};

// State Management with Persistence
const STATE_KEY = 'circuitly_state';
const loadState = () => {
    // 1. Try to load Active Profile State FIRST
    if (window.ProfileService) {
        const activeP = window.ProfileService.getActiveProfile();
        if (activeP) {
            return {
                view: ROUTES.HOME, // Always start at home when loading profile? Or persist view? Let's reset to Home to avoid confusion.
                xp: activeP.xp || 0,
                hearts: activeP.hearts || 5,
                topicProgress: activeP.topicProgress || {},
                activeTopicId: null
            };
        }
    }

    // 2. Fallback to LocalStorage (Anonymous)
    const stored = localStorage.getItem(STATE_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return {
        view: ROUTES.HOME,
        xp: 0,
        hearts: 5,
        activeTopicId: null,
        topicProgress: {}
    };
};

const State = loadState();

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(State));

    // Sync to Profile if active
    if (window.ProfileService) {
        const activeP = window.ProfileService.getActiveProfile();
        if (activeP) {
            window.ProfileService.updateProgress(activeP.studentId, {
                xp: State.xp,
                hearts: State.hearts,
                topicProgress: State.topicProgress
            });
        }
    }
}

function render() {
    app.innerHTML = ''; // Clear

    // Header (Hearts/XP)
    const activeProfile = window.ProfileService ? window.ProfileService.getActiveProfile() : null;
    const profileName = activeProfile ? `<span style="font-size:0.8rem; color:var(--primary); margin-right:auto; margin-left:8px;">👤 ${activeProfile.name}</span>` : '';

    const header = document.createElement('div');
    header.className = 'header-bar';
    header.innerHTML = `
        ${profileName}
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
                    },
                    onManageProfiles: () => {
                        State.view = ROUTES.PROFILES;
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
                    topicId: State.activeTopicId,
                    onComplete: (score, timeSpent) => {
                        State.xp += score; // Global XP

                        // Update Topic Progress
                        if (!State.topicProgress[State.activeTopicId]) {
                            State.topicProgress[State.activeTopicId] = { xp: 0, time: 0 };
                        }

                        // Ensure time field exists (migration for old profiles)
                        if (!State.topicProgress[State.activeTopicId].time) {
                            State.topicProgress[State.activeTopicId].time = 0;
                        }

                        State.topicProgress[State.activeTopicId].xp += score;
                        State.topicProgress[State.activeTopicId].time += timeSpent;

                        // SaveState handles sync to ProfileService now
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
        case ROUTES.PROFILES:
            if (window.ProfileManager) {
                component = window.ProfileManager({
                    onBack: () => {
                        State.view = ROUTES.HOME;
                        saveState();
                        render();
                    },
                    onProfileSwitched: () => {
                        // Reload State from new profile
                        const newState = loadState();
                        Object.assign(State, newState);
                        // Stay in Profiles or go Home? Let's stay in Profiles to see the switch
                        State.view = ROUTES.PROFILES;
                        render();
                    }
                });
            }
            break;
    }

    if (component) app.appendChild(component);
}

// Initial Render
// Startup Screen Management
function removeStartupScreen() {
    const screen = document.getElementById('startup-screen');
    if (screen) {
        // Minimum display time of 1.5s for branding impact
        setTimeout(() => {
            screen.classList.add('fade-out');
            setTimeout(() => {
                screen.remove();
            }, 500); // Match CSS transition duration
        }, 1500);
    }
}

// Initial Render
// Wait for DataService to load CSV
if (window.DataService && window.DataService.init) {
    window.DataService.init().then(() => {
        render();
        removeStartupScreen();
    });
} else {
    render();
    removeStartupScreen();
}
