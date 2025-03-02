'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Script from 'next/script';

export default function JustWatchWidget({ title, mediaType, year, className }) {
    const widgetRef = useRef(null);
    const { theme } = useTheme();
    const widgetTheme = theme === 'dark' ? 'dark' : 'light';
    const widgetId = `jw-widget-${title.replace(/\s+/g, '-').toLowerCase()}`;

    // Only render if we have the necessary data
    if (!title) return null;

    // Format media type for JustWatch (they use "movie" or "show")
    const jwMediaType = mediaType === 'tv' ? 'show' : 'movie';

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <h3 className="text-sm font-medium">Where to Watch</h3>

            {/* Widget container */}
            <div
                id={widgetId}
                ref={widgetRef}
                data-jw-widget
                data-object-type={jwMediaType}
                data-title={title}
                data-year={year || ''}
                data-theme={widgetTheme}
                className="w-full min-h-[100px] rounded-md border overflow-hidden"
            ></div>

            {/* Required attribution */}
            <div>
                <a
                    style={{
                        display: 'flex',
                        fontSize: '11px',
                        fontFamily: 'sans-serif',
                        color: theme === 'dark' ? '#999' : '#666',
                        textDecoration: 'none',
                        alignItems: 'center'
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://www.justwatch.com"
                >
                    <span className="mr-1">Powered by</span>
                    <img
                        alt="JustWatch"
                        height="11px"
                        src="https://widget.justwatch.com/assets/JW_logo_color_10px.svg"
                    />
                </a>
            </div>

            {/* Load JustWatch widget script */}
            <Script
                src="https://widget.justwatch.com/justwatch_widget.js"
                strategy="lazyOnload"
            />
        </div>
    );
} 