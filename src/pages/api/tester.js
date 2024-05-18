import { connectToDatabase } from '@/lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { name } = req.body;

    if (!name) {
        return res.status(422).json({ message: 'Name is required' });
    }

    try {
        console.log("Connecting to database...");
        const client = await connectToDatabase();
        const db = client.db("Mediaq");
        console.log("Connected to database");

        const result = await db.collection('items').insertOne({ name });
        console.log("Document inserted:", result);

        return res.status(201).json({ message: 'Document inserted', result });
    } catch (error) {
        console.error("Failed to insert document:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}