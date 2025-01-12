'use client'

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Dashboard() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>Access Denied</div>;
    }

    return (
        <div>
            <h1>Welcome, {session?.user?.name || session?.user?.email || 'User'}!</h1>
            <Link href="/user-pages/search">Search</Link>
        </div>
    );
}