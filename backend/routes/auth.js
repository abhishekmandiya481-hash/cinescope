const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');

// Use global memory array for users
if (!global.mockUsers) global.mockUsers = [];

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Find existing
        let user = global.mockUsers.find(u => u.email === email);
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            watchlist: [],
            ratings: []
        };
        global.mockUsers.push(user);

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "10h" }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ message: "No credential provided" });

        // If using dummy ID, reject properly so frontend knows
        if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
             return res.status(500).json({ message: "Google Client ID not configured on server." });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, name, sub } = payload; // sub is google unqiue id

        let user = global.mockUsers.find(u => u.email === email);
        
        if (!user) {
            // Create a new user for Google Sign in (Password is a random secure string since they use Google)
            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);
            
            user = {
                id: Date.now().toString(),
                username: name || email.split('@')[0], 
                email: email, 
                password: hashedPassword,
                watchlist: [],
                ratings: []
            };
            global.mockUsers.push(user);
        }

        const jwtPayload = { user: { id: user.id } };
        jwt.sign(jwtPayload, process.env.JWT_SECRET || "secret", { expiresIn: "10h" }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });

    } catch (err) {
        console.error("Google Auth Error:", err.message);
        res.status(500).json({ message: "Google authentication failed" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        let user = global.mockUsers.find(u => u.email === email);
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "10h" }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
