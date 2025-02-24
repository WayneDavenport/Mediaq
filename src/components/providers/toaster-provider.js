'use client'

import { Toaster } from 'sonner'

export function ToasterProvider() {
    return (
        <Toaster
            richColors
            closeButton={false}
            position="top-center"
            swipeDirection="up"
            dismissible
        />
    )
} 