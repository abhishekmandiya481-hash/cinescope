const express = require("express");
const router = express.Router();
const axios = require("axios");
const ytSearch = require("youtube-search-api");
const cheerio = require("cheerio");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Utility function to fetch TMDB
const fetchTMDB = async (endpoint, params = {}) => {
    try {
        if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
            throw new Error("Missing Real TMDB API Key");
        }
        const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
            params: {
                api_key: TMDB_API_KEY,
                ...params
            }
        });
        return response.data;
    } catch (error) {
        console.warn(`TMDB API fallback activated for ${endpoint}:`, error.message);
        let fullPath = endpoint;
        if (Object.keys(params).length > 0) {
            const qs = new URLSearchParams(params).toString();
            fullPath += (fullPath.includes('?') ? '&' : '?') + qs;
        }
        return await getMockData(fullPath);
    }
};

const fs = require('fs');
const path = require('path');

let mockMoviesDB = [];
try {
    const rawData = fs.readFileSync(path.join(__dirname, '../data/imdb_movies.json'), 'utf-8');
    const imdbData = JSON.parse(rawData);
    
    // Convert IMDB format to TMDB format
    mockMoviesDB = imdbData.movies.map((m, i) => {
        // Parse actors into TMDB credits format
        const actorList = typeof m.actors === 'string' ? m.actors.split(', ') : [];
        const cast = actorList.map((actorName, idx) => ({
            id: idx,
            name: actorName,
            character: `Role ${idx + 1}`,
            profile_path: null,
            custom_profile_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&size=200&background=random`
        }));

        // Null out all known broken/dead CDN domains - frontend onError will handle fallback
        const BROKEN_DOMAINS = ['ia.media-imdb.com', 'images-na.ssl-images-amazon.com', 'images-amazon.com'];
        let posterUrl = m.posterUrl || null;
        if (posterUrl && BROKEN_DOMAINS.some(d => posterUrl.includes(d))) {
            posterUrl = null; // Will be fetched live or shown as placeholder
        }

        return {
            id: m.id || (1000 + i),
            title: m.title,
            overview: m.plot || "No plot available.",
            poster_path: null,
            custom_poster_url: posterUrl, // null means frontend onError placeholder kicks in
            backdrop_path: null,
            custom_backdrop_url: posterUrl,
            vote_average: parseFloat((Math.random() * 2 + 7).toFixed(1)),
            release_date: m.year ? `${m.year}-01-01` : "2000-01-01",
            year: m.year,
            runtime: parseInt(m.runtime) || 120,
            genres: (m.genres || []).map(g => ({ name: g })),
            _originalCast: cast,
            _director: m.director
        };
    });
} catch (e) {
    console.error("Error loading IMDB mock data:", e.message);
}

// Helper to get youtube trailer
const getYoutubeTrailer = async (movieTitle) => {
    try {
        const res = await ytSearch.GetListByKeyword(`${movieTitle} official trailer`, false, 1, [{type: 'video'}]);
        if (res.items && res.items.length > 0) {
            return res.items[0].id; // Returns the video ID
        }
    } catch (e) {
        console.error("Youtube Search Error:", e.message);
    }
    return 'dQw4w9WgXcQ'; // Rickroll fallback
};

// Helper to scrape IMDB cast images (HD versions)
const getImdbCastImage = async (actorName) => {
    try {
        const searchUrl = `https://m.imdb.com/find/?q=${encodeURIComponent(actorName)}&s=nm`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
        });
        const $ = cheerio.load(data);
        
        // Find the first image in the search results
        let img = $('.ipc-image').first().attr('src');
        if (img && img.startsWith('https://')) {
            // Strip sizing parameters for HD. e.g. ..._V1_UX140_CR0,0,140,140_.jpg -> ..._V1_.jpg
            return img.replace(/_V1_.*\.jpg$/, '_V1_.jpg');
        }
    } catch (e) {
        console.error("IMDB Cast Image Scrape Error for", actorName, ":", e.message);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(actorName)}&size=300&background=random`;
};

// Helper to scrape IMDB poster if missing or broken
const getImdbPoster = async (movieTitle) => {
    try {
        const searchUrl = `https://m.imdb.com/find/?q=${encodeURIComponent(movieTitle)}&s=tt`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
        });
        const $ = cheerio.load(data);
        let img = $('.ipc-image').first().attr('src');
        if (img && img.startsWith('https://')) {
            // Return Original Raw HD poster (Uncompressed)
            return img.replace(/_V1_.*\.jpg$/, '_V1_.jpg');
        }
    } catch (e) {
        console.error("IMDB Poster Scrape Error for", movieTitle, ":", e.message);
    }
    return null;
};

// Helper: Scrape Wikipedia for "2024 in film" trending titles
const scrapeWikipediaTrending = async () => {
    try {
        const url = 'https://en.wikipedia.org/wiki/2024_in_film';
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });
        const $ = cheerio.load(data);
        const titles = [];
        
        // Target the "Highest-grossing films" table (usually the first wikitable)
        $('.wikitable').first().find('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length > 0) {
                // Title is usually the 2nd column
                const title = $(cells[1]).text().trim();
                if (title && !title.match(/^\d+$/) && titles.length < 10) {
                    titles.push(title);
                }
            }
        });

        // Fallback if scraping fails to find enough
        if (titles.length < 5) return ['Inside Out 2', 'Deadpool & Wolverine', 'Despicable Me 4', 'Dune: Part Two', 'Godzilla x Kong: The New Empire'];
        return titles;
    } catch (e) {
        console.error("Wikipedia Scrape Error:", e.message);
        return ['Inside Out 2', 'Deadpool & Wolverine', 'Despicable Me 4', 'Dune: Part Two', 'Godzilla x Kong: The New Empire'];
    }
};

// Simple in-memory cache for speed enhancement
const CACHE_TTL = 3600000 * 24; // 24 hours
const cache = {
    trending: { data: null, timestamp: 0 },
    bollywood: { data: null, timestamp: 0 },
    tollywood: { data: null, timestamp: 0 },
    masterpieces: { data: null, timestamp: 0 },
    newReleased: { data: null, timestamp: 0 },
    popular: { data: null, timestamp: 0 },
    details: new Map() // Persistent shared details cache (movieId -> full movie object)
};

// Static Movie Pools for reliable lookup by ID (Persistent across restarts in code)
const STATIC_POOLS = {
    trending: [
        { id: 9510, title: "War Machine", year: "2017", runtime: "122", vote_average: 6.1, genres: ["Comedy", "Drama", "War"], overview: "A maverick general goes to Afghanistan full of big ideas and outsize ambition, only to find his efforts turn into a wildly surreal journey.", director: "David Michôd", stars: "Brad Pitt, Anthony Hayes, Tilda Swinton" },
        { id: 9511, title: "Accused", year: "2023", runtime: "44", vote_average: 7.2, genres: ["Crime", "Drama", "Thriller"], overview: "Each episode tells the story of a defendant's path to the courtroom, exploring what led them to this moment.", director: "Howard Gordon", stars: "Michael Chiklis, Jack Davenport, Wendell Pierce" },
        { id: 9512, title: "Dhurandhar", year: "2025", runtime: "214", vote_average: 8.3, genres: ["Action", "Thriller"], overview: "A mysterious traveler slips into Karachi's underworld and rises through the ranks with lethal precision, tearing the ISI-Underworld nexus apart from within.", director: "Aditya Dhar", stars: "Ranveer Singh, Akshaye Khanna, Sanjay Dutt" },
        { id: 9513, title: "Padmaavat", year: "2018", runtime: "163", vote_average: 7.0, genres: ["Action", "Drama", "History"], overview: "A Rajput queen and her husband face the obsessive desire of the ruthless Sultan Alauddin Khilji.", director: "Sanjay Leela Bhansali", stars: "Deepika Padukone, Ranveer Singh, Shahid Kapoor" },
        { id: 9514, title: "Chhaava", year: "2025", runtime: "161", vote_average: 7.3, genres: ["Action", "History"], overview: "After the death of his father, warrior-king Sambhaji Maharaj battles Mughal forces led by Aurangzeb to keep the Maratha Empire alive.", director: "Laxman Utekar", stars: "Vicky Kaushal, Akshaye Khanna, Rashmika Mandanna" },
        { id: 9515, title: "Superboys of Malegaon", year: "2024", runtime: "127", vote_average: 7.7, genres: ["Comedy", "Drama"], overview: "The journey of an aspiring filmmaker as he bands together his friends to make a film for his town, Malegaon.", director: "Reema Kagti", stars: "Adarsh Gourav, Shashank Arora, Vineet Kumar Singh" },
        { id: 9516, title: "Homebound", year: "2025", runtime: "119", vote_average: 7.9, genres: ["Drama"], overview: "Two friends from a North Indian village pursue police jobs seeking dignity, but their friendship strains as desperation grows.", director: "Neeraj Ghaywan", stars: "Ishaan Khatter, Vishal Jethwa, Janhvi Kapoor" },
        { id: 9517, title: "The Diplomat", year: "2025", runtime: "130", vote_average: 7.0, genres: ["Action", "Drama"], overview: "An Indian diplomat tries to repatriate an Indian girl from Pakistan, where she was forced into marriage against her will.", director: "Shivam Nair", stars: "John Abraham, Sadia Khateeb, Kumud Mishra" },
        { id: 9518, title: "Sitaare Zameen Par", year: "2025", runtime: "155", vote_average: 6.9, genres: ["Drama", "Sport"], overview: "After a DUI, an arrogant basketball coach must train neurodivergent adults for community service. His initial prejudice fades as his players show him a new perspective on life.", director: "R.S. Prasanna", stars: "Aamir Khan, Genelia Deshmukh, Ashish Pendse" },
        { id: 9519, title: "Santosh", year: "2024", runtime: "128", vote_average: 7.1, genres: ["Crime", "Drama"], overview: "Newly widowed Santosh inherits her husband's job as a police constable in rural India. When a girl's body is found, she's pulled into a dangerous investigation.", director: "Sandhya Suri", stars: "Shahana Goswami, Sunita Rajwar, Nawal Shukla" }
    ],
    tollywood: [
        { id: 8000, title: "RRR", stars: "N.T. Rama Rao Jr., Ram Charan, Alia Bhatt", director: "S. S. Rajamouli", year: "2022", runtime: "187", vote_average: 8.8, genres: ["Action", "Drama"], overview: "A tale of two legendary revolutionaries and their journey far from home before they began fighting for their country in the 1920s." },
        { id: 8001, title: "Pushpa: The Rule", stars: "Allu Arjun, Rashmika Mandanna, Fahadh Faasil", director: "Sukumar", year: "2024", runtime: "180", vote_average: 8.8, genres: ["Action", "Crime"], overview: "The clash between Pushpa and Bhanwar Singh continues in this epic conclusion to the two-part action drama." },
        { id: 8002, title: "Baahubali 2", stars: "Prabhas, Rana Daggubati, Anushka Shetty", director: "S. S. Rajamouli", year: "2017", runtime: "167", vote_average: 8.2, genres: ["Action", "Drama"], overview: "When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom." },
        { id: 8003, title: "KGF: Chapter 2", stars: "Yash, Sanjay Dutt, Raveena Tandon", director: "Prashanth Neel", year: "2022", runtime: "168", vote_average: 8.3, genres: ["Action", "Crime"], overview: "The blood-soaked land of Kolar Gold Fields (KGF) has a new overlord now - Rocky, whose name strikes fear in the heart of his foes." },
        { id: 8004, title: "Sita Ramam", stars: "Dulquer Salmaan, Mrunal Thakur, Rashmika Mandanna", director: "Hanu Raghavapudi", year: "2022", runtime: "163", vote_average: 8.6, genres: ["Action", "Drama", "Romance"], overview: "An orphan soldier, Lieutenant Ram's life changes, after he gets a letter from a girl named Sita. He meets her and love blossoms between them. When he returns to his camp in Kashmir, he sends a letter to Sita which will not reach her." },
        { id: 8005, title: "Vikram", stars: "Kamal Haasan, Vijay Sethupathi, Fahadh Faasil", director: "Lokesh Kanagaraj", year: "2022", runtime: "175", vote_average: 8.3, genres: ["Action", "Thriller"], overview: "A high-octane action film where a special agent investigates a series of murders committed by a masked group of serial killers." },
        { id: 8006, title: "Karthikeya 2", stars: "Nikhil Siddharth, Anupama Parameswaran", director: "Chandoo Mondeti", year: "2022", runtime: "145", vote_average: 8.0, genres: ["Adventure", "Fantasy"], overview: "A sequel to the 2014 film Karthikeya, this mystical thriller explores the secrets of Lord Krishna's anklet." },
        { id: 8007, title: "Salaar", stars: "Prabhas, Prithviraj Sukumaran", director: "Prashanth Neel", year: "2023", runtime: "175", vote_average: 7.5, genres: ["Action", "Drama"], overview: "A gang leader tries to keep a promise made to his dying friend and takes on the other criminal gangs." },
        { id: 8008, title: "Devara", stars: "N.T. Rama Rao Jr., Janhvi Kapoor", director: "Koratala Siva", year: "2024", runtime: "170", vote_average: 8.0, genres: ["Action", "Drama"], overview: "An epic action saga set against the backdrop of coastal lands, exploring the themes of power and legacy." },
        { id: 8009, title: "Game Changer", stars: "Ram Charan, Kiara Advani", director: "S. Shankar", year: "2025", runtime: "165", vote_average: 8.5, genres: ["Action", "Drama"], overview: "An honest IAS officer fights for electoral reforms against corrupt politicians in this political action drama." }
    ],
    bollywood: [
        { id: 7000, title: "3 Idiots", stars: "Aamir Khan, Madhavan, Kareena Kapoor", director: "Rajkumar Hirani", year: "2009", runtime: "170", vote_average: 8.4, genres: ["Comedy", "Drama"], overview: "Two friends are searching for their long lost companion. They revisit their college days.", custom_poster_url: "https://image.tmdb.org/t/p/w500/6699pSgyY9pSgyY9pSgyY9pSgy.jpg" },
        { id: 7001, title: "Dangal", stars: "Aamir Khan, Fatima Sana Shaikh", director: "Nitesh Tiwari", year: "2016", runtime: "161", vote_average: 8.3, genres: ["Action", "Biography", "Drama"], overview: "Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory.", custom_poster_url: "https://image.tmdb.org/t/p/w500/8cdWjvZQUmLIp9SbhIzG7oEpIB1.jpg" },
        { id: 7002, title: "Lagaan", stars: "Aamir Khan, Gracy Singh", director: "Ashutosh Gowariker", year: "2001", runtime: "224", vote_average: 8.1, genres: ["Drama", "Musical", "Sport"], overview: "The people of a small village in Victorian India stake their future on a game of cricket.", custom_poster_url: "https://image.tmdb.org/t/p/w500/z6c9pSgyY9pSgyY9pSgyY9pSgy.jpg" },
        { id: 7005, title: "Gully Boy", stars: "Ranveer Singh, Alia Bhatt", director: "Zoya Akhtar", year: "2019", runtime: "153", vote_average: 7.9, genres: ["Drama", "Music"], overview: "A coming-of-age story based on the lives of street rappers in Mumbai.", custom_poster_url: "https://image.tmdb.org/t/p/w500/t6c9pSgyY9pSgyY9pSgyY9pSgy.jpg" },
        { id: 7006, title: "Zindagi Na Milegi Dobara", stars: "Hrithik Roshan, Farhan Akhtar, Abhay Deol", director: "Zoya Akhtar", year: "2011", runtime: "155", vote_average: 8.2, genres: ["Comedy", "Drama"], overview: "Three friends decide to turn their fantasy vacation into reality.", custom_poster_url: "https://image.tmdb.org/t/p/w500/u6c9pSgyY9pSgyY9pSgyY9pSgy.jpg" },
        { id: 7010, title: "Jawan", stars: "Shah Rukh Khan, Nayanthara", director: "Atlee", year: "2023", runtime: "169", vote_average: 7.5, genres: ["Action", "Thriller"], overview: "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society.", custom_poster_url: "https://image.tmdb.org/t/p/w500/j6c9pSgyY9pSgyY9pSgyY9pSgy.jpg" },
        { id: 7011, title: "Pathaan", stars: "Shah Rukh Khan, Deepika Padukone", director: "Siddharth Anand", year: "2023", runtime: "146", vote_average: 6.8, genres: ["Action", "Thriller"], overview: "An Indian spy takes on the leader of a group of mercenaries who have nefarious plans to target his homeland.", custom_poster_url: "https://image.tmdb.org/t/p/w500/p6c9pSgyY9pSgyY9pSgyY9pSgy.jpg" }
    ],
    newReleased: [
        { id: 9600, title: "Avatar: Fire and Ash", stars: "Sam Worthington, Zoe Saldana", director: "James Cameron", year: "2025", runtime: "190", vote_average: 8.5, genres: ["Action", "Adventure", "Sci-Fi"], overview: "The third chapter in the epic Avatar saga.", custom_poster_url: "https://image.tmdb.org/t/p/w500/avatar3.jpg" },
        { id: 9602, title: "Superman", stars: "David Corenswet, Rachel Brosnahan", director: "James Gunn", year: "2025", runtime: "150", vote_average: 8.2, genres: ["Action", "Adventure", "Sci-Fi"], overview: "A new beginning for the Man of Steel.", custom_poster_url: "https://image.tmdb.org/t/p/w500/superman.jpg" },
        { id: 9604, title: "War 2", stars: "Hrithik Roshan, Jr NTR", director: "Ayan Mukerji", year: "2025", runtime: "160", vote_average: 8.4, genres: ["Action", "Thriller"], overview: "Two heavyweights collision.", custom_poster_url: "https://image.tmdb.org/t/p/w500/war2.jpg" }
    ],
    masterpieces: [
        { id: 6000, title: "The Godfather", stars: "Marlon Brando, Al Pacino", director: "Francis Ford Coppola", year: "1972", runtime: "175", vote_average: 9.2, genres: ["Crime", "Drama"], overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son." },
        { id: 6001, title: "The Dark Knight", stars: "Christian Bale, Heath Ledger", director: "Christopher Nolan", year: "2008", runtime: "152", vote_average: 9.0, genres: ["Action", "Crime", "Drama"], overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
        { id: 6002, title: "Inception", stars: "Leonardo DiCaprio, Joseph Gordon-Levitt", director: "Christopher Nolan", year: "2010", runtime: "148", vote_average: 8.8, genres: ["Action", "Adventure", "Sci-Fi"], overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O." },
        { id: 6003, title: "Interstellar", stars: "Matthew McConaughey, Anne Hathaway", director: "Christopher Nolan", year: "2014", runtime: "169", vote_average: 8.7, genres: ["Adventure", "Drama", "Sci-Fi"], overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." }
    ]
};

const getMockData = async (endpoint) => {
    const now = Date.now();

    if (endpoint.includes("/trending")) {
        const results = await Promise.all(STATIC_POOLS.trending.map(async (movie) => {
            const hdPoster = await getImdbPoster(movie.title);
            const videoId = await getYoutubeTrailer(movie.title);
            return {
                ...movie,
                release_date: `${movie.year}-01-01`,
                runtime: parseInt(movie.runtime),
                custom_poster_url: hdPoster || `https://placehold.co/500x750?text=${encodeURIComponent(movie.title)}`,
                custom_backdrop_url: hdPoster || `https://placehold.co/1920x1080?text=${encodeURIComponent(movie.title)}`,
                genres: movie.genres.map(g => ({ name: g })),
                _originalCast: movie.stars.split(', ').map((name, i) => ({ id: i, name, character: "Lead" })),
                _director: movie.director,
                videos: { results: [{ type: 'Trailer', site: 'YouTube', key: videoId }] }
            };
        }));
        
        cache.trending = { data: { results }, timestamp: now };
        return cache.trending.data;
    }
    
    if (endpoint.includes("/tollywood")) {
        // Check cache first to avoid repeated scraping
        if (cache.tollywood.data && (now - cache.tollywood.timestamp < CACHE_TTL)) {
            return cache.tollywood.data;
        }

        const results = await Promise.all(STATIC_POOLS.tollywood.map(async (movie) => {
            // Use details cache if already resolved
            if (cache.details.has(movie.id)) return cache.details.get(movie.id);

            const [hd, videoId] = await Promise.all([
                getImdbPoster(movie.title),
                getYoutubeTrailer(movie.title)
            ]);
            const m = {
                ...movie,
                release_date: `${movie.year}-01-01`,
                runtime: parseInt(movie.runtime),
                custom_poster_url: hd || `https://placehold.co/500x750?text=${encodeURIComponent(movie.title)}`,
                custom_backdrop_url: hd || `https://placehold.co/1920x1080?text=${encodeURIComponent(movie.title)}`,
                genres: movie.genres.map(g => ({ name: g })),
                _originalCast: movie.stars.split(', ').map((name, i) => ({ id: i, name, character: "Lead" })),
                _director: movie.director,
                videos: { results: [{ type: 'Trailer', site: 'YouTube', key: videoId }] },
                youtube_url: `https://www.youtube.com/watch?v=${videoId}`
            };
            cache.details.set(movie.id, m);
            return m;
        }));
        
        cache.tollywood = { data: { results }, timestamp: now };
        return cache.tollywood.data;
    }

    if (endpoint.includes("/popular")) {
        // Popular: Mix
        const items = mockMoviesDB.slice(0, 20);
        const results = await Promise.all(items.map(async m => {
            // Aggressively replace dead or low-quality links
            if (!m.custom_poster_url || 
                m.custom_poster_url === "" ||
                m.custom_poster_url.includes('ia.media-imdb.com') || 
                m.custom_poster_url.includes('images-na.ssl-images-amazon.com') ||
                m.custom_poster_url.includes('placehold.co')) {
                const hd = await getImdbPoster(m.title);
                if (hd) m.custom_poster_url = hd;
            }
            return m;
        }));
        return { results };
    }

    if (endpoint.includes("/new-released")) {
        // Cache check
        if (cache.newReleased.data && (now - cache.newReleased.timestamp < CACHE_TTL)) {
            return cache.newReleased.data;
        }

        const items = [...STATIC_POOLS.newReleased, ...mockMoviesDB.sort((a,b) => (parseInt(b.year)||0) - (parseInt(a.year)||0))].slice(0, 24);
        const results = await Promise.all(items.map(async m => {
            // Use details cache if already resolved
            if (cache.details.has(m.id)) return cache.details.get(m.id);

            const [hd, videoId] = await Promise.all([
                getImdbPoster(m.title),
                getYoutubeTrailer(m.title)
            ]);
            const movie = {
                ...m,
                release_date: `${m.year}-01-01`,
                runtime: parseInt(m.runtime) || 120,
                custom_poster_url: hd || m.custom_poster_url,
                custom_backdrop_url: hd || m.custom_backdrop_url,
                genres: (m.genres || []).map(g => (typeof g === 'string' ? { name: g } : g)),
                _originalCast: (m.stars || '').split(', ').map((name, i) => ({ id: i, name, character: "Lead" })),
                _director: m.director,
                videos: { results: [{ type: 'Trailer', site: 'YouTube', key: videoId }] },
                youtube_url: `https://www.youtube.com/watch?v=${videoId}`
            };
            cache.details.set(m.id, movie);
            return movie;
        }));
        
        cache.newReleased = { data: { results }, timestamp: now };
        return cache.newReleased.data;
    }

    if (endpoint.includes("/bollywood")) {
        if (cache.bollywood.data && (now - cache.bollywood.timestamp < CACHE_TTL)) return cache.bollywood.data;

        const results = await Promise.all(STATIC_POOLS.bollywood.map(async (movie) => {
            if (cache.details.has(movie.id)) return cache.details.get(movie.id);

            const hd = await getImdbPoster(movie.title);
            const m = {
                ...movie,
                release_date: `${movie.year}-01-01`,
                runtime: parseInt(movie.runtime),
                custom_poster_url: hd || `https://placehold.co/500x750?text=${encodeURIComponent(movie.title)}`,
                custom_backdrop_url: hd || `https://placehold.co/1920x1080?text=${encodeURIComponent(movie.title)}`,
                genres: movie.genres.map(g => ({ name: g })),
                _originalCast: movie.stars.split(', ').map((name, i) => ({ id: i, name, character: "Lead" })),
                _director: movie.director
            };
            cache.details.set(movie.id, m);
            return m;
        }));
        
        cache.bollywood = { data: { results }, timestamp: now };
        return cache.bollywood.data;
    }
    
    if (endpoint.includes("/masterpieces")) {
        const results = await Promise.all(STATIC_POOLS.masterpieces.map(async (movie) => {
            const hd = await getImdbPoster(movie.title);
            return {
                ...movie,
                release_date: `${movie.year}-01-01`,
                runtime: parseInt(movie.runtime),
                custom_poster_url: hd || `https://placehold.co/500x750?text=${encodeURIComponent(movie.title)}`,
                custom_backdrop_url: hd || `https://placehold.co/1920x1080?text=${encodeURIComponent(movie.title)}`,
                genres: movie.genres.map(g => ({ name: g })),
                _originalCast: movie.stars.split(', ').map((name, i) => ({ id: i, name, character: "Lead" })),
                _director: movie.director
            };
        }));
        
        cache.masterpieces = { data: { results }, timestamp: now };
        return cache.masterpieces.data;
    }

    if (endpoint.includes("/search")) {
        const urlPart = endpoint.split('?')[1] || '';
        const params = new URLSearchParams(urlPart);
        const query = (params.get('q') || params.get('query') || '').toLowerCase();
        console.log(`[MockSearch] Query: "${query}"`);
        
        // Search in Caches, Static Pools, and MockDB
        const searchPool = [
            ...mockMoviesDB,
            ...STATIC_POOLS.trending,
            ...STATIC_POOLS.bollywood,
            ...STATIC_POOLS.tollywood,
            ...STATIC_POOLS.masterpieces,
            ...STATIC_POOLS.newReleased
        ];

        const results = searchPool.filter(m => {
            if (!query) return true;
            const titleMatch = m.title.toLowerCase().includes(query);
            const genreMatch = m.genres && m.genres.some(g => (typeof g === 'string' ? g : g.name).toLowerCase().includes(query));
            const directorMatch = m.director && m.director.toLowerCase().includes(query);
            const castMatch = (m.stars || '').toLowerCase().includes(query);
            
            return titleMatch || genreMatch || directorMatch || castMatch;
        });
        
        // De-duplicate by ID
        const uniqueResults = [];
        const seenIds = new Set();
        for (const m of results) {
            if (!seenIds.has(m.id)) {
                seenIds.add(m.id);
                uniqueResults.push(m);
            }
        }

        console.log(`[MockSearch] Found ${uniqueResults.length} results`);
        return { results: uniqueResults.slice(0, 24) };
    }

    if (endpoint.includes("/movie/")) {
        const idMatch = endpoint.match(/movie\/(\d+)/);
        const movieId = idMatch ? parseInt(idMatch[1]) : null;
        
        if (!movieId) return { results: [] };

        // 1. Persist Check in individual caches or global details cache
        if (cache.details.has(movieId)) {
            const cachedMovie = cache.details.get(movieId);
            if (cachedMovie.credits && cachedMovie.credits.cast) return cachedMovie;
        }

        let movie = null;
        if (cache.details.has(movieId)) {
            movie = cache.details.get(movieId);
        }
        
        // 2. CHECK in ALL STATIC_POOLS
        for (const key in STATIC_POOLS) {
            const found = STATIC_POOLS[key].find(m => Number(m.id) === movieId);
            if (found) {
                movie = {
                    ...found,
                    release_date: `${found.year}-01-01`,
                    runtime: Number(found.runtime) || 120,
                    genres: (found.genres || []).map(g => (typeof g === 'string' ? { name: g } : g)),
                    _originalCast: (found.stars || '').split(', ').map((name, i) => ({ id: i, name, character: "Lead" })),
                    _director: found.director || "Unknown"
                };
                break;
            }
        }

        // 3. Fallback to mockMoviesDB
        if (!movie) {
            const found = mockMoviesDB.find(m => Number(m.id) === movieId);
            if (found) {
                movie = {
                    ...found,
                    genres: (found.genres || []).map(g => (typeof g === 'string' ? { name: g } : g)),
                    _originalCast: found._originalCast || [],
                    _director: found._director || found.director
                };
            }
        }

        if (!movie) {
            for (const key in STATIC_POOLS) {
                const found = STATIC_POOLS[key].find(m => Number(m.id) === movieId);
                if (found) {
                    console.log(`[DetailsLookup] Found in STATIC_POOLS.${key}: ${found.title}`);
                    movie = {
                        ...found,
                        release_date: `${found.year}-01-01`,
                        runtime: Number(found.runtime),
                        genres: found.genres.map(g => (typeof g === 'string' ? { name: g } : g)),
                        _originalCast: found.stars.split(', ').map((name, i) => ({ id: i, name, character: "Lead" })),
                        _director: found.director
                    };
                    break;
                }
            }
        }

        // 2. Check Caches
        if (!movie) {
            const allCached = [
                ...(cache?.trending?.data?.results || []),
                ...(cache?.tollywood?.data?.results || []),
                ...(cache?.bollywood?.data?.results || []),
                ...(cache?.masterpieces?.data?.results || []),
                ...(cache?.newReleased?.data?.results || [])
            ];
            movie = allCached.find(m => Number(m.id) === movieId);
            if (movie) console.log(`[DetailsLookup] Found in cache: ${movie.title}`);
        }

        // 3. Check Mock DB
        if (!movie) {
            movie = mockMoviesDB.find(m => Number(m.id) === movieId);
            if (movie) console.log(`[DetailsLookup] Found in mockMoviesDB: ${movie.title}`);
        }

        // 4. Default Fallback with Warning
        if (!movie) {
            console.warn(`[DetailsLookup] ID ${movieId} NOT FOUND. Defaulting to Beetlejuice.`);
            movie = mockMoviesDB[0];
        }
        
        const videoId = await getYoutubeTrailer(movie.title);
        
        // Safety for poster checks
        if (!movie.custom_poster_url || 
            (typeof movie.custom_poster_url === 'string' && (
                movie.custom_poster_url.includes('ia.media-imdb.com') || 
                movie.custom_poster_url.includes('images-na.ssl-images-amazon.com')
            ))) {
            const betterPoster = await getImdbPoster(movie.title);
            if (betterPoster) movie.custom_poster_url = betterPoster;
        }

        const topCast = (movie._originalCast || []).slice(0, 10); 
        const resolvedCast = await Promise.all(topCast.map(async (actor) => {
            const imgUrl = await getImdbCastImage(actor.name);
            return { ...actor, custom_profile_url: imgUrl };
        }));

        const safeGenres = movie.genres || [];
        const recommendations = mockMoviesDB
            .filter(m => m.id !== movieId)
            .slice(0, 12);
        
        const detailedMovie = {
            ...movie,
            credits: { cast: resolvedCast },
            videos: { results: [{ type: 'Trailer', site: 'YouTube', key: videoId }] },
            youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
            recommendations: { results: recommendations }
        };
        cache.details.set(movieId, detailedMovie);
        return detailedMovie;
    }

    return { results: [] };
};

router.get("/trending", async (req, res) => {
    try {
        const data = await getMockData('/trending');
        res.json(data);
    } catch (err) {
        res.status(500).send("Server Error fetching trending");
    }
});

router.get("/popular", async (req, res) => {
    try {
        const data = await fetchTMDB("/movie/popular");
        res.json(data);
    } catch (err) {
        res.status(500).send("Server Error fetching popular");
    }
});

router.get('/new-released', async (req, res) => {
    try {
        const data = await getMockData('/new-released');
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/bollywood', async (req, res) => {
    try {
        const data = await getMockData('/bollywood');
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/tollywood', async (req, res) => {
    try {
        const data = await getMockData('/tollywood');
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/masterpieces', async (req, res) => {
    try {
        const data = await getMockData('/masterpieces');
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: flush all caches so updated static pools are picked up
router.get('/flush-cache', (req, res) => {
    cache.trending = { data: null, timestamp: 0 };
    cache.bollywood = { data: null, timestamp: 0 };
    cache.tollywood = { data: null, timestamp: 0 };
    cache.masterpieces = { data: null, timestamp: 0 };
    cache.newReleased = { data: null, timestamp: 0 };
    cache.popular = { data: null, timestamp: 0 };
    cache.details.clear();
    console.log('[Cache] All caches flushed.');
    res.json({ success: true, message: 'All caches flushed.' });
});

router.get("/search", async (req, res) => {
    try {
        const query = req.query.q;
        const data = await fetchTMDB("/search/movie", { query });
        res.json(data);
    } catch (err) {
        res.status(500).send("Server Error searching movies");
    }
});

router.get("/:id", async (req, res) => {
    try {
        // Fetch movie details with append_to_response to get cast and videos in one request
        const data = await fetchTMDB(`/movie/${req.params.id}`, {
            append_to_response: "credits,videos,recommendations"
        });
        
        // If it's mock data (no real TMDB), the fetchTMDB will return a promise we need to await if it falls back.
        // Wait, fetchTMDB is already async and handles it. But we changed getMockData to async.
        // Make sure it handles the async return properly. 
        res.json(data);
    } catch (err) {
        console.error("Crash in /movie/:id :", err);
        res.status(500).send("Server Error fetching movie details");
    }
});

module.exports = router;
