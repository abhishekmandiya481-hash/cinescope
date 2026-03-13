import { NextResponse } from 'next/server';
import imdbData from '../../../../../data/imdb_movies.json';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').toLowerCase();
    const placeholder = "https://placehold.co/300x450/1a1a2e/e2b616?text=CineScope";
    
    try {
        const movies = imdbData.movies.map((m, i) => {
            let poster = m.posterUrl;
            const isLegacy = poster && (poster.includes('images-amazon.com') || poster.includes('imdb.com'));
            if (isLegacy || !poster) poster = placeholder;
            if (poster && poster.startsWith('http://')) poster = poster.replace('http://', 'https://');

            return {
                id: m.id || (1000 + i),
                title: m.title,
                overview: m.plot,
                custom_poster_url: poster
            };
        });

        const results = movies.filter(m => 
            m.title.toLowerCase().includes(query) || 
            m.overview?.toLowerCase().includes(query)
        ).slice(0, 10);

        return NextResponse.json({ results });
    } catch (e) {
        return NextResponse.json({ results: [] });
    }
}
