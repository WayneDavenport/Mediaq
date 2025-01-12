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

const TvSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        language: 'en-US',
    });
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const setStagingItem = useSearchStore((state) => state.setStagingItem);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams({
            ...searchParams,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/media-api/tmdb?query=${searchParams.query}&language=${searchParams.language}&page=${page}`
            );
            const data = await response.json();
            console.log('API Response:', data);

            // Only use TV shows from the results
            const tvShows = data.results.filter(item => item.media_type === 'tv');
            setResults(tvShows);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEpisodeRuntime = async (showId, seasonNumber, episodeNumber) => {
        try {
            const response = await fetch(
                `/api/media-api/tmdb/episode?showId=${showId}&seasonNumber=${seasonNumber}&episodeNumber=${episodeNumber}`
            );
            const data = await response.json();
            return data.runtime;
        } catch (error) {
            console.error('Error fetching episode runtime:', error);
            return undefined;
        }
    };

    const calculateAverageRuntime = async (showId, seasonNumber) => {
        const episodeNumbers = [1, 2, 3]; // Sample first 3 episodes
        const runtimes = await Promise.all(
            episodeNumbers.map(episodeNumber => fetchEpisodeRuntime(showId, seasonNumber, episodeNumber))
        );
        const validRuntimes = runtimes.filter(runtime => runtime !== undefined);
        return validRuntimes.length > 0
            ? Math.round(validRuntimes.reduce((acc, runtime) => acc + runtime, 0) / validRuntimes.length)
            : 0;
    };

    const handleAdd = async (item) => {
        console.log('Adding TV show:', item);

        // Calculate average runtime before creating formData
        const averageRuntime = await calculateAverageRuntime(
            item.additional.tmdb_id,
            1  // Start with season 1
        );

        const formData = {
            title: item.title,
            media_type: 'tv',
            category: 'General',
            duration: averageRuntime,  // Use the calculated average runtime
            completed_duration: 0,
            percent_complete: 0,
            completed: false,
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            queue_number: null,
            additional: {
                ...item.additional,
                average_runtime: averageRuntime
            }
        };

        console.log('FormData being sent to staging:', formData);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result) => (
                    <Card key={`tv-${result.additional.tmdb_id}`}>
                        <CardContent className="p-4">
                            {result.poster_path && (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                                    alt={result.title}
                                    className="w-full h-auto rounded-lg mb-4"
                                />
                            )}
                            <h3 className="text-lg font-semibold mb-2">{result.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {result.description?.substring(0, 150)}...
                            </p>
                            {result.additional.release_date && (
                                <p className="text-sm text-muted-foreground mb-2">
                                    First Air Date: {result.additional.release_date}
                                </p>
                            )}
                            {result.additional.seasons && (
                                <p className="text-sm text-muted-foreground mb-2">
                                    Seasons: {result.additional.seasons}
                                </p>
                            )}
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
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="px-4">Page {page}</span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setPage(p => p + 1)}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};

export default TvSearch;