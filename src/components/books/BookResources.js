'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, BookOpen, Library, ShoppingBag } from 'lucide-react';

export default function BookResources({ title, author, isbn, className }) {
    // Skip rendering if we don't have the necessary data
    if (!title) {
        return null;
    }

    // Construct URLs for different services
    const goodreadsUrl = isbn
        ? `https://www.goodreads.com/book/isbn/${isbn}`
        : `https://www.goodreads.com/search?q=${encodeURIComponent(`${title} ${author || ''}`.trim())}`;

    const worldCatUrl = isbn
        ? `https://www.worldcat.org/isbn/${isbn}`
        : `https://www.worldcat.org/search?q=${encodeURIComponent(`${title} ${author || ''}`.trim())}`;

    const openLibraryUrl = isbn
        ? `https://openlibrary.org/isbn/${isbn}`
        : `https://openlibrary.org/search?q=${encodeURIComponent(`${title} ${author || ''}`.trim())}`;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <h3 className="text-sm font-medium">Book Resources</h3>
            <div className="space-y-2">
                <a
                    href={goodreadsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center w-full"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex justify-between items-center bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-green-700 dark:text-green-500"
                    >
                        <span className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Find on Goodreads
                        </span>
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </a>

                <a
                    href={worldCatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center w-full"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex justify-between items-center bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-500"
                    >
                        <span className="flex items-center">
                            <Library className="h-4 w-4 mr-2" />
                            Find at your local library
                        </span>
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </a>

                <a
                    href={openLibraryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center w-full"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex justify-between items-center bg-amber-50 dark:bg-slate-800 border-amber-200 dark:border-slate-700 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-500"
                    >
                        <span className="flex items-center">
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Borrow on Open Library
                        </span>
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </a>
            </div>
        </div>
    );
} 