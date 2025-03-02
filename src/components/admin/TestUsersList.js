'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { Copy, User, GamepadIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function TestUsersList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTestUsers();
    }, []);

    const fetchTestUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/test-users');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch test users');
            }

            setUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching test users:', error);
            toast.error(error.message || 'Failed to fetch test users');
        } finally {
            setLoading(false);
        }
    };

    const copyCredentials = (email) => {
        navigator.clipboard.writeText(`Email: ${email}\nPassword: Test123!`);
        toast.success('Credentials copied to clipboard');
    };

    if (loading) {
        return <div>Loading test users...</div>;
    }

    if (users.length === 0) {
        return (
            <div className="text-center p-4 border rounded-md">
                <p className="text-muted-foreground">No test users found</p>
                <p className="text-sm mt-2">Create some test users to see them here</p>
            </div>
        );
    }

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
                    {users.map((user) => {
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
    );
} 