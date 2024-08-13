import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addComment } from '@/store/slices/mediaItemSlice';
import Comment from './Comment';
import styles from './CommentList.module.css';

const CommentList = ({ comments, mediaItemId }) => {
    const [commentText, setCommentText] = useState('');
    const dispatch = useDispatch();

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        dispatch(addComment({ mediaItemId, text: commentText }));
        setCommentText('');
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