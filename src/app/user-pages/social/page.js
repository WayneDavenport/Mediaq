'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FriendSearch from '@/components/social/FriendSearch';
import FriendRequests from '@/components/social/FriendRequests';

export default function SocialPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === 'unauthenticated') {
        router.push('/');
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Social</h1>
            <div className="space-y-8">
                <FriendRequests currentUserId={session?.user?.id} />
                <FriendSearch currentUserId={session?.user?.id} />
            </div>
        </div>
    );
}