'use client';

import { useEffect } from 'react';

export default function PointerEventsHandler() {
    useEffect(() => {
        const resetPointerEvents = () => {
            if (document.body) {
                document.body.style.pointerEvents = '';
            }
        };

        window.addEventListener('themeChange', resetPointerEvents);
        resetPointerEvents();

        return () => {
            window.removeEventListener('themeChange', resetPointerEvents);
            resetPointerEvents();
        };
    }, []);

    return null;
} 