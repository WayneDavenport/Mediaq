import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Comment from './Comment';
import styles from './CommentList.module.css';

const CommentList = ({ mediaItemId }) => {
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const { data } = await axios.get(`/api/getComments?mediaItemId=${mediaItemId}`);
                setComments(data);
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        };

        fetchComments();

    }, [mediaItemId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/addComment', { mediaItemId, text: commentText });
            if (response.status === 200) {
                setCommentText('');
                setComments([...comments, response.data]);
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
            {comments.map((comment) => (
                comment && <Comment key={comment.id} comment={comment} />
            ))}
        </div>
    );
};

export default CommentList;