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
import styles from './search.module.css';
import { Badge } from "@/components/ui/badge";
import JustWatchLink from '@/components/streaming/JustWatchLink';
import TmdbWatchProviders from '@/components/streaming/TmdbWatchProviders';

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
        <div className={styles.searchContainer}>
            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <h3 className={styles.searchFormTitle}>Search for Movies</h3>
                <div className={styles.inputGroup}>
                    <Input
                        type="text"
                        name="query"
                        placeholder="Movie title..."
                        value={searchParams.query}
                        onChange={handleInputChange}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            'Search'
                        )}
                    </Button>
                </div>
            </form>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <div className={styles.loaderContainer}>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className={styles.resultsGrid}>
                    {results.map((result) => (
                        <Card key={`movie-${result.movie_details.tmdb_id}`} className={`${styles.mediaCard} flex flex-col`}>
                            <CardContent className="p-4 flex flex-col h-full">
                                {result.poster_path && (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                                        alt={result.title}
                                        className={styles.mediaImage}
                                    />
                                )}
                                <h3 className={styles.mediaTitle}>{result.title}</h3>
                                {result.movie_details.release_date && (
                                    <p className={styles.mediaInfo}>
                                        Released: {result.movie_details.release_date}
                                    </p>
                                )}
                                <p className={`${styles.mediaDescription} line-clamp-3`}>
                                    {result.description}
                                </p>
                                <div className={`${styles.mediaMetadata} text-sm text-muted-foreground space-y-1`}>
                                    {result.movie_details.runtime > 0 && (
                                        <p>Runtime: {result.movie_details.runtime} min</p>
                                    )}
                                    {result.movie_details.vote_average > 0 && (
                                        <p>Rating: {result.movie_details.vote_average?.toFixed(1)}/10</p>
                                    )}
                                </div>
                                {result.movie_details.genres && (
                                    <div className={`${styles.badgeContainer} flex flex-wrap gap-1 mt-2 mb-3`}>
                                        {result.movie_details.genres.map((genre, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {genre}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2 justify-center pt-3 border-t mt-auto mb-3">
                                    <TmdbWatchProviders
                                        tmdbId={result.movie_details.tmdb_id}
                                        mediaType="movie"
                                        title={result.title}
                                        className="justify-center"
                                    />
                                </div>
                                <Button
                                    onClick={() => handleAdd(result)}
                                    className={styles.actionButton}
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

export default MovieSearch;