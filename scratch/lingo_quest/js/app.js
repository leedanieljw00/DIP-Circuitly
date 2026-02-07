// Main App Entry
const app = document.getElementById('app');

const ROUTES = {
    LOGIN: 'login',
    HOME: 'home',
    QUIZ: 'quiz',
    RESULT: 'result',
    PROFILES: 'profiles'
};

// Global State
let State = {
    view: ROUTES.LOGIN,
    username: null,
    xp: 0,
    hearts: 5,
    nextHeartRestoreTime: null,
    activeTopicId: null,
    topicProgress: {}
};

// --- INIT ---
const initApp = async () => {
    // Check for existing session
    const currentUser = window.AuthService.getCurrentUser();

    if (currentUser) {
        await loadUser(currentUser);
    } else {
        State.view = ROUTES.LOGIN;
        render();
    }
};

const loadUser = async (username) => {
    const users = await window.AuthService.getUsers();
    if (users[username]) {
        const u = users[username];
        State = {
            ...State,
            view: ROUTES.HOME,
            username: u.username,
            xp: u.xp,
            hearts: u.hearts,
            nextHeartRestoreTime: u.nextHeartRestoreTime || null,
            topicProgress: u.topicProgress || {}
        };

        // Resume Timer if needed
        if (State.hearts < 5 && State.nextHeartRestoreTime) {
            startHeartTimer();
        }

        render();
    } else {
        window.AuthService.logout();
        State.view = ROUTES.LOGIN;
        render();
    }
};

// Sync State to Auth Service (Auto-Save)
const syncState = () => {
    if (State.username) {
        window.AuthService.saveProgress({
            xp: State.xp,
            hearts: State.hearts,
            nextHeartRestoreTime: State.nextHeartRestoreTime,
            topicProgress: State.topicProgress
        });
    }
};

function render() {
    app.innerHTML = ''; // Clear

    // Header (Only show if logged in and NOT on login page)
    if (State.view !== ROUTES.LOGIN) {
        const header = document.createElement('div');
        header.className = 'header-bar';
        header.innerHTML = `
            <div class="stats-container">
                <div class="stat-pill glass-pill">
                    <span style="margin-right:8px">❤️</span> ${State.hearts}
                    <span id="heart-timer" style="font-size: 0.8em; margin-left: 8px; color: var(--text-muted);"></span>
                </div>
                <div class="stat-pill glass-pill accent-pill"><span style="margin-right:8px">⚡</span> ${State.xp} XP</div>
                <div class="stat-pill glass-pill" style="color:var(--text-muted); cursor:pointer;" id="logout-btn">
                    👤 ${State.username} (Log Out)
                </div>
            </div>
        `;
        app.appendChild(header);

        // Bind Logout
        setTimeout(() => {
            const btn = document.getElementById('logout-btn');
            if (btn) btn.onclick = () => {
                if (confirm('Log out?')) {
                    window.AuthService.logout();
                    State.username = null;
                    State.view = ROUTES.LOGIN;
                    render();
                }
            };
        }, 0);
    }

    // View Content
    let component;
    switch (State.view) {
        case ROUTES.LOGIN:
            if (window.Login) {
                component = window.Login({
                    onLogin: (username) => {
                        window.AuthService.login(username).then(res => {
                            if (res.success) loadUser(username);
                            else alert(res.error);
                        });
                    },
                    onRegister: (username) => {
                        window.AuthService.register(username).then(res => {
                            if (res.success) loadUser(username);
                            else alert(res.error);
                        });
                    }
                });
            }
            break;

        case ROUTES.HOME:
            if (window.Home) {
                component = window.Home({
                    topicProgress: State.topicProgress,
                    onStart: (topicId) => {
                        if (State.hearts <= 0) {
                            alert("You have no hearts left! Wait for them to restore.");
                            return;
                        }
                        State.activeTopicId = topicId;
                        State.view = ROUTES.QUIZ;
                        render(); // No save needed just for navigation, usually
                    }
                });
            }
            break;

        case ROUTES.QUIZ:
            if (window.Quiz) {
                component = window.Quiz({
                    topicId: State.activeTopicId,
                    onComplete: (result) => {
                        // Result is now object: { score, correctCount, totalQuestions }
                        // Or legacy: number (handle backwards compat if needed, but we updated Quiz.js)

                        let earnedScore = 0;
                        let passed = false;

                        if (typeof result === 'object') {
                            const percentage = (result.correctCount / result.totalQuestions) * 100;
                            if (percentage >= 80) {
                                passed = true;
                                earnedScore = result.score;
                            }
                        } else {
                            // Fallback (shouldn't happen with new Quiz.js)
                            earnedScore = result;
                            passed = true;
                        }

                        if (passed) {
                            State.xp += earnedScore;

                            // Update Progress
                            if (!State.topicProgress[State.activeTopicId]) {
                                State.topicProgress[State.activeTopicId] = { xp: 0 };
                            }
                            State.topicProgress[State.activeTopicId].xp += earnedScore;

                        } else {
                            // Failed: Deduct Heart
                            if (State.hearts > 0) {
                                State.hearts--;

                                // Initiate Timer if this was the first heart lost (or just ensure timer is set)
                                if (State.hearts < 5 && !State.nextHeartRestoreTime) {
                                    State.nextHeartRestoreTime = Date.now() + (60 * 60 * 1000); // 60 minutes
                                    startHeartTimer();
                                }
                            }
                        }

                        syncState(); // Save to Profile

                        State.view = ROUTES.HOME;
                        render();
                    },
                    onExit: () => {
                        State.view = ROUTES.HOME;
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

// Heart Timer Logic
let heartInterval = null;

function startHeartTimer() {
    if (heartInterval) clearInterval(heartInterval);

    const updateTimerDisplay = () => {
        if (!State.nextHeartRestoreTime) {
            // Clean up if fully restored
            clearInterval(heartInterval);
            heartInterval = null;
            const el = document.getElementById('heart-timer');
            if (el) el.textContent = '';
            return;
        }

        const now = Date.now();
        const diff = State.nextHeartRestoreTime - now;

        if (diff <= 0) {
            // Restore Heart
            State.hearts++;

            if (State.hearts >= 5) {
                State.hearts = 5;
                State.nextHeartRestoreTime = null;
                clearInterval(heartInterval);
                heartInterval = null;
            } else {
                // Reset timer for NEXT heart
                State.nextHeartRestoreTime = Date.now() + (60 * 60 * 1000);
            }

            syncState();

            // Only re-render header info if we are in a view that shows it
            // Ideally we just update the DOM elements directly to avoid flicker
            const heartCountEl = document.querySelector('.stats-container .stat-pill');
            if (heartCountEl) {
                // Simple re-render to catch everything or manual DOM update
                // Manual update is safer for preserving input state if any, but render() is fine for this app structure
                render();
                return;
            }
        }

        // Update Display text
        const el = document.getElementById('heart-timer');
        if (el) {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            el.textContent = `(+1 in ${m}:${s.toString().padStart(2, '0')})`;
        }
    };

    heartInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay(); // Immediate run
}

// Initial Boot
if (window.DataService && window.DataService.init) {
    window.DataService.init().then(() => {
        initApp();
    });
} else {
    initApp();
}
