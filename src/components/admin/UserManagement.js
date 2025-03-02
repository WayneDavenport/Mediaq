'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from 'sonner';
import { Search, ChevronDown, ChevronUp, RefreshCw, Eye, Book, Film, Gamepad, Tv2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [selectedUser, setSelectedUser] = useState(null);
    const [userMedia, setUserMedia] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [activeMediaTab, setActiveMediaTab] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, [sortBy, sortOrder, page, limit]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                search,
                sortBy,
                sortOrder,
                page,
                limit
            });

            const response = await fetch(`/api/admin/users?${queryParams}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }

            setUsers(data.users || []);
            setPagination(data.pagination || { total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error(error.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to first page on new search
        fetchUsers();
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleUserSelect = async (userId) => {
        try {
            setLoadingMedia(true);

            // Find the user in our current list
            const user = users.find(u => u.id === userId);
            setSelectedUser(user);

            // Fetch user's media items
            const response = await fetch(`/api/admin/users/${userId}/media`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user media');
            }

            setUserMedia(data.mediaItems || []);
        } catch (error) {
            console.error('Error fetching user media:', error);
            toast.error(error.message || 'Failed to load user media');
            setUserMedia([]);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPage(newPage);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getMediaTypeIcon = (type) => {
        switch (type) {
            case 'book':
                return <Book className="h-4 w-4" />;
            case 'movie':
                return <Film className="h-4 w-4" />;
            case 'tv':
                return <Tv2 className="h-4 w-4" />;
            case 'game':
                return <Gamepad className="h-4 w-4" />;
            default:
                return <Eye className="h-4 w-4" />;
        }
    };

    const getMediaTypeColor = (type) => {
        switch (type) {
            case 'book':
                return 'bg-blue-100 text-blue-800';
            case 'movie':
                return 'bg-red-100 text-red-800';
            case 'tv':
                return 'bg-purple-100 text-purple-800';
            case 'game':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredMediaItems = userMedia.filter(item => {
        if (activeMediaTab === 'all') return true;
        return item.media_type === activeMediaTab;
    });

    return (
        <div className="space-y-6">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search users..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </form>
                <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                            <span className="flex items-center">
                                Sort by
                                {sortOrder === 'asc' ? (
                                    <ChevronUp className="ml-2 h-4 w-4" />
                                ) : (
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                )}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_at">Join Date</SelectItem>
                            <SelectItem value="username">Username</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                        {sortOrder === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchUsers}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Users table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Loading users...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {user.username
                                                    ? user.username.substring(0, 2).toUpperCase()
                                                    : user.email.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{user.username || 'No Username'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{formatDate(user.created_at)}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-1">
                                            {user.is_verified && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Verified
                                                </Badge>
                                            )}
                                            {user.is_admin && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Admin
                                                </Badge>
                                            )}
                                            {user.email.includes('@testmail.io') && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                    Test User
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUserSelect(user.id)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * limit + 1}-{Math.min(page * limit, pagination.total)} of {pagination.total} users
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm">
                            Page {page} of {pagination.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Selected user details */}
            {selectedUser && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <Avatar>
                                <AvatarFallback>
                                    {selectedUser.username
                                        ? selectedUser.username.substring(0, 2).toUpperCase()
                                        : selectedUser.email.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{selectedUser.username || 'No Username'}</CardTitle>
                                <CardDescription>{selectedUser.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="media">
                            <TabsList className="mb-4">
                                <TabsTrigger value="media">Media Items</TabsTrigger>
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                            </TabsList>

                            <TabsContent value="media">
                                {loadingMedia ? (
                                    <div className="text-center p-4">Loading media items...</div>
                                ) : userMedia.length === 0 ? (
                                    <div className="text-center p-4 border rounded-md">
                                        <p className="text-muted-foreground">No media items found for this user</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Media Type Filter */}
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-muted-foreground">
                                                {userMedia.length} media items found
                                            </div>
                                            <TabsList>
                                                <TabsTrigger
                                                    value="all"
                                                    onClick={() => setActiveMediaTab('all')}
                                                    className={activeMediaTab === 'all' ? 'bg-gray-100' : ''}
                                                >
                                                    All
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="book"
                                                    onClick={() => setActiveMediaTab('book')}
                                                    className={activeMediaTab === 'book' ? 'bg-blue-100 text-blue-800' : ''}
                                                >
                                                    <Book className="h-4 w-4 mr-2" />
                                                    Books
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="movie"
                                                    onClick={() => setActiveMediaTab('movie')}
                                                    className={activeMediaTab === 'movie' ? 'bg-red-100 text-red-800' : ''}
                                                >
                                                    <Film className="h-4 w-4 mr-2" />
                                                    Movies
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="tv"
                                                    onClick={() => setActiveMediaTab('tv')}
                                                    className={activeMediaTab === 'tv' ? 'bg-purple-100 text-purple-800' : ''}
                                                >
                                                    <Tv2 className="h-4 w-4 mr-2" />
                                                    TV Shows
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="game"
                                                    onClick={() => setActiveMediaTab('game')}
                                                    className={activeMediaTab === 'game' ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                    <Gamepad className="h-4 w-4 mr-2" />
                                                    Games
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        {/* Media Items Accordion */}
                                        <Accordion type="multiple" className="w-full">
                                            {filteredMediaItems.map((item) => (
                                                <AccordionItem key={item.id} value={item.id}>
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex items-center space-x-3 text-left">
                                                            <div className={`p-2 rounded-md ${getMediaTypeColor(item.media_type)}`}>
                                                                {getMediaTypeIcon(item.media_type)}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium">{item.title}</h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {item.media_type.charAt(0).toUpperCase() + item.media_type.slice(1)} • Added {formatDate(item.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="space-y-4 p-2">
                                                            {/* Media Item Details */}
                                                            <Card>
                                                                <CardHeader className="pb-2">
                                                                    <CardTitle className="text-base">Media Item Details</CardTitle>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                                        <div>
                                                                            <h5 className="text-xs font-medium text-muted-foreground">ID</h5>
                                                                            <p className="font-mono text-xs">{item.id}</p>
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="text-xs font-medium text-muted-foreground">Type</h5>
                                                                            <p>{item.media_type}</p>
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="text-xs font-medium text-muted-foreground">Title</h5>
                                                                            <p>{item.title}</p>
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="text-xs font-medium text-muted-foreground">Category</h5>
                                                                            <p>{item.category || 'N/A'}</p>
                                                                        </div>
                                                                        {item.description && (
                                                                            <div className="col-span-2">
                                                                                <h5 className="text-xs font-medium text-muted-foreground">Description</h5>
                                                                                <p className="text-xs">{item.description}</p>
                                                                            </div>
                                                                        )}
                                                                        {item.genres && (
                                                                            <div className="col-span-2">
                                                                                <h5 className="text-xs font-medium text-muted-foreground">Genres</h5>
                                                                                <p>{item.genres}</p>
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <h5 className="text-xs font-medium text-muted-foreground">Created At</h5>
                                                                            <p>{formatDate(item.created_at)}</p>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>

                                                            {/* Progress Data */}
                                                            {item.progress && (
                                                                <Card>
                                                                    <CardHeader className="pb-2">
                                                                        <CardTitle className="text-base">Progress Data</CardTitle>
                                                                    </CardHeader>
                                                                    <CardContent>
                                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                                            <div>
                                                                                <h5 className="text-xs font-medium text-muted-foreground">Completed</h5>
                                                                                <p>{item.progress.completed ? 'Yes' : 'No'}</p>
                                                                            </div>
                                                                            {item.progress.completed_timestampz && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-muted-foreground">Completed Date</h5>
                                                                                    <p>{formatDate(item.progress.completed_timestampz)}</p>
                                                                                </div>
                                                                            )}
                                                                            {item.progress.duration !== null && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-muted-foreground">Duration</h5>
                                                                                    <p>{item.progress.duration} minutes</p>
                                                                                </div>
                                                                            )}
                                                                            {item.progress.completed_duration !== null && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-muted-foreground">Completed Duration</h5>
                                                                                    <p>{item.progress.completed_duration} minutes</p>
                                                                                </div>
                                                                            )}
                                                                            {item.progress.episodes_completed !== null && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-muted-foreground">Episodes Completed</h5>
                                                                                    <p>{item.progress.episodes_completed}</p>
                                                                                </div>
                                                                            )}
                                                                            {item.progress.pages_completed !== null && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-muted-foreground">Pages Completed</h5>
                                                                                    <p>{item.progress.pages_completed}</p>
                                                                                </div>
                                                                            )}
                                                                            {item.progress.queue_number !== null && (
                                                                                <div>
                                                                                    <h5 className="text-xs font-medium text-muted-foreground">Queue Number</h5>
                                                                                    <p>{item.progress.queue_number}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )}

                                                            {/* Media Type Specific Data */}
                                                            {item.specific_data && (
                                                                <Card>
                                                                    <CardHeader className="pb-2">
                                                                        <CardTitle className="text-base">
                                                                            {item.media_type.charAt(0).toUpperCase() + item.media_type.slice(1)} Specific Data
                                                                        </CardTitle>
                                                                    </CardHeader>
                                                                    <CardContent>
                                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                                            {Object.entries(item.specific_data).map(([key, value]) => {
                                                                                // Skip id and user_id fields
                                                                                if (key === 'id' || key === 'user_id' || key === 'created_at') return null;

                                                                                return (
                                                                                    <div key={key}>
                                                                                        <h5 className="text-xs font-medium text-muted-foreground">
                                                                                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                                                        </h5>
                                                                                        <p>{value !== null ? value.toString() : 'N/A'}</p>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )}

                                                            {/* Comments */}
                                                            {item.comments && item.comments.length > 0 && (
                                                                <Card>
                                                                    <CardHeader className="pb-2">
                                                                        <CardTitle className="text-base flex items-center">
                                                                            <MessageSquare className="h-4 w-4 mr-2" />
                                                                            Comments ({item.comments.length})
                                                                        </CardTitle>
                                                                    </CardHeader>
                                                                    <CardContent>
                                                                        <div className="space-y-2">
                                                                            {item.comments.map(comment => (
                                                                                <div key={comment.id} className="p-2 bg-muted rounded-md text-sm">
                                                                                    <div className="flex justify-between items-start">
                                                                                        <p>{comment.content}</p>
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {formatDate(comment.created_at)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                                                        {comment.user ? `By: ${comment.user.username || comment.user.email}` : ''}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="profile">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                                        <p>{selectedUser.username || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                                        <p>{selectedUser.email}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                                        <p>{`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Reading Speed</h3>
                                        <p>{selectedUser.reading_speed ? `${selectedUser.reading_speed} WPM` : 'Not set'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Joined</h3>
                                        <p>{formatDate(selectedUser.created_at)}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                        <div className="flex space-x-1 mt-1">
                                            {selectedUser.is_verified && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Verified
                                                </Badge>
                                            )}
                                            {selectedUser.is_admin && (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Admin
                                                </Badge>
                                            )}
                                            {selectedUser.email.includes('@testmail.io') && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                    Test User
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


