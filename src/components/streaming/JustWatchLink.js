'use client';

import { Button } from "@/components/ui/button";
import { ExternalLink, Play } from 'lucide-react';

export default function JustWatchLink({ title, mediaType, year, className }) {
    // Skip rendering if we don't have the necessary data
    if (!title) {
        return null;
    }

    // Format the title for the URL (spaces to hyphens, lowercase, remove special chars)
    const formattedTitle = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .trim();

    // Construct the JustWatch search URL
    // This will take users to JustWatch search results for the title
    const country = 'us';
    const justWatchUrl = `https://www.justwatch.com/${country}/search?q=${encodeURIComponent(title)}`;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <h3 className="text-sm font-medium">Where to Watch</h3>
            <a
                href={justWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex justify-between items-center bg-slate-900 dark:bg-slate-800 border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700 text-amber-400 hover:text-amber-300"
                >
                    <span className="flex items-center">
                        <Play className="h-4 w-4 mr-2" />
                        Find streaming options on JustWatch
                    </span>
                    <ExternalLink className="h-3 w-3" />
                </Button>
            </a>
            <p className="text-xs text-muted-foreground">
                Find where to stream, rent, or buy this title
            </p>
        </div>
    );
} 