'use client';
import { useState } from 'react';
import useSearchStore from '@/store/searchStore';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from 'next-auth/react';
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BookSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        author: '',
    });
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
        e.preventDefault();

        if (!searchParams.query && !searchParams.author) {
            setError('Please enter either a title or an author.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/media-api/google-books?query=${searchParams.query}&author=${searchParams.author}`
            );
            const data = await response.json();
            setResults(data.results);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch books. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (item) => {
        const readingSpeed = session?.user?.readingSpeed || 20;
        const duration = Math.ceil(item.duration / readingSpeed * 30);

        const formData = {
            title: item.title,
            media_type: 'book',
            category: 'General',
            duration: duration,
            completed_duration: 0,
            percent_complete: 0,
            completed: false,
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            queue_number: null,
            additional: {
                ...item.additional,
                reading_speed: readingSpeed,
                estimated_reading_time: duration
            }
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result) => (
                    <Card key={`book-${result.additional.google_books_id}`}>
                        <CardContent className="p-4">
                            {result.poster_path && (
                                <img
                                    src={result.poster_path}
                                    alt={result.title}
                                    className="w-full h-auto rounded-lg mb-4"
                                />
                            )}
                            <h3 className="text-lg font-semibold mb-2">{result.title}</h3>
                            {result.additional.authors?.length > 0 && (
                                <p className="text-sm text-muted-foreground mb-2">
                                    By: {result.additional.authors.join(', ')}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground mb-4">
                                {result.description?.substring(0, 150)}...
                            </p>
                            <div className="space-y-1 mb-4">
                                {result.additional.publisher && (
                                    <p className="text-sm text-muted-foreground">
                                        Publisher: {result.additional.publisher}
                                    </p>
                                )}
                                {result.additional.page_count > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Pages: {result.additional.page_count}
                                    </p>
                                )}
                                {result.additional.published_date && (
                                    <p className="text-sm text-muted-foreground">
                                        Published: {result.additional.published_date}
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
        </div>
    );
};

export default BookSearch;