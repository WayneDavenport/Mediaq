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
import { Slider } from '@/components/ui/slider';

export default function Settings() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isNewUser, setIsNewUser] = useState(false);
    const [userData, setUserData] = useState({
        reading_speed: session?.user?.reading_speed || 0.667,
        username: session?.user?.username || '',
        first_name: session?.user?.first_name || '',
        last_name: session?.user?.last_name || '',
    });

    const pagesPerTwentyMin = (userData.reading_speed * 20).toFixed(1);

    const getReadingSpeedLabel = (value) => {
        if (value <= 0.4) return "Slow";
        if (value <= 0.667) return "Normal";
        if (value <= 0.9) return "Fast";
        return "Very Fast";
    };

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

                        {!session?.user?.google_id && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        value={userData.first_name}
                                        onChange={(e) => setUserData(prev => ({
                                            ...prev,
                                            first_name: e.target.value
                                        }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={userData.last_name}
                                        onChange={(e) => setUserData(prev => ({
                                            ...prev,
                                            last_name: e.target.value
                                        }))}
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reading_speed">
                                Reading Speed: {userData.reading_speed.toFixed(3)} pages per minute
                                <span className="ml-2 text-sm text-muted-foreground">
                                    ({getReadingSpeedLabel(userData.reading_speed)})
                                </span>
                            </Label>
                            <Slider
                                id="reading_speed"
                                min={0.2}
                                max={1.2}
                                step={0.067}
                                value={[userData.reading_speed]}
                                onValueChange={(value) => setUserData(prev => ({
                                    ...prev,
                                    reading_speed: value[0]
                                }))}
                                className="w-full"
                            />
                            <p className="text-sm text-muted-foreground">
                                Estimated pages per 20 minutes: {pagesPerTwentyMin}
                            </p>
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