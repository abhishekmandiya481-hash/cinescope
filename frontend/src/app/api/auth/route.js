import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// In-memory users (Persistent per serverless instance lifecycle)
if (!global.mockUsers) global.mockUsers = [];

export async function POST(request) {
    const { pathname } = new URL(request.url);
    const body = await request.json();

    if (pathname.includes('/register')) {
        const { username, email, password } = body;
        if (global.mockUsers.find(u => u.email === email)) {
            return NextResponse.json({ message: "User exists" }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { id: Date.now().toString(), username, email, password: hashedPassword };
        global.mockUsers.push(user);
        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET || "secret");
        return NextResponse.json({ token, user: { id: user.id, username, email } });
    }

    if (pathname.includes('/login')) {
        const { email, password } = body;
        const user = global.mockUsers.find(u => u.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
        }
        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET || "secret");
        return NextResponse.json({ token, user: { id: user.id, username: user.username, email } });
    }

    return NextResponse.json({ message: "Not found" }, { status: 404 });
}
