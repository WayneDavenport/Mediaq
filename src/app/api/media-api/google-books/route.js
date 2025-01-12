import { NextResponse } from 'next/server';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const author = searchParams.get('author');

    if (!GOOGLE_BOOKS_API_KEY) {
        return NextResponse.json(
            { error: 'Google Books API key is not defined' },
            { status: 500 }
        );
    }

    if (!query && !author) {
        return NextResponse.json(
            { error: 'Query or author parameter is required' },
            { status: 400 }
        );
    }

    try {
        const params = {
            q: query ? `intitle:${query}` : `inauthor:${author}`,
            key: GOOGLE_BOOKS_API_KEY,
            maxResults: 20,
        };

        const response = await axios.get(GOOGLE_BOOKS_BASE_URL, { params });

        if (!response.data.items) {
            return NextResponse.json({ results: [] });
        }

        const books = response.data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            const industryIdentifiers = volumeInfo.industryIdentifiers || [];
            const isbn = industryIdentifiers.find(identifier =>
                identifier.type === 'ISBN_13'
            )?.identifier || industryIdentifiers.find(identifier =>
                identifier.type === 'ISBN_10'
            )?.identifier || '';

            return {
                title: volumeInfo.title,
                media_type: 'book',
                category: 'General',
                description: volumeInfo.description || '',
                poster_path: volumeInfo.imageLinks?.thumbnail || '',
                backdrop_path: volumeInfo.imageLinks?.large || volumeInfo.imageLinks?.thumbnail || '',
                duration: volumeInfo.pageCount || 0, // Using pageCount as duration for books
                completed_duration: 0,
                percent_complete: 0,
                completed: false,
                additional: {
                    google_books_id: item.id,
                    authors: volumeInfo.authors || [],
                    publisher: volumeInfo.publisher || '',
                    published_date: volumeInfo.publishedDate || '',
                    isbn: isbn,
                    page_count: volumeInfo.pageCount || 0,
                    categories: volumeInfo.categories || [],
                    language: volumeInfo.language || '',
                    preview_link: volumeInfo.previewLink || '',
                    average_rating: volumeInfo.averageRating || 0,
                    ratings_count: volumeInfo.ratingsCount || 0,
                }
            };
        });

        return NextResponse.json({ results: books });

    } catch (error) {
        console.error('Error fetching data from Google Books API:', error);
        return NextResponse.json(
            { error: 'Error fetching data from Google Books API' },
            { status: 500 }
        );
    }
}