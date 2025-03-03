import { NextResponse } from 'next/server';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function GET(request) {
    // Add detailed logging for debugging
    console.log('Google Books API request received');

    const session = await getServerSession(authOptions);
    if (!session) {
        console.log('Unauthorized: No valid session');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const author = searchParams.get('author');

    console.log('Request params:', { query, author });
    console.log('API Key present:', !!GOOGLE_BOOKS_API_KEY);

    if (!GOOGLE_BOOKS_API_KEY) {
        console.error('Google Books API key is not defined in environment variables');
        return NextResponse.json(
            { error: 'Google Books API key is not defined' },
            { status: 500 }
        );
    }

    if (!query && !author) {
        console.log('Missing required parameters');
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

        console.log('Making request to Google Books API with params:', {
            ...params,
            key: '[REDACTED]' // Don't log the actual API key
        });

        const requestUrl = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(params.q)}&key=${params.key}&maxResults=${params.maxResults}`;
        console.log('Request URL (redacted):', requestUrl.replace(params.key, '[REDACTED]'));

        try {
            const response = await axios.get(GOOGLE_BOOKS_BASE_URL, { params });
            console.log('Google Books API response status:', response.status);
            console.log('Response has items:', !!response.data.items);

            if (!response.data.items) {
                console.log('No results found');
                return NextResponse.json({ results: [] });
            }

            console.log(`Found ${response.data.items.length} books`);

            const books = response.data.items.map(item => {
                const volumeInfo = item.volumeInfo;
                const industryIdentifiers = volumeInfo.industryIdentifiers || [];
                const isbn = industryIdentifiers.find(identifier =>
                    identifier.type === 'ISBN_13'
                )?.identifier || industryIdentifiers.find(identifier =>
                    identifier.type === 'ISBN_10'
                )?.identifier || '';

                // Base media item properties
                const mediaItem = {
                    title: volumeInfo.title,
                    media_type: 'book',
                    category: 'General',
                    description: volumeInfo.description || '',
                    poster_path: volumeInfo.imageLinks?.thumbnail || '',
                    backdrop_path: volumeInfo.imageLinks?.large || volumeInfo.imageLinks?.thumbnail || '',
                    genres: volumeInfo.categories || [],
                };

                // Book-specific properties
                const bookDetails = {
                    authors: volumeInfo.authors || [],
                    average_rating: volumeInfo.averageRating || 0,
                    categories: volumeInfo.categories || [],
                    estimated_reading_time: volumeInfo.pageCount ? Math.ceil(volumeInfo.pageCount / 30) : 0, // Rough estimate
                    google_books_id: item.id,
                    isbn: isbn,
                    language: volumeInfo.language || '',
                    page_count: volumeInfo.pageCount || 0,
                    preview_link: volumeInfo.previewLink || '',
                    published_date: volumeInfo.publishedDate || '',
                    publisher: volumeInfo.publisher || '',
                    ratings_count: volumeInfo.ratingsCount || 0,
                    reading_speed: 30, // Default pages per hour
                };

                // Progress tracking properties
                const progressDetails = {
                    duration: volumeInfo.pageCount || 0,
                    completed_duration: 0,
                    completed: false,
                    queue_number: null,
                };

                return {
                    ...mediaItem,
                    book_details: bookDetails,
                    progress: progressDetails,
                };
            });

            return NextResponse.json({ results: books });
        } catch (axiosError) {
            // Detailed axios error handling
            console.error('Axios error details:', {
                message: axiosError.message,
                status: axiosError.response?.status,
                data: axiosError.response?.data
            });

            return NextResponse.json(
                {
                    error: 'Error fetching data from Google Books API',
                    details: axiosError.response?.data || axiosError.message
                },
                { status: axiosError.response?.status || 500 }
            );
        }
    } catch (error) {
        console.error('General error in Google Books API route:', error);
        return NextResponse.json(
            { error: 'Error fetching data from Google Books API', details: error.message },
            { status: 500 }
        );
    }
}