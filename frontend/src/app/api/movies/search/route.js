import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').toLowerCase();
    
    const filePath = path.join(process.cwd(), 'data/imdb_movies.json');
    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const movies = JSON.parse(rawData).movies.map((m, i) => ({
            id: m.id || (1000 + i),
            title: m.title,
            overview: m.plot,
            custom_poster_url: m.posterUrl
        }));

        const results = movies.filter(m => 
            m.title.toLowerCase().includes(query) || 
            m.overview?.toLowerCase().includes(query)
        ).slice(0, 20);

        return NextResponse.json({ results });
    } catch (e) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
