'use client';

import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { fetchGmgLinksForGames } from '@/components/gmg/GmgLinkFetcher';
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";

export default function GameResources({ title, className }) {
    const [gmgData, setGmgData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGmgLink = async () => {
            if (!title) return;

            try {
                setIsLoading(true);
                const links = await fetchGmgLinksForGames([{ title }]);
                if (links[title]) {
                    setGmgData(links[title]);
                }
            } catch (error) {
                console.error('Error fetching GMG link:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGmgLink();
    }, [title]);

    if (!title) return null;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <h3 className="text-sm font-medium flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                Buy Now!
            </h3>
            {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Finding deals...
                </div>
            ) : gmgData ? (
                <>
                    <a
                        href={gmgData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center group"
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex justify-between items-center bg-slate-900 dark:bg-slate-800 border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700 text-green-400 hover:text-green-300 gmg-button-glow"
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="flex items-center">
                                    <Image
                                        src="/images/Green-Man-Gaming-logo_RGB_Dark-BG.png"
                                        alt="Green Man Gaming"
                                        width={80}
                                        height={22}
                                        className="mr-2"
                                    />
                                </span>
                                <span className="flex items-center gap-2">
                                    {gmgData.price && (
                                        <span className="font-medium">${gmgData.price}</span>
                                    )}
                                    <ExternalLink className="h-3 w-3" />
                                </span>
                            </div>
                        </Button>
                    </a>
                    <AffiliateDisclosure minimal={true} />
                </>
            ) : (
                <span className="text-sm text-muted-foreground">
                    No store links available
                </span>
            )}
        </div>
    );
} 