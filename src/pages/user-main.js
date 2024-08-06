// src/pages/user-main.js
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useSelector } from 'react-redux';

import SignOutButton from "@/components/SignOutButton";

import MediaItemsList from "@/components/MediaItemsList";
import UpdateForm from "@/components/UpdateForm";
import MediaStats from "@/components/MediaStats";
import MediaQueueStats from '@/components/MediaQueueStats';

export default function Home() {
    const { data: session } = useSession();
    const [optimisticMediaItem, setOptimisticMediaItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    /*     const handleFormSubmit = async (formData) => {
            // Optimistically update the UI
            const tempId = Date.now().toString(); // Temporary ID for the new item
            const optimisticItem = {
                ...formData,
                _id: tempId,
                complete: false, // Ensure default values
                completedDuration: 0, // Ensure default values
                userEmail: session.user.email, // Ensure userEmail is set
                userId: session.user.id // Ensure userId is set
            };
            console.log('Optimistic Item:', optimisticItem); // Log optimistic item
            setOptimisticMediaItem(optimisticItem);
    
            try {
                const response = await fetch('/api/newItem', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
    
                if (response.ok) {
                    console.log('Media item added successfully');
                    // No need to update the client with the actual server item
                    setOptimisticMediaItem(null);
                } else {
                    const errorData = await response.json();
                    console.error('Error adding media item:', errorData.message);
                    // Revert the optimistic update if the request fails
                    setOptimisticMediaItem(null);
                }
            } catch (error) {
                console.error('Error adding media item:', error);
                // Revert the optimistic update if the request fails
                setOptimisticMediaItem(null);
            }
        }; */

    const handleEdit = (item) => {
        setEditingItem(item);
        console.log(item);
        console.log(editingItem);
    };

    const handleUpdateSubmit = async (formData) => {
        try {
            const response = await fetch('/api/updateItem', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                console.log('Media item updated successfully');
                setEditingItem(null); // Clear editing item after successful submission
            } else {
                const errorData = await response.json();
                console.error('Error updating media item:', errorData.message);
            }
        } catch (error) {
            console.error('Error updating media item:', error);
        }
    };

    const handleCancel = () => {
        setEditingItem(null);
    };

    return (
        <div className="container mx-auto p-4 text-white" >
            <div>
                <h1 className="text-6xl font-bold mb-4">Dashboard</h1>

            </div>
            <br /><div className=" flex justify-center items-center shadow-teal-500 bg-[#222227] h-8 w-28"><Link href="/search">Search/Add</Link></div> <br />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-8">
                    <MediaItemsList newMediaItem={optimisticMediaItem} onEdit={handleEdit} />
                    {/* <MediaStats /> */}
                    <MediaQueueStats />
                </div>
                <div>
                    {editingItem && (
                        <UpdateForm item={editingItem} onSubmit={handleUpdateSubmit} onCancel={handleCancel} />
                    )}
                </div>
                <div>

                </div>
                <Link href='/'>Home Page</Link>
                <Link href='/media-gallery'>M.G</Link>
                <Link href='/friend-search'>Friends</Link>
                {session && (
                    <div><SignOutButton /></div>
                )}
            </div>
        </div>
    );
}

/* {session ? (
    <div><SignOutButton /></div>
) : (<button
onClick={() => setShowSignInForm(true)}
className="px-4 py-2 bg-blue-500 text-white rounded"
>
Sign In
</button>) } */