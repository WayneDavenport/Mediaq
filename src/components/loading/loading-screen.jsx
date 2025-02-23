'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { loadingQuotes } from './loading-quotes';
import { cn } from "@/lib/utils";

export function LoadingScreen() {
    const [quote, setQuote] = useState('');
    const [dots, setDots] = useState('');

    useEffect(() => {
        // Set initial random quote
        const randomQuote = loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)];
        setQuote(randomQuote);

        // Ellipsis animation
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '. ');
        }, 600);

        return () => clearInterval(dotsInterval);
    }, []);

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <p className={cn(
                    "text-lg font-medium text-muted-foreground",
                    "animate-fade-in opacity-0",
                    "select-none"
                )}>
                    {quote.replace('…', '')}{dots}
                </p>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        </div>
    );
} 