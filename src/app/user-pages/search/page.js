'use client'
import { useState } from 'react';
import MovieSearch from '@/components/search/MovieSearch';
import TvSearch from '@/components/search/TvSearch';
import Staging from '@/components/search/Staging';
import BookSearch from '@/components/search/BookSearch';
import VideoGameSearch from '@/components/search/VideoGameSearch';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import useSearchStore from '@/store/searchStore';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
    const [mediaType, setMediaType] = useState('movie');
    const { data: session, status } = useSession();
    const stagingItem = useSearchStore((state) => state.stagingItem);

    if (status === "loading") {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div className="flex h-screen items-center justify-center">Please sign in to access this page</div>;
    }

    return (
        <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8 flex justify-center">
            <div className="w-full max-w-7xl">
                {/* Header with responsive spacing */}
                <div className="flex items-center justify-between mb-6 px-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">Media Search</h1>
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                    >
                        <Link href='/user-pages/dashboard'>Dashboard</Link>
                    </Button>
                </div>

                {/* Main content area */}
                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                    {/* Search section */}
                    {!stagingItem && (
                        <Card className="w-full">
                            <div className="p-4 space-y-4">
                                <Select
                                    value={mediaType}
                                    onValueChange={(value) => setMediaType(value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select media type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="movie">Movie</SelectItem>
                                        <SelectItem value="tv">TV Show</SelectItem>
                                        <SelectItem value="book">Book</SelectItem>
                                        <SelectItem value="videoGame">Video Game</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="overflow-y-auto max-h-[calc(100vh-300px)] sm:max-h-[600px] rounded-lg">
                                    {mediaType === 'movie' && <MovieSearch />}
                                    {mediaType === 'tv' && <TvSearch />}
                                    {mediaType === 'book' && <BookSearch />}
                                    {mediaType === 'videoGame' && <VideoGameSearch />}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Staging section */}
                    <Card className="w-full">
                        <CardContent className="p-4 sm:p-6">
                            {stagingItem ? (
                                <Staging />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center space-y-4">
                                    <p className="text-muted-foreground max-w-md">
                                        Search for any books, movies, shows, or video games to add to your queue!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}