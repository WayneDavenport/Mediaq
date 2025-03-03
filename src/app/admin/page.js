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
import { Copy, RefreshCw, Users, Settings, Database, FileSpreadsheet, UserPlus, ShieldAlert } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import GmgCatalogSyncButton from '@/components/admin/GmgCatalogSyncButton';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
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

    // Admin features cards
    const adminFeatures = [
        {
            title: 'User Management',
            description: 'Manage users, roles, and permissions',
            icon: <Users className="h-6 w-6" />,
            href: '/admin/users',
            color: 'bg-blue-500/10 text-blue-500',
        },
        {
            title: 'Create Group Profile',
            description: 'Create hub profiles for community groups',
            icon: <UserPlus className="h-6 w-6" />,
            href: '/admin/create-group-profile',
            color: 'bg-amber-500/10 text-amber-500',
        },
        {
            title: 'Admin Settings',
            description: 'Configure site-wide settings',
            icon: <Settings className="h-6 w-6" />,
            href: '/admin/settings',
            color: 'bg-green-500/10 text-green-500',
        },
        {
            title: 'Database Tools',
            description: 'Manage database operations and backups',
            icon: <Database className="h-6 w-6" />,
            href: '/admin/database',
            color: 'bg-purple-500/10 text-purple-500',
        },
        {
            title: 'Reports',
            description: 'View site analytics and reports',
            icon: <FileSpreadsheet className="h-6 w-6" />,
            href: '/admin/reports',
            color: 'bg-red-500/10 text-red-500',
        },
    ];

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-8 gap-2">
                    <ShieldAlert className="h-6 w-6 text-amber-500" />
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                </div>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">System Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Active Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">283</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Content Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">5,482</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Server Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <p className="text-lg font-medium">Healthy</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {adminFeatures.map((feature, index) => (
                            <Link key={index} href={feature.href} className="block">
                                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                                    <CardHeader>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${feature.color} mb-2`}>
                                            {feature.icon}
                                        </div>
                                        <CardTitle>{feature.title}</CardTitle>
                                        <CardDescription>{feature.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
} 