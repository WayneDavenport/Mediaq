import React, { useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Comment from './Comment';
import styles from './CommentList.module.css';

const socket = io(); // Initialize socket connection

const CommentList = ({ comments, mediaItemId }) => {
    const [commentText, setCommentText] = useState('');

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/addComment', { mediaItemId, text: commentText });
            if (response.status === 200) {
                setCommentText('');
                // Emit event to server to trigger WebSocket update
                socket.emit('commentAdded', mediaItemId);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    return (
        <div className={styles.commentList}>
            <form className={styles.form} onSubmit={handleCommentSubmit}>
                <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className={styles.input}
                />
                <button className={styles.button} type="submit">Submit</button>
            </form>
            {comments && comments.map((comment) => (
                <Comment key={comment._id} comment={comment} mediaItemId={mediaItemId} />
            ))}
        </div>
    );
};

export default CommentList;