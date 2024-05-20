// pages/user-main.js
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import MediaForm from "@/components/MediaForm";
import MediaItemsList from "@/components/MediaItemsList";

export default function Home() {
    const { data: session } = useSession();
    const [optimisticMediaItem, setOptimisticMediaItem] = useState(null);

    const handleFormSubmit = async (formData) => {
        // Optimistically update the UI
        const tempId = Date.now().toString(); // Temporary ID for the new item
        const optimisticItem = { ...formData, _id: tempId };
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

    return (
        <>
            <div>
                <h1>User-Main</h1>
                <Link href='/'>Home Page</Link>
                {session && (
                    <li><SignOutButton /></li>
                )}
            </div>
            <MediaForm onSubmit={handleFormSubmit} />
            <br /> <Link href="/search">Search</Link> <br />
            <MediaItemsList newMediaItem={optimisticMediaItem} />
        </>
    );
}