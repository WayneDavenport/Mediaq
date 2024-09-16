import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Comment.module.css';
import supabase from '@/lib/supabaseClient';

const Comment = ({ comment }) => {
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const fetchReplies = async () => {
            try {
                const { data } = await axios.get(`/api/getReplies?commentId=${comment.id}`);
                setReplies(data);
            } catch (error) {
                console.error('Error fetching replies:', error);
            }
        };

        fetchReplies();
    }, [comment.id]);

    const handleAddReply = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/addReply', { commentId: comment.id, text: replyText });
            if (response.status === 200 && response.data) {
                setReplies([...replies, response.data]);
                setReplyText(''); // Clear the input field after submission
            }
        } catch (error) {
            console.error('Error adding reply:', error);
        }
    };

    useEffect(() => {
        const subscription = supabase
            .channel('public:replies') // Use the public channel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'replies',
                    filter: `comment_id=eq.${comment.id}`
                },
                (payload) => {
                    console.log('New reply received:', payload);
                    setReplies(prevReplies => [...prevReplies, payload.new]);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [comment.id]);

    return (
        <div className={styles.comment}>
            {comment && (
                <p>
                    <strong>{comment.user_name}:</strong> {comment.text}
                </p>
            )}
            <div className={styles.replies}>
                {replies.map(reply => (
                    <div key={reply.id} className={styles.reply}>
                        {reply && (
                            <p>
                                <strong>{reply.user_name}:</strong> {reply.text}
                            </p>
                        )}
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddReply} className={styles.addReplyForm}>
                <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className={styles.replyInput}
                />
                <button type="submit" className={styles.replyButton}>Submit</button>
            </form>
        </div>
    );
};

export default Comment;