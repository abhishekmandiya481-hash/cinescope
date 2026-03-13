const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Use global memory array for users
if (!global.mockUsers) global.mockUsers = [];

// Get user profile including watchlist and ratings
router.get("/profile", auth, async (req, res) => {
    try {
        const user = global.mockUsers.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Add/Remove from Watchlist
router.post("/watchlist", auth, async (req, res) => {
    const { movieId, title, posterPath } = req.body;
    try {
        const user = global.mockUsers.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const index = user.watchlist.findIndex(item => item.movieId === movieId.toString());
        
        if (index > -1) {
            // Remove if already exists
            user.watchlist.splice(index, 1);
        } else {
            // Add if doesn't exist
            user.watchlist.unshift({ movieId, title, posterPath, addedAt: new Date() });
        }
        
        // Save back to array (reference is usually updated automatically but doing it explicitly)
        const uIndex = global.mockUsers.findIndex(u => u.id === req.user.id);
        if (uIndex !== -1) global.mockUsers[uIndex] = user;

        res.json(user.watchlist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Rate a movie
router.post("/rating", auth, async (req, res) => {
    const { movieId, rating } = req.body;
    try {
        const user = global.mockUsers.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const index = user.ratings.findIndex(item => item.movieId === movieId.toString());
        
        if (index > -1) {
            user.ratings[index].rating = rating;
        } else {
            user.ratings.push({ movieId, rating, ratedAt: new Date() });
        }
        
        const uIndex = global.mockUsers.findIndex(u => u.id === req.user.id);
        if (uIndex !== -1) global.mockUsers[uIndex] = user;

        res.json(user.ratings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
