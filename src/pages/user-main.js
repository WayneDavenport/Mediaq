// pages/user-main.js
import Link from "next/link";
import { useSession } from "next-auth/react";
import SignOutButton from "@/components/SignOutButton";
import MediaForm from "@/components/MediaForm";

export default function Home() {
    const { data: session } = useSession();

    const handleFormSubmit = async (formData) => {
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
            } else {
                const errorData = await response.json();
                console.error('Error adding media item:', errorData.message);
            }
        } catch (error) {
            console.error('Error adding media item:', error);
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
        </>
    );
}