import { NextResponse } from 'next/server';
import axios from 'axios';
import ytSearch from 'youtube-search-api';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Mock DB Cache (Global in serverless instance)
let mockMoviesDB = [];
try {
    const filePath = path.join(process.cwd(), 'data/imdb_movies.json');
    if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        mockMoviesDB = JSON.parse(rawData).movies.map((m, i) => ({
            id: m.id || (1000 + i),
            title: m.title,
            overview: m.plot || "No plot available.",
            custom_poster_url: m.posterUrl,
            year: m.year,
            runtime: parseInt(m.runtime) || 120,
            genres: (m.genres || []).map(g => ({ name: g })),
            _originalCast: (m.actors || "").split(', ').map((name, idx) => ({ id: idx, name, character: "Lead" })),
            _director: m.director
        }));
    }
} catch (e) {
    console.error("Error loading mock data:", e.message);
}

// Helpers (Simplified for migration)
async function getImdbPoster(title) {
    try {
        const { data } = await axios.get(`https://m.imdb.com/find/?q=${encodeURIComponent(title)}&s=tt`, { timeout: 3000 });
        const $ = cheerio.load(data);
        const img = $('.ipc-image').first().attr('src');
        return img ? img.replace(/_V1_.*\.jpg$/, '_V1_.jpg') : null;
    } catch (e) { return null; }
}

async function getYoutubeTrailer(title) {
    try {
        // Search for title + official trailer
        const res = await ytSearch.GetListByKeyword(`${title} official trailer`, false, 1, [{type: 'video'}]);
        // youtube-search-api returns items[0].id for video ID
        const videoId = res.items?.[0]?.id || res.items?.[0]?.videoId;
        return videoId || 'dQw4w9WgXcQ'; // Fallback to a valid trailer id (Never Gonna Give You Up as a last resort)
    } catch (e) { 
        console.error("Youtube Search Error:", e.message);
        return 'dQw4w9WgXcQ'; 
    }
}

export async function GET(request, { params }) {
    const category = params.category;
    
    // 1. Handle Individual Movie Lookup (if category is a numeric ID)
    const movieId = parseInt(category);
    if (!isNaN(movieId)) {
        const found = mockMoviesDB.find(m => m.id === movieId);
        if (found) {
            const videoId = await getYoutubeTrailer(found.title);
            let poster = found.custom_poster_url;
            
            if (poster && (poster.includes('images-na.ssl-images-amazon.com') || poster.includes('ia.media-imdb.com'))) {
                const freshPoster = await getImdbPoster(found.title);
                if (freshPoster) poster = freshPoster;
            }

            if (!poster) poster = "https://via.placeholder.com/300x450?text=No+Poster+Found";

            const movieDetail = {
                ...found,
                custom_poster_url: poster,
                credits: { cast: found._originalCast || [] },
                videos: { results: [{ type: 'Trailer', key: videoId, site: 'YouTube' }] }
            };
            return NextResponse.json(movieDetail);
        }
        return NextResponse.json({ message: "Movie not found" }, { status: 404 });
    }

    // 2. Handle Category Lists
    let results = [];
    if (category === 'trending' || category === 'popular') {
        results = mockMoviesDB.slice(0, 10);
    } else if (category === 'bollywood') {
        results = mockMoviesDB.filter(m => m.title.match(/[\u0900-\u097F]/) || m.id > 1000).slice(0, 10);
    } else {
        results = mockMoviesDB.slice(0, 12);
    }

    const enhancedResults = await Promise.all(results.map(async (m) => {
        const videoId = await getYoutubeTrailer(m.title);
        let poster = m.custom_poster_url;
        
        if (poster && (poster.includes('images-na.ssl-images-amazon.com') || poster.includes('ia.media-imdb.com'))) {
            const freshPoster = await getImdbPoster(m.title);
            if (freshPoster) poster = freshPoster;
        }

        if (!poster) poster = "https://via.placeholder.com/300x450?text=No+Poster+Found";

        return {
            ...m,
            custom_poster_url: poster,
            custom_backdrop_url: poster,
            videos: { results: [{ type: 'Trailer', site: 'YouTube', key: videoId }] }
        };
    }));

    return NextResponse.json({ results: enhancedResults });
}
