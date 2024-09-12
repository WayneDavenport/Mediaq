// src/pages/user-main.js
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useSelector, useDispatch } from 'react-redux';
import { clearSelectedMediaItem } from '@/store/slices/selectedMediaItemSlice';
import { fetchBackgroundArt } from '@/utils/formUtils';
import SignOutButton from "@/components/SignOutButton";
import MediaItemsList from "@/components/MediaItemsList";
import UpdateForm from "@/components/UpdateForm";
import MediaQueueStats from '@/components/MediaQueueStats';
import styles from './user-main.module.css';

// src/pages/user-main.js
export default function Home() {
    const { data: session } = useSession();
    const [backgroundImage, setBackgroundImage] = useState('');
    const [isMobile, setIsMobile] = useState(false);
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

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        handleResize(); // Check on initial load
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className={`container mx-auto p-4 text-white ${styles.backgroundImage}`} style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div>
                <h1 className={styles.title}>{session?.user?.username}&apos;s Dashboard</h1>
            </div>
            <div className={styles.gridContainer}>
                <div className="flex flex-col gap-8">
                    {/* Hide MediaItemsList on mobile when editingItem is selected */}
                    {(!editingItem || !isMobile) && <MediaItemsList />}

                </div>
                <div>
                    {editingItem && <UpdateForm onCancel={handleCancel} />}

                </div>
                <MediaQueueStats />
            </div>
            {session && (
                <div><SignOutButton /></div>
            )}
        </div>
    );
}