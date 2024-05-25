// src/pages/api/signup.js
import { hashPassword } from "@/lib/auth";
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password, readingSpeed } = req.body;

    if (!email || !email.includes('@') || !password || password.trim().length < 7) {
        return res.status(422).json({
            message: 'Invalid input - password should also be at least 7 characters long.'
        });
    }

    try {
        await connectToMongoose();

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(422).json({ message: 'User exists already!' });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = new User({
            email: email,
            password: hashedPassword,
            readingSpeed: readingSpeed || 20, // Default to 20 if not provided
        });

        const result = await newUser.save();

        res.status(201).json({ message: 'Created user!' });
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}