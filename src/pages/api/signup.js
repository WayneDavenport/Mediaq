import { hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !email.includes('@') || !password || password.trim().length < 7) {
        return res.status(422).json({
            message: 'Invalid input - password should also be at least 7 characters long.'
        });
    }

    let client;

    try {
        client = await connectToDatabase();
        const db = client.db("Mediaq"); // Ensure you are using the correct database

        const existingUser = await db.collection('users').findOne({ email: email });
        if (existingUser) {
            return res.status(422).json({ message: 'User exists already!' });
        }

        const hashedPassword = await hashPassword(password);
        const result = await db.collection('users').insertOne({
            email: email,
            password: hashedPassword
        });

        res.status(201).json({ message: 'Created user!' });
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (client) {
            client.close();
        }
    }
}