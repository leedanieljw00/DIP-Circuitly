// Main App Entry
const app = document.getElementById('app');

const ROUTES = {
    LOGIN: 'login',
    HOME: 'home',
    QUIZ: 'quiz',
    RESULT: 'result'
};

// Global State
let State = {
    view: ROUTES.LOGIN,
    username: null,
    xp: 0,
    hearts: 5,
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
            topicProgress: u.topicProgress || {}
        };
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
                <div class="stat-pill glass-pill"><span style="margin-right:8px">❤️</span> ${State.hearts}</div>
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
                    onComplete: (score) => {
                        State.xp += score;

                        // Update Progress
                        if (!State.topicProgress[State.activeTopicId]) {
                            State.topicProgress[State.activeTopicId] = { xp: 0 };
                        }
                        State.topicProgress[State.activeTopicId].xp += score;

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
    }

    if (component) app.appendChild(component);
}

// Initial Boot
if (window.DataService && window.DataService.init) {
    window.DataService.init().then(() => {
        initApp();
    });
} else {
    initApp();
}
