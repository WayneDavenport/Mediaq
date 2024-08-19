// src/pages/user-main.js
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { clearSelectedMediaItem } from '@/store/slices/selectedMediaItemSlice';

import SignOutButton from "@/components/SignOutButton";
import MediaItemsList from "@/components/MediaItemsList";
import UpdateForm from "@/components/UpdateForm";
import MediaStats from "@/components/MediaStats";
import MediaQueueStats from '@/components/MediaQueueStats';

export default function Home() {
    const { data: session } = useSession();
    const [optimisticMediaItem, setOptimisticMediaItem] = useState(null);
    const editingItem = useSelector((state) => state.selectedMediaItem);
    const dispatch = useDispatch();

    const handleCancel = () => {
        dispatch(clearSelectedMediaItem());
    };

    return (
        <div className="container mx-auto p-4 text-white">
            <div>
                <h1 className="text-6xl font-bold mb-4">Dashboard</h1>
            </div>
            <br />
            <div className="flex justify-center items-center shadow-teal-500 bg-[#222227] h-8 w-28">
                <Link href="/search">Search/Add</Link>
            </div>
            <br />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-8">
                    <MediaItemsList newMediaItem={optimisticMediaItem} />
                    <MediaQueueStats />
                </div>
                <div>
                    {editingItem && (
                        <UpdateForm onCancel={handleCancel} />
                    )}
                </div>
                {session && (
                    <div><SignOutButton /></div>
                )}
            </div>
        </div>
    );
}