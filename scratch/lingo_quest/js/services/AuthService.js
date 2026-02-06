// Auth Service - Manages User Profiles
// Currently uses LocalStorage, but designed with Async methods to support future Server API migration.

const USER_STORAGE_KEY = 'circuitly_users_v1';
const SESSION_KEY = 'circuitly_session_user';

window.AuthService = {
    // Mimic database of users
    getUsers: async () => {
        const json = localStorage.getItem(USER_STORAGE_KEY);
        return json ? JSON.parse(json) : {}; // { "username": { xp: 0, progress: {} } }
    },

    // Get current logged in user name
    getCurrentUser: () => {
        return localStorage.getItem(SESSION_KEY);
    },

    // Login (Set Session)
    login: async (username) => {
        const users = await window.AuthService.getUsers();
        if (users[username]) {
            localStorage.setItem(SESSION_KEY, username);
            return { success: true, user: users[username] };
        }
        return { success: false, error: 'User not found' };
    },

    // Register (Create User)
    register: async (username) => {
        const users = await window.AuthService.getUsers();

        if (users[username]) {
            return { success: false, error: 'User already exists' };
        }

        // Initialize Default State
        users[username] = {
            username: username,
            xp: 0,
            hearts: 5,
            nextHeartRestoreTime: null, // timestamp when next heart restores
            topicProgress: {},
            created: new Date().toISOString()
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
        localStorage.setItem(SESSION_KEY, username); // Auto-login

        return { success: true, user: users[username] };
    },

    // Logout
    logout: async () => {
        localStorage.removeItem(SESSION_KEY);
        return { success: true };
    },

    // Save Progress (Sync)
    saveProgress: async (userData) => {
        const currentUser = window.AuthService.getCurrentUser();
        if (!currentUser) return;

        const users = await window.AuthService.getUsers();
        if (users[currentUser]) {
            // Update fields
            users[currentUser].xp = userData.xp;
            users[currentUser].hearts = userData.hearts;
            if (userData.nextHeartRestoreTime !== undefined) {
                users[currentUser].nextHeartRestoreTime = userData.nextHeartRestoreTime;
            }
            users[currentUser].topicProgress = userData.topicProgress;

            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
        }
    }
};
