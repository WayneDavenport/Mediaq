'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FixQueueButton from '@/components/admin/FixQueueButton';
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import GmgCatalogSyncButton from '@/components/admin/GmgCatalogSyncButton';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [numUsers, setNumUsers] = useState(5);
    const [prefix, setPrefix] = useState('nintendo');
    const [isCreating, setIsCreating] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isClearingTestUsers, setIsClearingTestUsers] = useState(false);
    const [isClearingSpecificUser, setIsClearingSpecificUser] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [users, setUsers] = useState([]);
    const [testUsers, setTestUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingTestUsers, setLoadingTestUsers] = useState(false);

    useEffect(() => {
        if (session?.user?.isAdmin) {
            fetchUsers();
            fetchTestUsers();
        }
    }, [session]);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await fetch('/api/admin/users');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }

            setUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchTestUsers = async () => {
        try {
            setLoadingTestUsers(true);
            const response = await fetch('/api/admin/test-users');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch test users');
            }

            setTestUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching test users:', error);
            toast.error('Failed to load test users');
        } finally {
            setLoadingTestUsers(false);
        }
    };

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (status === 'unauthenticated' || !session?.user?.isAdmin) {
        router.push('/');
        return null;
    }

    const handleCreateTestUsers = async () => {
        try {
            setIsCreating(true);
            const response = await fetch('/api/admin/create-test-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    count: numUsers,
                    prefix: prefix
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create test users');
            }

            toast.success(`Created ${data.users.length} Nintendo character test users`);
            fetchTestUsers(); // Refresh the test users list
        } catch (error) {
            toast.error(error.message || 'Failed to create test users');
            console.error('Error creating test users:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleClearSocialData = async () => {
        try {
            setIsClearing(true);
            const response = await fetch('/api/admin/clear-social-data', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear social data');
            }

            toast.success('Social data cleared for all users');
        } catch (error) {
            toast.error(error.message || 'Failed to clear social data');
            console.error('Error clearing social data:', error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleClearTestUsersSocialData = async () => {
        try {
            setIsClearingTestUsers(true);
            const response = await fetch('/api/admin/clear-social-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    testUsersOnly: true
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear test users social data');
            }

            toast.success(`Social data cleared for ${data.affectedUsers || 'all test'} users`);
        } catch (error) {
            toast.error(error.message || 'Failed to clear test users social data');
            console.error('Error clearing test users social data:', error);
        } finally {
            setIsClearingTestUsers(false);
        }
    };

    const handleClearSpecificUserSocialData = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        try {
            setIsClearingSpecificUser(true);
            const response = await fetch('/api/admin/clear-social-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUserId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to clear user social data');
            }

            toast.success('Social data cleared for selected user');
        } catch (error) {
            toast.error(error.message || 'Failed to clear user social data');
            console.error('Error clearing user social data:', error);
        } finally {
            setIsClearingSpecificUser(false);
        }
    };

    const copyCredentials = (email) => {
        navigator.clipboard.writeText(`Email: ${email}\nPassword: Test123!`);
        toast.success('Credentials copied to clipboard');
    };

    // Helper function to extract franchise from last_name
    const extractFranchise = (lastName) => {
        if (!lastName) return null;
        const match = lastName.match(/\((.*?)\)/);
        return match ? match[1] : lastName;
    };

    // Helper function to get avatar color based on franchise
    const getFranchiseColor = (franchise) => {
        const franchiseColors = {
            'Mario': 'bg-red-500',
            'Zelda': 'bg-green-500',
            'Pokémon': 'bg-yellow-500',
            'Metroid': 'bg-orange-500',
            'Kirby': 'bg-pink-500',
            'Star Fox': 'bg-blue-500',
            'Fire Emblem': 'bg-red-700',
            'Donkey Kong': 'bg-amber-700',
            'Splatoon': 'bg-purple-500'
        };

        return franchiseColors[franchise] || 'bg-gray-500';
    };

    return (
        <>
            <ToasterProvider />
            <div className="container py-10 space-y-6">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your application settings and data
                    </p>
                </div>

                <Tabs defaultValue="users">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="users">Nintendo Test Users</TabsTrigger>
                        <TabsTrigger value="social">Social Data</TabsTrigger>
                        <TabsTrigger value="queue">Queue</TabsTrigger>
                        <TabsTrigger value="Green Man Gaming">Green Man Gaming</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Nintendo Character Test Users</CardTitle>
                                <CardDescription>
                                    Create and manage test users based on Nintendo characters
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="prefix">Email Prefix</Label>
                                        <Input
                                            id="prefix"
                                            value={prefix}
                                            onChange={(e) => setPrefix(e.target.value)}
                                            placeholder="nintendo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="count">Number of Characters</Label>
                                        <Input
                                            id="count"
                                            type="number"
                                            value={numUsers}
                                            onChange={(e) => setNumUsers(parseInt(e.target.value))}
                                            min="1"
                                            max="20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Creates test users with Nintendo character names and {prefix}1@testmail.io emails
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Default password for all test users: <code>Test123!</code>
                                    </p>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <Button
                                        onClick={handleCreateTestUsers}
                                        disabled={isCreating}
                                    >
                                        {isCreating ? 'Creating...' : 'Create Nintendo Test Users'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchTestUsers}
                                        disabled={loadingTestUsers}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh List
                                    </Button>
                                </div>
                            </CardContent>

                            <CardContent>
                                {loadingTestUsers ? (
                                    <div className="text-center p-4">Loading test users...</div>
                                ) : testUsers.length === 0 ? (
                                    <div className="text-center p-4 border rounded-md">
                                        <p className="text-muted-foreground">No Nintendo test users found</p>
                                        <p className="text-sm mt-2">Create some test users to see them here</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                    <TableHead>Character</TableHead>
                                                    <TableHead>Franchise</TableHead>
                                                    <TableHead>Username</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead className="w-[100px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {testUsers.map((user) => {
                                                    // Extract character name and franchise
                                                    const characterName = user.first_name || '';
                                                    const franchise = extractFranchise(user.last_name);
                                                    const initials = characterName ? characterName.substring(0, 2).toUpperCase() : 'TU';
                                                    const avatarColor = getFranchiseColor(franchise);

                                                    return (
                                                        <TableRow key={user.id}>
                                                            <TableCell>
                                                                <Avatar className={`h-8 w-8 ${avatarColor}`}>
                                                                    <AvatarFallback>{initials}</AvatarFallback>
                                                                </Avatar>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{characterName}</TableCell>
                                                            <TableCell>
                                                                {franchise && (
                                                                    <Badge variant="outline" className="bg-muted">
                                                                        {franchise}
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>{user.username || 'N/A'}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => copyCredentials(user.email)}
                                                                    title="Copy login credentials"
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="social">
                        <Card>
                            <CardHeader>
                                <CardTitle>Social Data Management</CardTitle>
                                <CardDescription>
                                    Manage social interactions data for testing
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                                    <h3 className="text-amber-800 font-medium">Warning</h3>
                                    <p className="text-amber-700 text-sm">
                                        The following actions will delete data from the database. Use with caution.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Clear all social data */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-medium">Clear All Social Data</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Removes all friend requests, friendships, and social notifications for all users
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            onClick={handleClearSocialData}
                                            disabled={isClearing}
                                        >
                                            {isClearing ? 'Clearing...' : 'Clear All Data'}
                                        </Button>
                                    </div>

                                    {/* Clear test users social data */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-medium">Clear Test Users Social Data</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Removes social data only for users with @testmail.io emails
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleClearTestUsersSocialData}
                                            disabled={isClearingTestUsers}
                                            className="border-amber-500 text-amber-600 hover:bg-amber-50"
                                        >
                                            {isClearingTestUsers ? 'Clearing...' : 'Clear Test Users Data'}
                                        </Button>
                                    </div>

                                    {/* Clear specific user social data */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-medium">Clear Specific User Social Data</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Removes social data for a specific user
                                            </p>
                                            <div className="mt-2 w-64">
                                                <Select
                                                    value={selectedUserId}
                                                    onValueChange={setSelectedUserId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a user" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {loadingUsers ? (
                                                            <SelectItem value="" disabled>Loading users...</SelectItem>
                                                        ) : users.length === 0 ? (
                                                            <SelectItem value="" disabled>No users found</SelectItem>
                                                        ) : (
                                                            users.map(user => (
                                                                <SelectItem key={user.id} value={user.id}>
                                                                    {user.username || user.email}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleClearSpecificUserSocialData}
                                            disabled={isClearingSpecificUser || !selectedUserId}
                                        >
                                            {isClearingSpecificUser ? 'Clearing...' : 'Clear User Data'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="queue">
                        <Card>
                            <CardHeader>
                                <CardTitle>Queue Management</CardTitle>
                                <CardDescription>
                                    Tools for managing media queue data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-medium">Fix Queue Numbers</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Reset and fix queue numbers for all users
                                        </p>
                                    </div>
                                    <FixQueueButton />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="Green Man Gaming">
                        <Card>
                            <CardHeader>
                                <CardTitle>Green Man Gaming Catalog</CardTitle>
                                <CardDescription>
                                    Sync and manage the Green Man Gaming catalog
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <GmgCatalogSyncButton />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <UserManagement />
            </div>
        </>
    );
} 