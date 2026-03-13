# CineScope 🎬

**CineScope** is a cinematic movie discovery and recommendation platform built with **Next.js** and **Node.js (Express)**. It features a sleek, responsive UI, real-time movie scraping, and integrated search to help users find their next favorite film.

![CineScope Preview](https://placehold.co/1200x600?text=CineScope+Dynamic+UI+Preview)

## 🚀 Features

- **Dynamic Discovery**: Browse Trending, Popular, Bollywood, and Tollywood hits.
- **Masterpieces Section**: Hand-picked cinematic classics.
- **Real-time Scaping**: Fetches HD posters and cast information from IMDB and Wikipedia.
- **Smart Search**: Find movies by title, genre, director, or cast.
- **Trailer Integration**: Instant access to official YouTube trailers.
- **Modern UI/UX**: Built with Next.js 14, featuring glassmorphism and smooth animations.
- **In-Memory Auth**: Secure Google OAuth integration and JWT-based user sessions.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, CSS Modules, React OAuth (Google).
- **Backend**: Node.js, Express, Axios, Cheerio (Scraping), JWT.
- **APIs**: The Movie Database (TMDB), YouTube Search API.

## 📦 Project Structure

```text
├── backend/            # Express Server & API Routes
│   ├── data/           # Mock data (IMDB JSON)
│   ├── routes/         # Logic for movies, auth, and user profiles
│   └── server.js       # Entry point
├── frontend/           # Next.js Application
│   ├── src/app/        # Pages and Layouts
│   ├── src/components/ # Reusable UI Components
│   └── src/services/   # API Connection logic
└── .gitignore          # Repository exclusions
```

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/abhishekmandiya481-hash/cinescope.git
cd cinescope
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
TMDB_API_KEY=your_tmdb_api_key_here
JWT_SECRET=your_super_secret_key
```
Run the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Run the frontend:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app!

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Created with ❤️ by [Abhishek Mandiya](https://github.com/abhishekmandiya481-hash)
