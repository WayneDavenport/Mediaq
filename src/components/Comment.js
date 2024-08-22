import React, { useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import styles from './Comment.module.css';

const socket = io(); // Initialize socket connection

const Comment = ({ comment, mediaItemId }) => {
    const [replyText, setReplyText] = useState('');
    const [showReplyForm, setShowReplyForm] = useState(false);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/addReply', { mediaItemId, commentId: comment._id, text: replyText });
            if (response.status === 200) {
                setReplyText('');
                setShowReplyForm(false);
                // Emit event to server to trigger WebSocket update
                socket.emit('replyAdded', mediaItemId);
            }
        } catch (error) {
            console.error('Error adding reply:', error);
        }
    };

    return (
        <div className={styles.comment}>
            <p>{comment.text}</p>
            <button className={styles.button} onClick={() => setShowReplyForm(!showReplyForm)}>Reply</button>
            {showReplyForm && (
                <form className={styles.form} onSubmit={handleReplySubmit}>
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className={styles.input}
                    />
                    <button className={styles.button} type="submit">Submit</button>
                </form>
            )}
            {comment.replies && comment.replies.map((reply) => (
                <div key={reply._id} className={styles.reply}>
                    <p>{reply.text}</p>
                </div>
            ))}
        </div>
    );
};

export default Comment;