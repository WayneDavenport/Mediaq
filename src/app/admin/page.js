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

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (status === 'unauthenticated' || !session?.user?.isAdmin) {
        router.push('/');
        return null;
    }

    const handleSendEmail = async () => {
        try {
            const response = await fetch('/api/admin/send-thank-you-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setMessage('Email sent successfully!');
            } else {
                setMessage('Failed to send email.');
            }
        } catch (error) {
            setMessage('An error occurred.');
        }
    };

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
            <section>
                <h2 className="text-xl font-semibold mb-4">Send Thank You Email</h2>
                <div className="mb-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter recipient's email"
                        className="border p-2 w-full"
                    />
                </div>
                <button onClick={handleSendEmail} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Send Email
                </button>
                {message && <p className="mt-2">{message}</p>}
            </section>
        </div>
    );
} 