const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    watchlist: [{
        movieId: String,
        title: String,
        posterPath: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    ratings: [{
        movieId: String,
        rating: Number,
        ratedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
