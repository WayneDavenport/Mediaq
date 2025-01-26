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
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VideoGameSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
    });
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
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

        if (!searchParams.query.trim()) {
            setError('Please enter a search term');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/media-api/rawg?query=${searchParams.query}&page=${page}`
            );
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setResults(data.results);
            setTotalPages(data.total_pages);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch games. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (item) => {
        const formData = {
            // Base media item data
            title: item.title,
            media_type: 'game',
            category: 'General',
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            genres: item.genres || [],

            // Game-specific data from game_details
            achievements_count: item.game_details.achievements_count,
            average_playtime: item.game_details.average_playtime,
            esrb_rating: item.game_details.esrb_rating,
            metacritic: item.game_details.metacritic,
            platforms: item.game_details.platforms,
            publishers: item.game_details.publishers,
            rating: item.game_details.rating,
            rating_count: item.game_details.rating_count,
            rawg_id: item.game_details.rawg_id,
            release_date: item.game_details.release_date,
            website: item.game_details.website,

            // Progress data
            duration: item.game_details.average_playtime, // Use average_playtime as duration
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
                    placeholder="Search video games..."
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
                    <Card key={`game-${result.game_details.rawg_id}`}>
                        <CardContent className="p-4">
                            {result.poster_path && (
                                <img
                                    src={result.poster_path}
                                    alt={result.title}
                                    className="w-full h-auto rounded-lg mb-4 aspect-video object-cover"
                                />
                            )}
                            <h3 className="text-lg font-semibold mb-2">
                                {result.title}
                            </h3>

                            {result.game_details.genres && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {result.game_details.genres.split(', ').map((genre, index) => (
                                        <Badge key={index} variant="secondary">
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground mb-4">
                                {result.description?.substring(0, 150)}...
                            </p>

                            <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                                {result.game_details.release_date && (
                                    <p>Released: {result.game_details.release_date}</p>
                                )}
                                {result.game_details.publishers && (
                                    <p>Publisher: {result.game_details.publishers}</p>
                                )}
                                {result.game_details.platforms && (
                                    <p>Platforms: {result.game_details.platforms}</p>
                                )}
                                {result.game_details.metacritic > 0 && (
                                    <p>Metacritic: {result.game_details.metacritic}</p>
                                )}
                                {result.game_details.average_playtime > 0 && (
                                    <p>Average Playtime: {result.game_details.average_playtime} hours</p>
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

export default VideoGameSearch;