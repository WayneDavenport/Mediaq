'use client';

import { Button } from "@/components/ui/button";
import { ExternalLink, Play } from 'lucide-react';

export default function JustWatchLink({ title, mediaType, year, className, iconOnly = false }) {
    // Skip rendering if we don't have the title
    if (!title) {
        return null;
    }

    // Construct the search query - include year if available
    const searchQuery = year ? `${title} ${year}` : title;

    // Construct the JustWatch search URL using the combined query
    const country = 'us'; // Or make this configurable if needed
    const justWatchUrl = `https://www.justwatch.com/${country}/search?q=${encodeURIComponent(searchQuery)}`;

    if (iconOnly) {
        return (
            <a
                href={justWatchUrl}
                target="_blank"
                rel="noopener noreferrer nofollow" // Added nofollow
                title={`Check ${title} on JustWatch`}
                className={`text-amber-500 hover:text-amber-400 transition-colors p-1 rounded hover:bg-muted ${className || ''}`}
                onClick={(e) => e.stopPropagation()} // Prevent card click
            >
                <Play className="h-4 w-4" />
                <span className="sr-only">Check JustWatch</span>
            </a>
        );
    }

    // Original full display for dashboard/expanded view
    return (
        <div className={`flex flex-col gap-2 ${className || ''}`}>
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
                        Check JustWatch
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