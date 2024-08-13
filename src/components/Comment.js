import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addReply } from '@/store/slices/mediaItemSlice';
import styles from './Comment.module.css';

const Comment = ({ comment, mediaItemId }) => {
    const [replyText, setReplyText] = useState('');
    const [showReplyForm, setShowReplyForm] = useState(false);
    const dispatch = useDispatch();

    const handleReplySubmit = (e) => {
        e.preventDefault();
        dispatch(addReply({ mediaItemId, commentId: comment._id, text: replyText }));
        setReplyText('');
        setShowReplyForm(false);
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