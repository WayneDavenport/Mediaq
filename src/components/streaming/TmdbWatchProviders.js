'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Use Next.js Image for optimization
import { Loader2, AlertCircle, Play } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Base URL for TMDB images (adjust size like w45, w92 as needed)
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w45';

export default function TmdbWatchProviders({ tmdbId, mediaType, title, className }) {
    // Store the whole response now
    const [providerData, setProviderData] = useState({ flatrate: [], rent: [], buy: [], link: null, allProviders: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tmdbId || !mediaType) {
            setIsLoading(false);
            setError("Missing ID or type");
            return;
        }

        setIsLoading(true);
        setProviderData({ flatrate: [], rent: [], buy: [], link: null, allProviders: [] }); // Reset
        setError(null);

        const fetchProviders = async () => {
            try {
                // Fetch from your backend route
                const response = await fetch(`/api/watch-providers?id=${tmdbId}&type=${mediaType}&country=US`); // Hardcoding US for now

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({})); // Try to get error details
                    throw new Error(errorData.error || `HTTP error ${response.status}`);
                }

                const data = await response.json();
                // Now expecting the full structure including allProviders
                if (!data || !data.allProviders) {
                    setError("Invalid provider data received.");
                } else if (data.allProviders.length === 0 && !data.link) {
                    setError("No provider data available."); // More specific message
                } else {
                    setProviderData(data);
                }

            } catch (err) {
                console.error("Failed to fetch watch providers:", err);
                setError(err.message || "Could not load providers.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProviders();

    }, [tmdbId, mediaType]);

    // Determine which providers to display (Prioritize flatrate, fallback to all unique)
    // Filter 'allProviders' to get only those also listed in 'flatrate'
    const streamingProviders = providerData.allProviders.filter(p =>
        providerData.flatrate.some(f => f.provider_id === p.provider_id)
    );

    // Decide which list to actually map over for display
    const providersToDisplay = streamingProviders.length > 0
        ? streamingProviders
        : providerData.allProviders; // Fallback to showing any provider if no streaming found

    const hasDisplayableProviders = providersToDisplay.length > 0;
    const mainLink = providerData.link; // The overall JustWatch/TMDB link

    // ----- Render Logic -----

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-8 ${className || ''}`}>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Render nothing meaningful if error or no providers
    if (error && error !== "No provider data available.") {
        console.log(`Error loading providers for ${title}: ${error}`);
        // Optionally show a subtle error indicator
        return (
            <div className={`flex items-center justify-center h-8 ${className || ''}`} title={error}>
                <AlertCircle className="h-4 w-4 text-destructive/50" />
            </div>
        );
    }

    // Handle case with no providers AND no main link
    if (!hasDisplayableProviders && !mainLink) {
        console.log(`No providers or link found for ${title}`);
        // Render nothing or a subtle message
        return null;
        // Or: return <span className={`text-xs text-muted-foreground ${className || ''}`}>Not available</span>;
    }

    // Render the logos and/or the main link
    return (
        <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
            <TooltipProvider delayDuration={100}>
                {/* Display Logos if available */}
                {hasDisplayableProviders && providersToDisplay.slice(0, 5).map((provider) => (
                    <Tooltip key={provider.provider_id}>
                        <TooltipTrigger asChild>
                            {/* Link the logo to the main JustWatch link IF it exists */}
                            {mainLink ? (
                                <a href={mainLink} target="_blank" rel="noopener noreferrer nofollow" className="block">
                                    <Image
                                        src={`${TMDB_IMAGE_BASE_URL}${provider.logo_path}`}
                                        alt={provider.provider_name}
                                        width={28} height={28}
                                        className="rounded block" // Added block display
                                        unoptimized
                                    />
                                </a>
                            ) : (
                                // Render image without link if no mainLink
                                <Image
                                    src={`${TMDB_IMAGE_BASE_URL}${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    width={28} height={28}
                                    className="rounded block" // Added block display
                                    unoptimized
                                />
                            )}
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{provider.provider_name}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}

                {/* Indicate if more logos were available but truncated */}
                {hasDisplayableProviders && providersToDisplay.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{providersToDisplay.length - 5} more</span>
                )}

                {/* If there's a main link but NO logos were displayed, show a generic link */}
                {!hasDisplayableProviders && mainLink && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a href={mainLink} target="_blank" rel="noopener noreferrer nofollow" className="block text-amber-500 hover:text-amber-400">
                                <Play className="h-5 w-5" />
                                <span className="sr-only">Check where to watch {title}</span>
                            </a>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Check where to watch</p>
                        </TooltipContent>
                    </Tooltip>
                )}

            </TooltipProvider>
        </div>
    );
} 