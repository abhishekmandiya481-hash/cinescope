import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

if (!global.mockUsers) global.mockUsers = [];

const verifyAuth = (request) => {
    const token = request.headers.get("x-auth-token");
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        return decoded.user;
    } catch (e) { return null; }
};

export async function GET(request) {
    const userAuth = verifyAuth(request);
    if (!userAuth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = global.mockUsers.find(u => u.id === userAuth.id);
    if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });
    
    return NextResponse.json(user.watchlist || []);
}

export async function POST(request) {
    const userAuth = verifyAuth(request);
    if (!userAuth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { movieId, title, posterPath } = await request.json();
    const user = global.mockUsers.find(u => u.id === userAuth.id);
    if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (!user.watchlist) user.watchlist = [];
    const index = user.watchlist.findIndex(m => m.movieId === movieId.toString());
    
    if (index > -1) {
        user.watchlist.splice(index, 1);
    } else {
        user.watchlist.unshift({ movieId, title, posterPath, addedAt: new Date() });
    }

    return NextResponse.json(user.watchlist);
}
