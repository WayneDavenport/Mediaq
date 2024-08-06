// src/pages/api/googleBooks.js
import axios from 'axios';

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export default async function handler(req, res) {
    const { query, author } = req.query;

    if (!GOOGLE_BOOKS_API_KEY) {
        return res.status(500).json({ error: 'Google Books API key is not defined' });
    }

    if (!query && !author) {
        return res.status(400).json({ error: 'Query or author parameter is required' });
    }

    const params = {
        q: query ? `intitle:${query}` : `inauthor:${author}`,
        key: GOOGLE_BOOKS_API_KEY,
    };

    try {
        const response = await axios.get(GOOGLE_BOOKS_BASE_URL, { params });
        const books = response.data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            const industryIdentifiers = volumeInfo.industryIdentifiers || [];
            const isbn = industryIdentifiers.find(identifier => identifier.type === 'ISBN_13')?.identifier || industryIdentifiers.find(identifier => identifier.type === 'ISBN_10')?.identifier || '';

            return {
                title: volumeInfo.title,
                authors: volumeInfo.authors,
                description: volumeInfo.description,
                publisher: volumeInfo.publisher,
                pageCount: volumeInfo.pageCount,
                wordCount: volumeInfo.wordCount, // Note: Google Books API does not provide word count directly
                isbn, // Include ISBN
            };
        });
        return res.status(200).json({ books });
    } catch (error) {
        console.error('Error fetching data from Google Books API:', error);
        return res.status(500).json({ error: 'Error fetching data from Google Books API' });
    }
}