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

const MovieSearch = () => {
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
            const filteredResults = data.results.filter(result =>
                result.media_type === 'movie' && result.title && result.description
            );
            setResults(filteredResults);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (item) => {
        const formData = {
            title: item.title,
            media_type: 'movie',
            category: 'General',
            duration: item.duration || 0,
            completed_duration: 0,
            percent_complete: 0,
            completed: false,
            description: item.description,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            queue_number: null,
            additional: {
                tmdb_id: item.additional.tmdb_id,
                release_date: item.additional.release_date,
                director: item.additional.director,
                cast: item.credits?.cast?.slice(0, 3).map(cast => cast.name).join(', '),
                vote_average: item.additional.vote_average,
                original_language: item.additional.original_language,
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result) => (
                    <Card key={`movie-${result.additional.tmdb_id}`}>
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
                                {result.description.substring(0, 150)}...
                            </p>
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

export default MovieSearch;