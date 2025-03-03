'use client';
import { useState } from 'react';
import useSearchStore from '@/store/searchStore';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from 'next-auth/react';
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";

const BookSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        author: '',
    });
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const setStagingItem = useSearchStore((state) => state.setStagingItem);
    const { data: session } = useSession();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams({
            ...searchParams,
            [name]: value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`/api/media-api/google-books?query=${encodeURIComponent(searchParams.query)}&author=${encodeURIComponent(searchParams.author)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setResults(data.results);
            setTotalPages(data.total_pages || 1);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch books. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (item) => {
        const readingSpeed = session?.user?.readingSpeed || 30;
        const estimatedTime = Math.ceil(item.book_details.page_count / readingSpeed);

        const formData = {
            // Base media item data
            title: item.title,
            media_type: 'book',
            category: 'General',
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            genres: item.genres || [],

            // Book-specific data from book_details
            authors: item.book_details.authors,
            average_rating: item.book_details.average_rating,
            categories: item.book_details.categories,
            estimated_reading_time: estimatedTime,
            google_books_id: item.book_details.google_books_id,
            isbn: item.book_details.isbn,
            language: item.book_details.language,
            page_count: item.book_details.page_count,
            preview_link: item.book_details.preview_link,
            published_date: item.book_details.published_date,
            publisher: item.book_details.publisher,
            ratings_count: item.book_details.ratings_count,
            reading_speed: readingSpeed,

            // Progress data
            duration: item.book_details.page_count, // Use page count as duration
            queue_number: null,
            completed_duration: 0,
            completed: false,
            pages_completed: 0,
            episodes_completed: null,
        };

        setStagingItem(formData);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                    type="text"
                    name="query"
                    placeholder="Book title..."
                    value={searchParams.query}
                    onChange={handleInputChange}
                />
                <Input
                    type="text"
                    name="author"
                    placeholder="Author name..."
                    value={searchParams.author}
                    onChange={handleInputChange}
                />
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Searching
                        </>
                    ) : (
                        'Search'
                    )}
                </Button>
            </form>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((result) => (
                        <Card key={`book-${result.book_details.google_books_id}`}>
                            <CardContent className="p-4">
                                {result.poster_path && (
                                    <img
                                        src={result.poster_path}
                                        alt={result.title}
                                        className="w-full h-auto rounded-lg mb-4"
                                    />
                                )}
                                <h3 className="text-lg font-semibold mb-2">
                                    {result.title}
                                </h3>
                                {result.book_details.authors?.length > 0 && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        By: {result.book_details.authors.join(', ')}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground mb-4">
                                    {result.description?.substring(0, 150)}...
                                </p>
                                <div className="space-y-1 mb-4">
                                    {result.book_details.publisher && (
                                        <p className="text-sm text-muted-foreground">
                                            Publisher: {result.book_details.publisher}
                                        </p>
                                    )}
                                    {result.book_details.page_count > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Pages: {result.book_details.page_count}
                                        </p>
                                    )}
                                    {result.book_details.published_date && (
                                        <p className="text-sm text-muted-foreground">
                                            Published: {result.book_details.published_date}
                                        </p>
                                    )}
                                    {result.genres && result.genres.length > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Genres: {result.genres.join(', ')}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    onClick={() => handleAdd(result)}
                                    className="w-full"
                                >
                                    Add to Queue
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {results.length > 0 && totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => {
                                    setPage(p => Math.max(1, p - 1));
                                    handleSubmit(new Event('submit'));
                                }}
                                disabled={page === 1 || isLoading}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => {
                                    setPage(p => Math.min(totalPages, p + 1));
                                    handleSubmit(new Event('submit'));
                                }}
                                disabled={page === totalPages || isLoading}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};

export default BookSearch;