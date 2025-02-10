'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import supabaseRealtime from '@/lib/supabaseRealtimeClient';

const Comments = ({ mediaItemId, currentUser }) => {
    const [isPending, startTransition] = useTransition();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyText, setReplyText] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!mediaItemId) return;

        // Fetch initial comments
        fetchComments();

        // Set up realtime subscription
        const commentsSubscription = supabaseRealtime
            .channel('comments-channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `media_item_id=eq.${mediaItemId}`
            }, (payload) => {
                setComments(prev => [payload.new, ...prev]);
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comment_replies',
                filter: `comment_id=in.(${comments.map(c => c.id).join(',')})`
            }, (payload) => {
                setComments(prev => prev.map(comment =>
                    comment.id === payload.new.comment_id
                        ? {
                            ...comment,
                            replies: [
                                ...(comment.replies || []),
                                {
                                    ...payload.new,
                                    user: currentUser // Add current user data
                                }
                            ]
                        }
                        : comment
                ));
            })
            .subscribe();

        return () => {
            supabaseRealtime.removeChannel(commentsSubscription);
        };
    }, [mediaItemId, comments]); // Add comments to dependency array

    const fetchComments = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/comments?mediaItemId=${mediaItemId}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            startTransition(() => {
                setComments(data.comments || []);
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    media_item_id: mediaItemId,
                    content: newComment.trim()
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setComments(prev => [data.comment, ...prev]);
            setNewComment('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmitReply = async (commentId) => {
        if (!replyText[commentId]?.trim()) return;

        try {
            const response = await fetch(`/api/comments/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: replyText[commentId].trim()
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setComments(prev => prev.map(comment =>
                comment.id === commentId
                    ? {
                        ...comment,
                        replies: [
                            ...(comment.replies || []),
                            {
                                ...data.reply,
                                user: currentUser
                            }
                        ]
                    }
                    : comment
            ));

            setReplyText(prev => ({ ...prev, [commentId]: '' }));
            setReplyingTo(null);
        } catch (err) {
            setError(err.message);
        }
    };

    if (!mediaItemId) return null;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px]"
                />
                <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                >
                    Post Comment
                </Button>
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="space-y-4">
                {comments.map((comment) => {
                    if (!comment.user) {
                        console.warn('Comment has no user data:', comment);
                        return null;
                    }

                    return (
                        <div key={comment.id} className="space-y-2">
                            <div className="flex items-start gap-2 bg-muted p-3 rounded-lg">
                                <Avatar>
                                    <AvatarFallback>
                                        {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {comment.user?.username || 'Unknown User'}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="mt-1">{comment.content}</p>
                                    {replyingTo !== comment.id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setReplyingTo(comment.id)}
                                            className="mt-2"
                                        >
                                            Reply
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                                <div className="ml-8 space-y-2">
                                    <Textarea
                                        placeholder="Write a reply..."
                                        value={replyText[comment.id] || ''}
                                        onChange={(e) => setReplyText(prev => ({
                                            ...prev,
                                            [comment.id]: e.target.value
                                        }))}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleSubmitReply(comment.id)}
                                            disabled={!replyText[comment.id]?.trim()}
                                        >
                                            Post Reply
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setReplyingTo(null);
                                                setReplyText(prev => ({ ...prev, [comment.id]: '' }));
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Replies */}
                            {comment.replies?.length > 0 && (
                                <div className="ml-8 space-y-2">
                                    {comment.replies.map((reply) => {
                                        if (!reply.user) {
                                            console.warn('Reply has no user data:', reply);
                                            return null;
                                        }

                                        return (
                                            <div key={reply.id} className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                                                <Avatar>
                                                    <AvatarFallback>
                                                        {reply.user?.username?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {reply.user?.username || 'Unknown User'}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1">{reply.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Comments; 