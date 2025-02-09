'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isNewUser, setIsNewUser] = useState(false);
    const [userData, setUserData] = useState({
        reading_speed: session?.user?.reading_speed || 250,
        username: session?.user?.username || '',
    });

    useEffect(() => {
        // Check if this is a new Google user
        if (session?.user && !session.user.reading_speed) {
            setIsNewUser(true);
        }
    }, [session]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) throw new Error('Failed to update settings');

            // Update session with new data
            await update();

            toast.success("Settings updated successfully");

            // If this was a new user completing their profile, redirect to dashboard
            if (isNewUser) {
                router.push('/user-pages/dashboard');
            }
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    return (
        <div className="container max-w-2xl mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isNewUser ? 'Complete Your Profile' : 'Settings'}
                    </CardTitle>
                    <CardDescription>
                        {isNewUser
                            ? 'Please set up your account preferences to continue'
                            : 'Manage your account settings and preferences'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={userData.username}
                                onChange={(e) => setUserData(prev => ({
                                    ...prev,
                                    username: e.target.value
                                }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reading_speed">
                                Reading Speed (words per minute)
                            </Label>
                            <Input
                                id="reading_speed"
                                type="number"
                                min="100"
                                max="1000"
                                value={userData.reading_speed}
                                onChange={(e) => setUserData(prev => ({
                                    ...prev,
                                    reading_speed: parseInt(e.target.value)
                                }))}
                                required
                            />
                        </div>

                        <Button type="submit">
                            {isNewUser ? 'Complete Setup' : 'Save Changes'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 