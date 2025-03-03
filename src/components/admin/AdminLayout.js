'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }) {
    const { data: session, status } = useSession();

    // Redirect if not admin
    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session?.user?.isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
                <p className="text-muted-foreground mb-4 text-center">
                    You don't have permission to access this area.
                </p>
                <Link
                    href="/"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded px-4 py-2 transition-colors"
                >
                    Return to Homepage
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b p-4 mb-6 z-10">
                <div className="container mx-auto flex items-center">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <Link href="/admin" className="font-bold text-lg">Admin</Link>
                    </div>
                    <div className="flex-grow"></div>
                </div>
            </header>
            <main className="container mx-auto px-4 pb-20">
                {children}
            </main>
        </div>
    );
} 