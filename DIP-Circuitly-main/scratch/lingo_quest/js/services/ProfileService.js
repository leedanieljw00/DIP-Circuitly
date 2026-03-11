window.ProfileService = {
    STORAGE_KEY: 'circuitly_profiles',
    ACTIVE_KEY: 'circuitly_active_profile',
    profiles: [],
    activeProfileId: null,

    init: function () {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.profiles = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse profiles", e);
                this.profiles = [];
            }
        }

        const active = localStorage.getItem(this.ACTIVE_KEY);
        if (active) {
            this.activeProfileId = active;
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
        localStorage.setItem(this.ACTIVE_KEY, studentId);
    },

    addProfile: function (profile) {
        // Validation
        if (!profile.name || !profile.studentId || !profile.username || !profile.password) {
            return { success: false, error: "All fields are required (Name, ID, Username, Password)." };
        }

        // Check for duplicate ID
        if (this.profiles.some(p => p.studentId === profile.studentId)) {
            return { success: false, error: "Student ID already exists." };
        }

        // Check for duplicate Username
        if (this.profiles.some(p => p.username === profile.username)) {
            return { success: false, error: "Username already taken." };
        }

        const newProfile = {
            ...profile,
            createdAt: new Date().toISOString(),
            // Default App State
            xp: 0,
            hearts: 5,
            topicProgress: {},
            stats: {}
        };

        this.profiles.push(newProfile);
        this.save();
        return { success: true };
    },

    authenticate: function (username, password) {
        // Admin Backdoor
        if (username === 'admin' && password === 'admin') {
            return {
                success: true,
                profile: {
                    name: 'Administrator',
                    studentId: 'ADMIN',
                    role: 'admin',
                    xp: 0,
                    hearts: 999
                }
            };
        }

        const profile = this.profiles.find(p => p.username === username && p.password === password);
        if (profile) {
            this.setActiveProfile(profile.studentId);
            return { success: true, profile };
        }
        return { success: false, error: "Invalid username or password." };
    },

    deleteProfile: function (studentId) {
        this.profiles = this.profiles.filter(p => p.studentId !== studentId);
        if (this.activeProfileId === studentId) {
            this.activeProfileId = null;
            localStorage.removeItem(this.ACTIVE_KEY);
        }
        this.save();
    },

    resetProfile: function (studentId) {
        const profile = this.profiles.find(p => p.studentId === studentId);
        if (profile) {
            profile.xp = 0;
            profile.hearts = 5;
            profile.topicProgress = {};
            profile.lastActive = new Date().toISOString();
            this.save();
        }
    },

    // Generic Progress Update
    updateProgress: function (studentId, data) {
        const profile = this.profiles.find(p => p.studentId === studentId);
        if (profile) {
            // Merge data (xp, hearts, topicProgress)
            if (data.xp !== undefined) profile.xp = data.xp;
            if (data.hearts !== undefined) profile.hearts = data.hearts;
            if (data.topicProgress !== undefined) profile.topicProgress = data.topicProgress;

            profile.lastActive = new Date().toISOString();
            this.save();
        }
    },

    updateStats: function (studentId, topicId, xpAdded, timeAdded = 0) {
        const profile = this.profiles.find(p => p.studentId === studentId);
        if (profile) {
            if (!profile.stats) profile.stats = {};
            if (!profile.stats[topicId]) profile.stats[topicId] = { xp: 0, time: 0 };

            profile.stats[topicId].xp += xpAdded;
            if (timeAdded) {
                profile.stats[topicId].time = (profile.stats[topicId].time || 0) + timeAdded;
            }

            // Also update timestamp
            profile.lastActive = new Date().toISOString();
            this.save();
        }
    },

    save: function () {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profiles));
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

        // 1. Convert data to worksheet
        const dataForSheet = this.profiles.map(p => {
            const row = {
                "Student Name": p.name,
                "Student ID": p.studentId,
                "Class/Group": p.classGroup || "N/A",
                "Username": p.username,
                "Total XP": p.xp || 0,
                "Hearts": p.hearts,
                "Date Joined": new Date(p.createdAt).toLocaleDateString(),
                "Last Active": p.lastActive ? new Date(p.lastActive).toLocaleString() : "Never"
            };

            // Add stats for all 8 topics
            // We know there are 8 topics, let's loop consistently
            for (let i = 1; i <= 8; i++) {
                const stat = (p.stats && p.stats[i]) ? p.stats[i] : { xp: 0, time: 0 };
                // Format time: convert seconds/ms to minutes or keep as minutes
                // Assuming time is stored in seconds? 
                // Previous code said "timeAdded" but didn't specify unit. 
                // Let's assume raw value is seconds for better precision or minutes if that was the convention.
                // Looking at `updateStats` in this file: 
                // `profile.stats[topicId].time = (profile.stats[topicId].time || 0) + timeAdded;`
                // We'll export the raw number and label it (assuming it's accurate to what's sent).

                row[`Topic ${i} XP`] = stat.xp;
                row[`Topic ${i} Time`] = stat.time;
            }

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(dataForSheet);

        // Adjust column widths for better readability
        const wscols = [
            { wch: 20 }, // Name
            { wch: 15 }, // ID
            { wch: 15 }, // Class
            { wch: 15 }, // Username
            { wch: 10 }, // XP
            { wch: 8 },  // Hearts
            { wch: 12 }, // Date
            { wch: 20 }  // Last Active
        ];
        // Add widths for topic columns (2 per topic = 16 more cols)
        for (let i = 0; i < 16; i++) wscols.push({ wch: 10 });

        ws['!cols'] = wscols;

        // 2. Create workbook and add the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student Profiles");

        // 3. Generate file and trigger download
        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `Circuitly_Student_Data_${dateStr}.xlsx`);
    }
};

// Auto-init on load
window.ProfileService.init();
