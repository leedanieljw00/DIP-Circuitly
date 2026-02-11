window.ProfileService = {
    profiles: [],
    activeProfileId: null,

    init: async function () {
        // We load the active user from localStorage (local browser context), 
        // but the DATA comes from the server.
        const active = localStorage.getItem('circuitly_active_profile');
        if (active) {
            this.activeProfileId = active;
        }
        await this.loadProfiles();
    },

    loadProfiles: async function () {
        try {
            const resp = await fetch('/api/profiles');
            this.profiles = await resp.json();
        } catch (e) {
            console.error("Failed to load profiles from server", e);
        }
    },

    getProfiles: function () {
        return this.profiles;
    },

    getActiveProfile: function () {
        if (!this.activeProfileId) return null;
        return this.profiles.find(p => p.studentId === this.activeProfileId);
    },

    setActiveProfile: function (studentId) {
        this.activeProfileId = studentId;
        localStorage.setItem('circuitly_active_profile', studentId);
    },

    addProfile: async function (profile) {
        // Validation
        if (!profile.name || !profile.studentId || !profile.username || !profile.password) {
            return { success: false, error: "All fields are required." };
        }

        const newProfile = {
            ...profile,
            createdAt: new Date().toISOString(),
            xp: 0,
            hearts: 5,
            topicProgress: {},
            stats: {}
        };

        try {
            const resp = await fetch('/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProfile)
            });
            const result = await resp.json();
            if (result.success) {
                await this.loadProfiles();
            }
            return result;
        } catch (e) {
            return { success: false, error: "Server connection failed" };
        }
    },

    authenticate: async function (username, password) {
        try {
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await resp.json();
            if (result.success) {
                this.setActiveProfile(result.profile.studentId);
                // After auth, make sure we have latest profiles
                await this.loadProfiles();
            }
            return result;
        } catch (e) {
            return { success: false, error: "Server connection failed" };
        }
    },

    deleteProfile: async function (studentId) {
        try {
            const resp = await fetch(`/api/profiles/${studentId}`, { method: 'DELETE' });
            if (resp.ok) {
                if (this.activeProfileId === studentId) {
                    this.activeProfileId = null;
                    localStorage.removeItem('circuitly_active_profile');
                }
                await this.loadProfiles();
            }
        } catch (e) {
            console.error("Failed to delete profile", e);
        }
    },

    resetProfile: async function (studentId) {
        await this.updateProgress(studentId, {
            xp: 0,
            hearts: 5,
            topicProgress: {},
            lastActive: new Date().toISOString()
        });
    },

    // Generic Progress Update
    updateProgress: async function (studentId, data) {
        try {
            const resp = await fetch(`/api/profiles/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (resp.ok) {
                await this.loadProfiles();
            }
        } catch (e) {
            console.error("Failed to update progress", e);
        }
    },

    updateStats: async function (studentId, topicId, xpAdded, timeAdded = 0) {
        const profile = this.profiles.find(p => p.studentId === studentId);
        if (profile) {
            const stats = profile.stats || {};
            if (!stats[topicId]) stats[topicId] = { xp: 0, time: 0 };

            stats[topicId].xp += xpAdded;
            if (timeAdded) {
                stats[topicId].time = (stats[topicId].time || 0) + timeAdded;
            }

            await this.updateProgress(studentId, { stats, lastActive: new Date().toISOString() });
        }
    },

    exportToExcel: function () {
        if (!window.XLSX) {
            alert("Excel export library (SheetJS) is not loaded.");
            return;
        }

        if (this.profiles.length === 0) {
            alert("No profiles to export.");
            return;
        }

        const dataForSheet = this.profiles.map(p => ({
            "Student Name": p.name,
            "Student ID": p.studentId,
            "Class/Group": p.classGroup || "N/A",
            "Date Added": new Date(p.createdAt).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(dataForSheet);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Profiles");

        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `PlayerProfiles_${dateStr}.xlsx`);
    }
};

// Auto-init on load
window.ProfileService.init();
