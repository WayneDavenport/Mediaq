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
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>Please sign in to access this page</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Media Search</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {!stagingItem && (
                    <Card className="p-4">
                        <Select
                            value={mediaType}
                            onValueChange={(value) => setMediaType(value)}
                        >
                            <SelectTrigger className="w-full mb-4">
                                <SelectValue placeholder="Select media type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="movie">Movie</SelectItem>
                                <SelectItem value="tv">TV Show</SelectItem>

                                <SelectItem value="book">Book</SelectItem>

                                <SelectItem value="videoGame">Video Game</SelectItem>
                            </SelectContent>
                        </Select>

                        {mediaType === 'movie' && <MovieSearch />}
                        {mediaType === 'tv' && <TvSearch />}

                        {mediaType === 'book' && <BookSearch />}

                        {mediaType === 'videoGame' && <VideoGameSearch />}
                    </Card>
                )}

                <Card>
                    <CardContent className="p-6">
                        {stagingItem ? (
                            <Staging />
                        ) : (
                            <div className="text-center">
                                <p className="text-muted-foreground">
                                    Search for any books, movies, shows, or video games to add to your queue!
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Button asChild className="mt-6">
                <Link href='/user-pages/dashboard'>Back to Dashboard</Link>
            </Button>
        </div>
    );
}