import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import ytSearch from 'youtube-search-api';
import * as cheerio from 'cheerio';

export async function GET(request, { params }) {
    const movieId = parseInt(params.id);
    const filePath = path.join(process.cwd(), 'data/imdb_movies.json');
    let movie = null;

    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const db = JSON.parse(rawData).movies;
        const found = db.find((m, i) => (m.id || (1000 + i)) === movieId);
        
        if (found) {
            const videoId = await getYoutubeTrailer(found.title);
            let poster = found.posterUrl;

            if (poster && (poster.includes('images-na.ssl-images-amazon.com') || poster.includes('ia.media-imdb.com'))) {
                const freshPoster = await getImdbPoster(found.title);
                if (freshPoster) poster = freshPoster;
            }

            if (!poster) poster = "https://via.placeholder.com/300x450?text=No+Poster+Found";

            movie = {
                id: movieId,
                title: found.title,
                overview: found.plot,
                custom_poster_url: poster,
                year: found.year,
                genres: (found.genres || []).map(g => ({ name: g })),
                credits: { cast: (found.actors || "").split(', ').map((name, i) => ({ id: i, name, character: "Lead" })) },
                videos: { results: [{ type: 'Trailer', key: videoId, site: 'YouTube' }] }
            };
        }
    } catch (e) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }

    if (!movie) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json(movie);
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
    try {
        const res = await ytSearch.GetListByKeyword(`${title} official trailer`, false, 1, [{type: 'video'}]);
        return res.items?.[0]?.id || 'dQw4w9WgXcQ';
    } catch (e) { return 'dQw4w9WgXcQ'; }
}
