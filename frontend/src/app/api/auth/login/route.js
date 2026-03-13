import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

if (!global.mockUsers) global.mockUsers = [];

export async function POST(request) {
    try {
        const { email, password } = await request.json();
        const user = global.mockUsers.find(u => u.email === email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
        }
        const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET || "secret");
        return NextResponse.json({ token, user: { id: user.id, username: user.username, email } });
    } catch (e) {
        return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
}
