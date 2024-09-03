// src/pages/api/signup.js
import { hashPassword } from "@/lib/auth";
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password, username, readingSpeed } = req.body;

    if (!email || !email.includes('@') || !password || password.trim().length < 7 || !username) {
        return res.status(422).json({
            message: 'Invalid input - password should be at least 7 characters long, and username is required.',
        });
    }

    // Basic validation for username
    const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!usernameRegex.test(username)) {
        return res.status(422).json({
            message: 'Invalid username - must be 3-15 characters long and can only contain letters, numbers, and underscores.',
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
            username: username, // Add username to the new user
            readingSpeed: readingSpeed || 20, // Default to 20 if not provided
        });

        const result = await newUser.save();

        res.status(201).json({ message: 'Created user!' });
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}