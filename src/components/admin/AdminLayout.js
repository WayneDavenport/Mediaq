'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShieldAlert, Users, Settings, Database, BarChart3, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminLayout({ children }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(true);

    // Redirect if not admin - Note: we also check on the server side
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

    const adminNavItems = [
        { path: '/admin', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
        { path: '/admin/users', label: 'User Management', icon: <Users className="h-5 w-5" /> },
        { path: '/admin/create-group-profile', label: 'Create Group Profile', icon: <Users className="h-5 w-5" /> },
        { path: '/admin/settings', label: 'Admin Settings', icon: <Settings className="h-5 w-5" /> },
        { path: '/admin/database', label: 'Database Tools', icon: <Database className="h-5 w-5" /> },
    ];

    return (
        <div className="flex min-h-screen bg-background">
            {/* Admin sidebar */}
            <aside
                className={`bg-muted fixed left-0 top-0 z-30 h-screen w-64 transform transition-transform duration-300 ease-in-out 
                    lg:relative lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-64'}`}
            >
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <span className="font-bold">Admin Panel</span>
                    </div>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="lg:hidden rounded-full p-1 hover:bg-muted-foreground/10"
                    >
                        <ChevronRight className={`h-5 w-5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <nav className="p-3 space-y-2">
                    {adminNavItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${pathname === item.path
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'hover:bg-accent/50'
                                }`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}

                            {pathname === item.path && (
                                <Badge variant="outline" className="ml-auto py-0 px-1.5 h-5">
                                    Active
                                </Badge>
                            )}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Mobile overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Toggle button for mobile */}
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`lg:hidden fixed bottom-5 left-5 z-40 rounded-full bg-primary text-white p-3 shadow-lg
                   transition-transform duration-300 ${menuOpen ? 'translate-x-56' : 'translate-x-0'}`}
            >
                <ChevronRight className={`h-5 w-5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Main content */}
            <main className="flex-1 overflow-auto p-4 pt-0 lg:p-8">
                {children}
            </main>
        </div>
    );
} 