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
import { Slider } from "@/components/ui/slider";

export default function CompleteProfile() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        reading_speed: 250,
        username: session?.user?.name || '',
    });

    // Redirect if user is not a new Google user
    useEffect(() => {
        if (session && !session.user?.isNewUser) {
            router.push('/user-pages/dashboard');
        }
    }, [session, router]);

    const getReadingSpeedLabel = (value) => {
        if (value <= 10) return "Slow";
        if (value <= 20) return "Normal";
        if (value <= 30) return "Fast";
        return "Very Fast";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/user/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            await update(); // Update the session with new data
            toast.success("Profile setup complete!");
            router.push('/user-pages/dashboard');
        } catch (error) {
            toast.error(error.message || "Failed to complete profile setup");
        } finally {
            setLoading(false);
        }
    };

    if (!session?.user?.isNewUser) {
        return null; // Don't render anything while redirecting
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Complete Your Profile
                    </CardTitle>
                    <CardDescription className="text-center">
                        Just a few more details to personalize your experience
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Choose a username"
                                required
                                value={userData.username}
                                onChange={(e) => setUserData(prev => ({
                                    ...prev,
                                    username: e.target.value
                                }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reading_speed">
                                Reading Speed: {userData.reading_speed} pages per 30 minutes
                                <span className="ml-2 text-sm text-muted-foreground">
                                    ({getReadingSpeedLabel(userData.reading_speed)})
                                </span>
                            </Label>
                            <Slider
                                id="reading_speed"
                                min={5}
                                max={40}
                                step={5}
                                value={[userData.reading_speed]}
                                onValueChange={(value) => setUserData(prev => ({
                                    ...prev,
                                    reading_speed: value[0]
                                }))}
                                className="w-full"
                            />
                            <p className="text-sm text-muted-foreground">
                                Slide to adjust your average reading speed
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Complete Profile'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 