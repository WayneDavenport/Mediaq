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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isNewUser, setIsNewUser] = useState(false);
    const [userData, setUserData] = useState({
        reading_speed: 0.667, // Default value
        username: '',
        first_name: '',
        last_name: '',
    });
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [newReadingSpeed, setNewReadingSpeed] = useState(null);
    const [isUpdatingDurations, setIsUpdatingDurations] = useState(false);
    const [pendingReadingSpeed, setPendingReadingSpeed] = useState(null);
    const [showGenericLockDialog, setShowGenericLockDialog] = useState(false);

    const pagesPerTwentyMin = (userData.reading_speed * 20).toFixed(1);

    const getReadingSpeedLabel = (value) => {
        if (value <= 0.4) return "Slow";
        if (value <= 0.667) return "Normal";
        if (value <= 0.9) return "Fast";
        return "Very Fast";
    };

    useEffect(() => {
        if (session?.user) {
            setUserData({
                reading_speed: session.user.reading_speed || 0.667,
                username: session.user.username || '',
                first_name: session.user.first_name || '',
                last_name: session.user.last_name || '',
            });

            // Check if this is a new Google user
            if (!session.user.reading_speed) {
                setIsNewUser(true);
            }
        }
    }, [session]);

    const handleReadingSpeedChange = (value) => {
        const newSpeed = value[0];
        setUserData(prev => ({
            ...prev,
            reading_speed: newSpeed
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdatingDurations(true);

        try {
            // First update user settings
            const settingsResponse = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!settingsResponse.ok) {
                throw new Error('Failed to update settings');
            }

            // Check if reading speed changed
            if (userData.reading_speed !== session.user.reading_speed) {
                setShowGenericLockDialog(true);
            } else {
                await update();
                toast.success('Settings updated successfully');
            }
        } catch (error) {
            toast.error(error.message || "Failed to update");
        } finally {
            setIsUpdatingDurations(false);
        }
    };

    const handleSkipUpdate = async () => {
        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...userData,
                    reading_speed: newReadingSpeed,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }

            setUserData(prev => ({
                ...prev,
                reading_speed: newReadingSpeed
            }));
            toast.success("Settings updated");
        } catch (error) {
            toast.error(error.message || "Failed to update settings");
        } finally {
            setShowUpdateDialog(false);
        }
    };

    const updateDurations = async (genericLockPreference) => {
        try {
            const response = await fetch('/api/user/update-book-durations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reading_speed: userData.reading_speed,
                    update_generic_locks_by: genericLockPreference
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update durations');
            }

            const result = await response.json();
            await update();
            toast.success(`Updated ${result.specificLocksUpdated} specific book locks and ${result.genericLocksUpdated} generic book locks`);
        } catch (error) {
            toast.error(error.message || "Failed to update durations");
        } finally {
            setShowGenericLockDialog(false);
        }
    };

    return (
        <>


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
                                    step={0.01}
                                    value={[userData.reading_speed]}
                                    onValueChange={handleReadingSpeedChange}
                                    className="w-full"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Estimated pages per 20 minutes: {pagesPerTwentyMin}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Note: Saving changes will update all book duration estimates
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-4"
                                disabled={isUpdatingDurations}
                            >
                                {isUpdatingDurations ? 'Updating...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Book Durations?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Would you like to update the estimated duration for all your incomplete books based on your new reading speed of {newReadingSpeed?.toFixed(3)} pages per minute?
                            This will not affect any progress you've already made.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleSkipUpdate}>
                            Skip
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReadingSpeedChange}
                            disabled={isUpdatingDurations}
                        >
                            {isUpdatingDurations ? "Updating..." : "Update Durations"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showGenericLockDialog} onOpenChange={setShowGenericLockDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Update Generic Book Locks</AlertDialogTitle>
                        <AlertDialogDescription>
                            How would you like to update your generic book locks with the new reading speed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => updateDurations('maintain_time')}>
                            Maintain Time Goals
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => updateDurations('maintain_pages')}>
                            Maintain Page Goals
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 