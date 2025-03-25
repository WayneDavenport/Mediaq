'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
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
        reading_speed: 0.667, // Default to 0.667 pages per minute
        username: session?.user?.name || '',
    });

    const getReadingSpeedLabel = (value) => {
        if (value <= 0.4) return "Slow";
        if (value <= 0.667) return "Normal";
        if (value <= 0.9) return "Fast";
        return "Very Fast";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/user/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userData.username,
                    reading_speed: userData.reading_speed
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Profile updated successfully!");

                // Sign out to clear any cached session data
                await signOut({ redirect: false });

                // Redirect to sign in page
                router.push('/auth-pages/signin?callbackUrl=/user-pages/dashboard');
            } else {
                throw new Error(data.error || "Failed to update profile");
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || "An error occurred while updating your profile");
        } finally {
            setLoading(false);
        }
    };

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