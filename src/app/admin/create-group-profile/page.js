'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, UserPlus, Check } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function CreateGroupProfile() {
    const [isLoading, setIsLoading] = useState(false);
    const [createdProfile, setCreatedProfile] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        reading_speed: 0.666, // Default reading speed as requested
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'reading_speed' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setCreatedProfile(null);

        try {
            const response = await fetch('/api/admin/create-group-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create group profile');
            }

            // Set created profile for display
            setCreatedProfile(data.user);

            // Show enhanced success toast
            toast.success(
                <div className="flex flex-col">
                    <div className="font-medium">Group Profile Created!</div>
                    <div className="text-sm mt-1">Username: {data.user.username}</div>
                    <div className="text-sm">Email: {data.user.email}</div>
                </div>
                , {
                    duration: 5000,
                    id: 'group-profile-created',
                    icon: <Check className="h-4 w-4 text-green-500" />
                });

            // Reset form fields but keep the reading speed
            setFormData({
                username: '',
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                reading_speed: 0.666,
            });
        } catch (error) {
            console.error('Error creating group profile:', error);
            toast.error(error.message || 'Failed to create group profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="container max-w-4xl mx-auto py-8">
                <h1 className="text-3xl font-bold mb-8">Create Group Profile</h1>

                {createdProfile && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium mb-2">
                            <Check className="h-5 w-5" />
                            <h3>Profile Created Successfully</h3>
                        </div>
                        <div className="grid gap-1 text-sm">
                            <p><span className="font-medium">Username:</span> {createdProfile.username}</p>
                            <p><span className="font-medium">Email:</span> {createdProfile.email}</p>
                            <p><span className="font-medium">ID:</span> {createdProfile.id}</p>
                            <p className="mt-2 text-muted-foreground">
                                Remember to share these login details with the group admin.
                            </p>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Create Group Profile
                        </CardTitle>
                        <CardDescription>
                            Create special accounts to serve as community hubs for beta testers
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium mb-1">
                                        Username
                                    </label>
                                    <Input
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="GamingDungeon"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="group@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Secure password"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="reading_speed" className="block text-sm font-medium mb-1">
                                        Reading Speed
                                    </label>
                                    <Input
                                        id="reading_speed"
                                        name="reading_speed"
                                        type="number"
                                        step="0.001"
                                        value={formData.reading_speed}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="first_name" className="block text-sm font-medium mb-1">
                                        Display Name (First Name)
                                    </label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="The Gaming"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="last_name" className="block text-sm font-medium mb-1">
                                        Last Name / Description
                                    </label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="Dungeon"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Group Profile'}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex justify-between pt-4 text-sm text-muted-foreground border-t">
                        <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2" />
                            <span>Accounts will be automatically verified</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </AdminLayout>
    );
} 