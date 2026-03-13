require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("../routes/auth"));
app.use("/api/movies", require("../routes/movies"));
app.use("/api/user", require("../routes/user"));

app.get("/", (req, res) => {
    res.send("CineScope API is running");
});

// No Database connection needed; auth runs in-memory

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Local:   http://localhost:${PORT}`);
    });
}

const serverless = require("serverless-http");
module.exports = app;
module.exports.handler = serverless(app);
