import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import imdbData from '../../../../../data/imdb_movies.json';

// Global In-Memory Cache (Across requests in same serverless instance)
const globalCache = {
    trailers: {}, // title -> youtubeId
    posters: {},  // title -> posterUrl
    casts: {}     // title -> castArray
};

// Map & Sanitize the imported data once
const mockMoviesDB = imdbData.movies.map((m, i) => {
    let poster = m.posterUrl;
    const isLegacy = poster && (poster.includes('images-amazon.com') || poster.includes('imdb.com'));
    if (isLegacy || !poster) poster = "https://placehold.co/300x450/1a1a2e/e2b616?text=CineScope";
    if (poster && poster.startsWith('http://')) poster = poster.replace('http://', 'https://');

    // Detect Bollywood based on Hindi script or ID range (147-161 in current JSON)
    const isHindi = m.title.match(/[\u0900-\u097F]/) || (m.id >= 147 && m.id <= 161);

    return {
        id: m.id || (1000 + i),
        title: m.title,
        overview: m.plot || "No plot available.",
        custom_poster_url: poster,
        year: m.year,
        release_date: m.year ? `${m.year}-01-01` : "2024-01-01",
        runtime: parseInt(m.runtime) || 120,
        genres: (m.genres || []).map(g => ({ name: g })),
        _originalCast: (m.actors || "").split(', ').map((name, idx) => ({ id: idx, name, character: "Lead" })),
        _director: m.director,
        _isBollywood: !!isHindi
    };
});

// Inject Tollywood Blockbusters (South Indian Cinema)
const tollywoodMovies = [
    { title: "RRR", year: "2022", plot: "A fictitious story about two legendary revolutionaries and their journey away from home before they started fighting for their country in 1920s.", genres: ["Action", "Drama"] },
    { title: "Baahubali: The Beginning", year: "2015", plot: "In ancient India, an adventurous and daring man becomes involved in a decades-old feud between two warring people.", genres: ["Action", "Adventure"] },
    { title: "Baahubali 2: The Conclusion", year: "2017", plot: "When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom.", genres: ["Action", "Drama"] },
    { title: "Pushpa: The Rise", year: "2021", plot: "A laborer rises through the ranks of a red sandalwood smuggling syndicate, making some powerful enemies along the way.", genres: ["Action", "Crime"] },
    { title: "K.G.F: Chapter 1", year: "2018", plot: "In the 1970s, a fierce rebel rises against brutal oppression and becomes the symbol of hope to legions of enslaved people.", genres: ["Action", "Drama"] },
    { title: "K.G.F: Chapter 2", year: "2022", plot: "The blood-soaked land of Kolar Gold Fields has a new overlord now - Rocky, whose name strikes fear in the heart of his foes.", genres: ["Action", "Drama"] },
    { title: "Magadheera", year: "2009", plot: "A bike stuntman recalls his previous life as a warrior, and sets out to find his reincarnated love.", genres: ["Action", "Fantasy"] },
    { title: "Eega", year: "2012", plot: "A murdered man is reincarnated as a housefly and seeks to avenge his death and protect his girlfriend from his killer.", genres: ["Action", "Comedy"] }
].map((m, i) => ({
    id: 5000 + i,
    title: m.title,
    overview: m.plot,
    year: m.year,
    runtime: 160,
    genres: m.genres.map(g => ({ name: g })),
    custom_poster_url: "https://placehold.co/300x450/1a1a2e/e2b616?text=CineScope", // Will be upgraded by scraper
    _originalCast: [], // Will be upgraded by scraper
    _isTollywood: true,
    release_date: `${m.year}-01-01`
}));

mockMoviesDB.push(...tollywoodMovies);

// Inject Modern Bollywood Hits
const bollywoodModern = [
    { title: "Pathaan", year: "2023", plot: "An Indian agent must take down a former agent who has turned rogue and is planning a biological attack on India.", genres: ["Action", "Adventure"] },
    { title: "Jawan", year: "2023", plot: "A mysterious man sets out to punish those responsible for his past while working for a social cause.", genres: ["Action", "Thriller"] },
    { title: "Brahmastra Part One: Shiva", year: "2022", plot: "A young man finds his world turned upside down as he discovers he has the power to control fire.", genres: ["Action", "Fantasy"] },
    { title: "Animal", year: "2023", plot: "A son's obsessive love for his father leads him down a path of violence and destruction.", genres: ["Action", "Crime"] },
    { title: "Dunki", year: "2023", plot: "Four friends from a village in Punjab share a common dream: to go to England.", genres: ["Comedy", "Drama"] }
].map((m, i) => ({
    id: 6000 + i,
    title: m.title,
    overview: m.plot,
    year: m.year,
    runtime: 160,
    genres: m.genres.map(g => ({ name: g })),
    custom_poster_url: "https://placehold.co/300x450/1a1a2e/e2b616?text=CineScope",
    _originalCast: [],
    _isBollywood: true,
    release_date: `${m.year}-01-01`
}));

mockMoviesDB.push(...bollywoodModern);

// Inject Modern Hollywood hits
const hollywoodModern = [
    { title: "Oppenheimer", year: "2023", plot: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", genres: ["Biography", "Drama", "History"] },
    { title: "Avatar: The Way of Water", year: "2022", plot: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.", genres: ["Action", "Adventure", "Sci-Fi"] },
    { title: "Dune: Part Two", year: "2024", plot: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.", genres: ["Action", "Adventure", "Sci-Fi"] },
].map((m, i) => ({
    id: 7000 + i,
    title: m.title,
    overview: m.plot,
    year: m.year,
    runtime: 180,
    genres: m.genres.map(g => ({ name: g })),
    custom_poster_url: "https://placehold.co/300x450/1a1a2e/e2b616?text=CineScope",
    _originalCast: [],
    _isHollywood: true,
    release_date: `${m.year}-01-01`
}));

mockMoviesDB.push(...hollywoodModern);

// Inject 2025 New Releases
const movies2025 = [
    { title: "Superman", year: "2025", plot: "A young reporter and a powerful alien must reconcile his heritage with his human upbringing.", genres: ["Action", "Sci-Fi"] },
    { title: "Mickey 17", year: "2025", plot: "Mickey 17 is an 'expendable', a disposable employee on a human expedition sent to colonize the ice world Niflheim.", genres: ["Sci-Fi", "Adventure"] },
    { title: "The Fantastic Four: First Steps", year: "2025", plot: "One of Marvel's most iconic families makes their debut in a retro-futuristic world.", genres: ["Action", "Adventure"] },
    { title: "War 2", year: "2025", plot: "A high-octane spy thriller following the next mission of India's top agents.", genres: ["Action", "Thriller"] },
    { title: "The Raja Saab", year: "2025", plot: "A romantic horror comedy set in a sprawling estate with mysterious secrets.", genres: ["Comedy", "Horror", "Romance"] },
    { title: "Vishwambhara", year: "2025", plot: "An epic socio-fantasy film exploring ancient myths and modern destinies.", genres: ["Fantasy", "Action"] },
    { title: "Alpha", year: "2025", plot: "The first female-led spy thriller in India's biggest action franchise.", genres: ["Action", "Thriller"] }
].map((m, i) => ({
    id: 8000 + i,
    title: m.title,
    overview: m.plot,
    year: m.year,
    runtime: 150,
    genres: m.genres.map(g => ({ name: g })),
    custom_poster_url: "https://placehold.co/300x450/1a1a2e/e2b616?text=CineScope",
    _originalCast: [],
    _is2025: true,
    release_date: `${m.year}-01-01`
}));

mockMoviesDB.push(...movies2025);

// Helpers (Simplified for migration)
async function getImdbCast(title, year) {
    if (globalCache.casts[title]) return globalCache.casts[title];
    try {
        const query = year ? `${title} ${year}` : title;
        const { data } = await axios.get(`https://m.imdb.com/find/?q=${encodeURIComponent(query)}&s=tt`, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        // Robust link finding: first link that looks like a title
        let moviePath = $('.ipc-metadata-list-summary-item__t').first().attr('href') || 
                        $('a[href*="/title/tt"]').first().attr('href');
        
        if (!moviePath) return [];

        const moviePage = await axios.get(`https://m.imdb.com${moviePath}`, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $$ = cheerio.load(moviePage.data);
        const cast = [];
        $$('[data-testid="title-cast-item"]').each((i, el) => {
            if (i >= 6) return; // Limit to 6 for speed
            const name = $$(el).find('[data-testid="title-cast-item__actor"]').text().trim();
            const character = $$(el).find('[data-testid="cast-item-characters-link"]').text().trim();
            const profileImg = $$(el).find('img').attr('src');
            if (name) {
                cast.push({
                    id: `s-${i}-${Date.now()}`,
                    name,
                    character: character || "Cast",
                    profile_url: profileImg ? profileImg.replace(/_V1_.*\.jpg$/, '_V1_.jpg') : null
                });
            }
        });
        globalCache.casts[title] = cast;
        return cast;
    } catch (e) { return []; }
}

async function getImdbPoster(title, year) {
    if (globalCache.posters[title]) return globalCache.posters[title];
    try {
        const query = year ? `${title} ${year}` : title;
        const { data } = await axios.get(`https://m.imdb.com/find/?q=${encodeURIComponent(query)}&s=tt`, { 
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        // Try multiple selectors for the poster
        const img = $('.ipc-image').first().attr('src') || 
                    $('.ipc-metadata-list-summary-item__image img').first().attr('src');
        
        const url = img ? img.replace(/_V1_.*\.jpg$/, '_V1_.jpg') : null;
        if (url) globalCache.posters[title] = url;
        return url;
    } catch (e) { return null; }
}

async function getYoutubeTrailer(title) {
    if (globalCache.trailers[title]) return globalCache.trailers[title];
    const queries = [`${title} official trailer`, `${title} movie trailer`];
    for (const query of queries) {
        try {
            // Internal scraper: fetch YouTube search results page
            const { data } = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
                timeout: 5000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
            });
            
            // Look for videoId in the page source via regex (most reliable for YouTube's dynamic content)
            const match = data.match(/"videoId":"([^"]+)"/);
            const videoId = match ? match[1] : null;

            if (videoId) {
                globalCache.trailers[title] = videoId;
                return videoId;
            }
        } catch (e) { continue; }
    }
    return 'dQw4w9WgXcQ';
}

export async function GET(request, { params }) {
    const category = params.category;
    const placeholder = "https://placehold.co/300x450/1a1a2e/e2b616?text=CineScope";
    
    // 1. Handle Individual Movie Lookup
    const movieId = parseInt(category);
    if (!isNaN(movieId)) {
        const found = mockMoviesDB.find(m => m.id === movieId);
        if (found) {
            const videoId = await getYoutubeTrailer(found.title);
            let poster = found.custom_poster_url;
            
            // Identity & Upgrade: Detect placeholders or broken legacy URLs
            const isPlaceholder = !poster || poster.includes('placehold.co');
            const isLegacy = poster && (poster.includes('images-amazon.com') || poster.includes('imdb.com'));
            const isInsecure = poster && poster.startsWith('http://');

            if (isPlaceholder || isLegacy || isInsecure) {
                const freshPoster = await getImdbPoster(found.title, found.year);
                if (freshPoster) {
                    poster = freshPoster;
                } else if (isLegacy || isInsecure) {
                    poster = placeholder; // Definitive fallback
                }
            }

            // Enforce HTTPS
            if (poster && poster.startsWith('http://')) poster = poster.replace('http://', 'https://');
            if (!poster) poster = placeholder;

            let cast = found._originalCast || [];
            // If cast is missing or generic (e.g., only "Lead"), try to scrape fresh data
            if (cast.length === 0 || cast.every(c => c.character === "Lead")) {
                const freshCast = await getImdbCast(found.title, found.year);
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
        const curatedIds = [5000, 6000, 7000, 6001, 5002, 7001, 6003, 5003, 7002, 3];
        results = curatedIds.map(id => mockMoviesDB.find(m => m.id === id)).filter(Boolean);
    } else if (category === 'bollywood') {
        results = mockMoviesDB.filter(m => m._isBollywood).slice(0, 10);
    } else if (category === 'tollywood') {
        results = mockMoviesDB.filter(m => m._isTollywood).slice(0, 10);
    } else if (category === 'new-released') {
        results = mockMoviesDB.filter(m => m._is2025).slice(0, 10);
    } else {
        results = mockMoviesDB.slice(0, 12);
    }

    const enhancedResults = await Promise.all(results.map(async (m) => {
        const videoId = await getYoutubeTrailer(m.title);
        let poster = m.custom_poster_url;
        
        // Identity & Upgrade: Detect placeholders or broken legacy URLs
        const isPlaceholder = !poster || poster.includes('placehold.co');
        const isLegacy = poster && (poster.includes('images-amazon.com') || poster.includes('imdb.com'));
        const isInsecure = poster && poster.startsWith('http://');

        if (isPlaceholder || isLegacy || isInsecure) {
            const freshPoster = await getImdbPoster(m.title, m.year);
            if (freshPoster) {
                poster = freshPoster;
            } else if (isLegacy || isInsecure) {
                poster = placeholder; // Definitive fallback
            }
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
