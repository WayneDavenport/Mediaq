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
            title: item.title,
            media_type: 'game',       // Fixed system type
            category: 'General',      // Default category
            duration: item.duration || 0,
            completed_duration: 0,
            percent_complete: 0,
            completed: false,
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            queue_number: null,
            additional: {
                ...item.additional    // Preserve all the additional data from RAWG
            }
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
                    <Card key={`game-${result.additional.rawg_id}`}>
                        <CardContent className="p-4">
                            {result.poster_path && (
                                <img
                                    src={result.poster_path}
                                    alt={result.title}
                                    className="w-full h-auto rounded-lg mb-4 aspect-video object-cover"
                                />
                            )}
                            <h3 className="text-lg font-semibold mb-2">{result.title}</h3>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {result.additional.genres?.map((genre, index) => (
                                    <Badge key={index} variant="secondary">
                                        {genre}
                                    </Badge>
                                ))}
                            </div>

                            <p className="text-sm text-muted-foreground mb-4">
                                {result.description?.substring(0, 150)}...
                            </p>

                            <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                                {result.additional.release_date && (
                                    <p>Released: {new Date(result.additional.release_date).toLocaleDateString()}</p>
                                )}
                                {result.additional.developers?.length > 0 && (
                                    <p>Developer: {result.additional.developers[0]}</p>
                                )}
                                {result.additional.platforms?.length > 0 && (
                                    <p>Platforms: {result.additional.platforms.join(', ')}</p>
                                )}
                                {result.additional.metacritic && (
                                    <p>Metacritic: {result.additional.metacritic}</p>
                                )}
                                {result.additional.average_playtime > 0 && (
                                    <p>Average Playtime: {result.additional.average_playtime} hours</p>
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

            {results.length > 0 && (
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
                                    setPage(p => p + 1);
                                    handleSubmit(new Event('submit'));
                                }}
                                disabled={page >= totalPages || isLoading}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};

export default VideoGameSearch;