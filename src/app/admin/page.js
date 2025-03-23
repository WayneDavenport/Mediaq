'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { UserPlus, ShieldAlert } from 'lucide-react';
import GmgCatalogSyncButton from '@/components/admin/GmgCatalogSyncButton';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (status === 'unauthenticated' || !session?.user?.isAdmin) {
        router.push('/');
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-8 gap-2">
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/admin/create-group-profile" className="block">
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 mb-2">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <CardTitle>Create Group Profile</CardTitle>
                                <CardDescription>Create hub profiles for community groups</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </section>
            <section>
                <h2 className="text-xl font-semibold mb-4">GMG Catalog Sync</h2>
                <GmgCatalogSyncButton />
            </section>
        </div>
    );
} 