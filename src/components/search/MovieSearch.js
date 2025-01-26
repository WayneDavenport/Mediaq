'use client';
import { useState } from 'react';
import useSearchStore from '@/store/searchStore';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MovieSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        language: 'en-US',
    });
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const setStagingItem = useSearchStore((state) => state.setStagingItem);

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
        if (!searchParams.query) {
            setError('Please enter a search term');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/media-api/tmdb?query=${searchParams.query}&language=${searchParams.language}&page=${page}&mediaType=movie`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setResults(data.results.filter(result => result.media_type === 'movie'));
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch movies. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (item) => {
        const formData = {
            // Base media item data
            title: item.title,
            media_type: 'movie',
            category: 'General',
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            genres: item.genres || [],

            // Movie-specific data from movie_details
            director: item.movie_details.director,
            original_language: item.movie_details.original_language,
            release_date: item.movie_details.release_date,
            tmdb_id: item.movie_details.tmdb_id,
            vote_average: item.movie_details.vote_average,

            // Progress data
            duration: item.movie_details.runtime || 120, // Default to 120 minutes if runtime not provided
            queue_number: null,
            completed_duration: 0,
            completed: false,
        };

        setStagingItem(formData);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    type="text"
                    name="query"
                    placeholder="Search movies..."
                    value={searchParams.query}
                    onChange={handleInputChange}
                    required
                />
                <Button type="submit" disabled={isLoading}>
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

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result) => (
                    <Card key={`movie-${result.movie_details.tmdb_id}`}>
                        <CardContent className="p-4">
                            {result.poster_path && (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                                    alt={result.title}
                                    className="w-full h-auto rounded-lg mb-4"
                                />
                            )}
                            <h3 className="text-lg font-semibold mb-2">
                                {result.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {result.description?.substring(0, 150)}...
                            </p>
                            <div className="space-y-1 mb-4">
                                {result.movie_details.director && (
                                    <p className="text-sm text-muted-foreground">
                                        Director: {result.movie_details.director}
                                    </p>
                                )}
                                {result.movie_details.release_date && (
                                    <p className="text-sm text-muted-foreground">
                                        Release Date: {result.movie_details.release_date}
                                    </p>
                                )}
                                {result.movie_details.vote_average > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Rating: {result.movie_details.vote_average}/10
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
                            <span className="px-4">Page {page} of {totalPages}</span>
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

export default MovieSearch;