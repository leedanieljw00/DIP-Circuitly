const express = require('express');
const path = require('path');
const cors = require('cors');

const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to our JSON "Database"
const dbPath = path.join(__dirname, '..', 'database', 'profiles.json');

// Helper to read profiles from file
const readProfiles = () => {
    try {
        if (!fs.existsSync(dbPath)) return [];
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading profiles:", err);
        return [];
    }
};

// Helper to write profiles to file
const writeProfiles = (profiles) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(profiles, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing profiles:", err);
    }
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// --- Profile API ---

// Get all profiles (for selection screen)
app.get('/api/profiles', (req, res) => {
    const profiles = readProfiles();
    // Don't send passwords to the frontend for the list
    const safeProfiles = profiles.map(({ password, ...rest }) => rest);
    res.json(safeProfiles);
});

// Authenticate / Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Admin Backdoor
    if (username === 'admin' && password === 'admin') {
        return res.json({
            success: true,
            profile: { name: 'Administrator', studentId: 'ADMIN', role: 'admin', xp: 0, hearts: 999 }
        });
    }

    const profiles = readProfiles();
    const profile = profiles.find(p => p.username === username && p.password === password);

    if (profile) {
        res.json({ success: true, profile });
    } else {
        res.status(401).json({ success: false, error: "Invalid username or password" });
    }
});

// Register New Profile
app.post('/api/profiles', (req, res) => {
    const newProfile = req.body;
    const profiles = readProfiles();

    if (profiles.some(p => p.studentId === newProfile.studentId)) {
        return res.status(400).json({ success: false, error: "Student ID already exists" });
    }
    if (profiles.some(p => p.username === newProfile.username)) {
        return res.status(400).json({ success: false, error: "Username already taken" });
    }

    profiles.push(newProfile);
    writeProfiles(profiles);
    res.json({ success: true });
});

// Update Profile Progress (XP, Hearts, etc.)
app.put('/api/profiles/:studentId', (req, res) => {
    const { studentId } = req.params;
    const updateData = req.body;
    const profiles = readProfiles();

    const index = profiles.findIndex(p => p.studentId === studentId);
    if (index !== -1) {
        profiles[index] = { ...profiles[index], ...updateData };
        writeProfiles(profiles);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, error: "Profile not found" });
    }
});

// Delete Profile
app.delete('/api/profiles/:studentId', (req, res) => {
    const { studentId } = req.params;
    let profiles = readProfiles();
    const filtered = profiles.filter(p => p.studentId !== studentId);

    if (profiles.length !== filtered.length) {
        writeProfiles(filtered);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, error: "Profile not found" });
    }
});

// Example API Endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'Server is running',
        message: 'Welcome to Circuitly Backend!'
    });
});

// For any other routes, serve index.html (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 Circuitly Server is running!`);
    console.log(`🔗 Local Interface: http://localhost:${PORT}`);
    console.log(`📂 Serving Frontend from: ${frontendPath}`);
    console.log(`🗄️ Database: ${dbPath}`);
    console.log(`-------------------------------------------`);
});
