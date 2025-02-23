'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FixQueueButton from '@/components/admin/FixQueueButton';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const ADMIN_EMAIL = 'wayne86davenport@gmail.com'; // Your email address

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (status === 'unauthenticated' || session?.user?.email !== ADMIN_EMAIL) {
        router.push('/');
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Tools</h1>

            <div className="space-y-8">
                <section className="p-4 bg-card rounded-lg border">
                    <h2 className="text-xl font-semibold mb-4">Queue Management</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Fix Queue Numbers</h3>
                                <p className="text-sm text-muted-foreground">
                                    Reset and fix queue numbers for all users
                                </p>
                            </div>
                            <FixQueueButton />
                        </div>
                    </div>
                </section>

                {/* Add more admin tools sections as needed */}
            </div>
        </div>
    );
} 