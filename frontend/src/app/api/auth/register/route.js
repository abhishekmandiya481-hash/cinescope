import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

if (!global.mockUsers) global.mockUsers = [];

export async function POST(request) {
    try {
        const { username, email, password } = await request.json();
        
        if (global.mockUsers.find(u => u.username === username)) {
            return NextResponse.json({ message: "Username has already been taken" }, { status: 400 });
        }

        if (global.mockUsers.find(u => u.email === email)) {
            return NextResponse.json({ message: "Email has already been taken" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { id: Date.now().toString(), username, email, password: hashedPassword, watchlist: [], ratings: [] };
        global.mockUsers.push(user);
        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET || "secret");
        return NextResponse.json({ token, user: { id: user.id, username, email } });
    } catch (e) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
