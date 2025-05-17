'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import supabaseRealtime from '@/lib/supabaseRealtimeClient';
import debounce from 'lodash/debounce';

const Comments = ({ mediaItemId, currentUser }) => {
    const [isPending, startTransition] = useTransition();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyText, setReplyText] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const lastProcessedComment = useRef(null);
    const processedComments = useRef(new Set());

    const addNewComment = useCallback(
        debounce((payload) => {
            const commentId = payload.new.id;

            if (processedComments.current.has(commentId)) {
                console.log('Comment already processed (debounced):', commentId);
                return;
            }

            setComments(prevComments => {
                if (prevComments.some(comment => comment.id === commentId)) {
                    console.log('Comment already exists in state:', commentId);
                    return prevComments;
                }

                processedComments.current.add(commentId);
                console.log('Adding new comment:', commentId);

                const newComment = {
                    ...payload.new,
                    user: payload.new.user_id === currentUser.id ? currentUser : null,
                    replies: []
                };
                return [newComment, ...prevComments];
            });
        }, 100),
        [currentUser]
    );

    useEffect(() => {
        if (!mediaItemId) return;

        fetchComments();
        processedComments.current.clear();

        const channel = supabaseRealtime.channel(`comments-${mediaItemId}`);

        const subscription = channel
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `media_item_id=eq.${mediaItemId}`
            }, (payload) => {
                console.log('Received new comment:', payload.new.id);
                addNewComment(payload);
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comment_replies',
                filter: `comment_id=in.(${comments.map(c => c.id).join(',')})`
            }, (payload) => {
                setComments(prevComments => {
                    return prevComments.map(comment => {
                        if (comment.id === payload.new.comment_id) {
                            // Check if reply already exists
                            const replyExists = comment.replies?.some(reply => reply.id === payload.new.id);
                            if (replyExists) return comment;

                            // Add new reply
                            const updatedReplies = [...(comment.replies || []), {
                                ...payload.new,
                                user: payload.new.user_id === currentUser.id ? currentUser : null
                            }];
                            return { ...comment, replies: updatedReplies };
                        }
                        return comment;
                    });
                });
            })
            .subscribe();

        return () => {
            console.log('Cleaning up subscription');
            addNewComment.cancel();
            processedComments.current.clear();
            supabaseRealtime.removeChannel(channel);
        };
    }, [mediaItemId, currentUser?.id, addNewComment]);

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
        <div>
            {/* Comment form */}
            <div className="space-y-4 mb-6">
                <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                >
                    Post Comment
                </Button>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
                {comments.map((comment) => {
                    return (
                        <div key={`comment-${comment.id}-${comment.created_at}`} className="space-y-2">
                            <div className="flex items-start gap-2">
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
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-1"
                                        onClick={() => setReplyingTo(comment.id)}
                                    >
                                        Reply
                                    </Button>
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
                                            <div
                                                key={`reply-${reply.id}-${reply.created_at}`}
                                                className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg"
                                            >
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