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

const TvSearch = () => {
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
                `/api/media-api/tmdb?query=${searchParams.query}&language=${searchParams.language}&page=${page}&mediaType=tv`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setResults(data.results.filter(result => result.media_type === 'tv'));
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch TV shows. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (item) => {
        const formData = {
            // Base media item data
            title: item.title,
            media_type: 'tv',
            category: 'General',
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,

            // TV-specific data from tv_details
            average_runtime: item.tv_details.average_runtime,
            episode_run_times: item.tv_details.episode_run_times,
            original_language: item.tv_details.original_language,
            release_date: item.tv_details.release_date,
            seasons: item.tv_details.seasons,
            tmdb_id: item.tv_details.tmdb_id,
            total_episodes: item.tv_details.total_episodes,
            vote_average: item.tv_details.vote_average,

            // Progress data
            duration: item.tv_details.total_episodes || 1, // Use total episodes as duration
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
                    placeholder="Search TV shows..."
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
                    <Card key={`tv-${result.tv_details.tmdb_id}`}>
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
                                {result.tv_details.release_date && (
                                    <p className="text-sm text-muted-foreground">
                                        First Air Date: {result.tv_details.release_date}
                                    </p>
                                )}
                                {result.tv_details.seasons > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Seasons: {result.tv_details.seasons}
                                    </p>
                                )}
                                {result.tv_details.total_episodes > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Episodes: {result.tv_details.total_episodes}
                                    </p>
                                )}
                                {result.tv_details.average_runtime > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Average Episode Runtime: {result.tv_details.average_runtime} min
                                    </p>
                                )}
                                {result.tv_details.vote_average > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Rating: {result.tv_details.vote_average}/10
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

export default TvSearch;