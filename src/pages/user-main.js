// src/pages/user-main.js
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import SignOutButton from "@/components/SignOutButton";
import MediaForm from "@/components/MediaForm";
import MediaItemsList from "@/components/MediaItemsList";
import UpdateForm from "@/components/UpdateForm";
import MediaStats from "@/components/MediaStats";

export default function Home() {
    const { data: session } = useSession();
    const [optimisticMediaItem, setOptimisticMediaItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    const handleFormSubmit = async (formData) => {
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
    };

    const handleEdit = (item) => {
        setEditingItem(item);
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
        <div className="container mx-auto p-4">
            <div>
                <h1 className="text-2xl font-bold mb-4">User-Main</h1>
                <Link href='/'>Home Page</Link>
                {session && (
                    <li><SignOutButton /></li>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <MediaForm onSubmit={handleFormSubmit} />
                    <br /> <Link href="/search">Search</Link> <br />
                    <MediaItemsList newMediaItem={optimisticMediaItem} onEdit={handleEdit} />
                </div>
                <div>
                    {editingItem && (
                        <UpdateForm item={editingItem} onSubmit={handleUpdateSubmit} onCancel={handleCancel} />
                    )}
                </div>
                <div>
                    <MediaStats />
                </div>
            </div>
        </div>
    );
}