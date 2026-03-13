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
async function getImdbCast(title) {
    try {
        // We search on mobile IMDB for better parsing
        const { data } = await axios.get(`https://m.imdb.com/find/?q=${encodeURIComponent(title)}&s=tt`, { timeout: 4000 });
        const $ = cheerio.load(data);
        
        // Find the first movie title link to get its page
        const moviePath = $('.ipc-metadata-list-summary-item__t').first().attr('href');
        if (!moviePath) return [];

        const moviePage = await axios.get(`https://m.imdb.com${moviePath}`, { timeout: 4000 });
        const $$ = cheerio.load(moviePage.data);
        
        const cast = [];
        $$('[data-testid="title-cast-item"]').each((i, el) => {
            if (i >= 10) return; // Limit to top 10
            const name = $$(el).find('[data-testid="title-cast-item__actor"]').text().trim();
            const character = $$(el).find('[data-testid="cast-item-characters-link"]').text().trim();
            const profileImg = $$(el).find('img').attr('src');
            if (name) {
                cast.push({
                    id: `scraped-${i}`,
                    name,
                    character: character || "Cast",
                    profile_url: profileImg ? profileImg.replace(/_V1_.*\.jpg$/, '_V1_.jpg') : null
                });
            }
        });
        return cast;
    } catch (e) { 
        console.error("Cast Scraping Error:", e.message);
        return []; 
    }
}

async function getImdbPoster(title) {
    try {
        const { data } = await axios.get(`https://m.imdb.com/find/?q=${encodeURIComponent(title)}&s=tt`, { timeout: 3000 });
        const $ = cheerio.load(data);
        const img = $('.ipc-image').first().attr('src');
        return img ? img.replace(/_V1_.*\.jpg$/, '_V1_.jpg') : null;
    } catch (e) { return null; }
}

async function getYoutubeTrailer(title) {
    const queries = [`${title} official trailer`, `${title} trailer`];
    for (const query of queries) {
        try {
            const res = await ytSearch.GetListByKeyword(query, false, 1, [{type: 'video'}]);
            const videoId = res.items?.[0]?.id || res.items?.[0]?.videoId;
            if (videoId) return videoId;
        } catch (e) { 
            console.error(`Youtube Search Error for "${query}":`, e.message);
        }
    }
    return 'dQw4w9WgXcQ'; // Ultimate fallback
}

export async function GET(request, { params }) {
    const category = params.category;
    const placeholder = "https://placehold.co/300x450/1a1a2e/e2b616?text=No+Poster+Found";
    
    // 1. Handle Individual Movie Lookup
    const movieId = parseInt(category);
    if (!isNaN(movieId)) {
        const found = mockMoviesDB.find(m => m.id === movieId);
        if (found) {
            const videoId = await getYoutubeTrailer(found.title);
            let poster = found.custom_poster_url;
            
            // Broaden detection: catch amazon, media-imdb, and any insecure http links
            const isLegacy = poster && (poster.includes('images-amazon.com') || poster.includes('imdb.com'));
            const isInsecure = poster && poster.startsWith('http://');

            if (!poster || isLegacy || isInsecure) {
                const freshPoster = await getImdbPoster(found.title);
                if (freshPoster) poster = freshPoster;
            }

            // Enforce HTTPS
            if (poster && poster.startsWith('http://')) poster = poster.replace('http://', 'https://');
            if (!poster) poster = placeholder;

            let cast = found._originalCast || [];
            // If cast is missing or generic (e.g., only "Lead"), try to scrape fresh data
            if (cast.length === 0 || cast.every(c => c.character === "Lead")) {
                const freshCast = await getImdbCast(found.title);
                if (freshCast && freshCast.length > 0) cast = freshCast;
            }

            // Standardize profile images
            cast = cast.map(actor => ({
                ...actor,
                custom_profile_url: actor.profile_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&size=300&background=random`
            }));

            const movieDetail = {
                ...found,
                custom_poster_url: poster,
                credits: { cast },
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
        
        const isLegacy = poster && (poster.includes('images-amazon.com') || poster.includes('imdb.com'));
        const isInsecure = poster && poster.startsWith('http://');

        if (!poster || isLegacy || isInsecure) {
            const freshPoster = await getImdbPoster(m.title);
            if (freshPoster) poster = freshPoster;
        }

        if (poster && poster.startsWith('http://')) poster = poster.replace('http://', 'https://');
        if (!poster) poster = placeholder;

        return {
            ...m,
            custom_poster_url: poster,
            custom_backdrop_url: poster,
            videos: { results: [{ type: 'Trailer', site: 'YouTube', key: videoId }] }
        };
    }));

    return NextResponse.json({ results: enhancedResults });
}
