'use client'

import { Toaster } from 'sonner'

export function ToasterProvider() {
    return (
        <Toaster
            richColors
            closeButton={true}
            position="top-center"
            swipeDirection="up"
            dismissible={true}
            duration={4000}
            toastOptions={{
                style: {
                    cursor: 'pointer'
                },
                className: 'toast-container'
            }}
            onClick={() => { }}
        />
    )
} 