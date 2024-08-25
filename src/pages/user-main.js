// src/pages/user-main.js
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { clearSelectedMediaItem } from '@/store/slices/selectedMediaItemSlice';
import { fetchBackgroundArt } from '@/utils/formUtils';

import SignOutButton from "@/components/SignOutButton";
import MediaItemsList from "@/components/MediaItemsList";
import UpdateForm from "@/components/UpdateForm";
import MediaStats from "@/components/MediaStats";
import MediaQueueStats from '@/components/MediaQueueStats';
import styles from './user-main.module.css';

export default function Home() {
    const { data: session } = useSession();
    const [backgroundImage, setBackgroundImage] = useState('');
    const [optimisticMediaItem, setOptimisticMediaItem] = useState(null);
    const editingItem = useSelector((state) => state.selectedMediaItem);
    const dispatch = useDispatch();

    const handleCancel = () => {
        dispatch(clearSelectedMediaItem());
    };

    useEffect(() => {
        const fetchBackgroundImage = async () => {
            if (editingItem && (editingItem.mediaType === 'Movie' || editingItem.mediaType === 'Show' || editingItem.mediaType === 'VideoGame')) {
                const { backdropPath } = await fetchBackgroundArt(editingItem.mediaType, editingItem.title, editingItem.additionalFields);
                setBackgroundImage(backdropPath);
            } else {
                setBackgroundImage('');
            }
        };

        fetchBackgroundImage();
    }, [editingItem]);

    return (
        <div className={`container mx-auto p-4 text-white ${styles.backgroundImage}`} style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div>
                <h1 className={styles.title}>Dashboard</h1>
            </div>
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