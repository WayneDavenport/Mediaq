import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideModal } from '@/store/slices/modalSlice';
import ModalLockedItem from './ModalLockedItem';
import styles from './Modal.module.css';

const Modal = () => {
    const dispatch = useDispatch();
    const { isVisible, content } = useSelector((state) => state.modal);

    if (!isVisible || !content) return null;

    const { updatedItem, lockedItems } = content;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button onClick={() => dispatch(hideModal())} className={styles.closeButton}>Close</button>
                <div className={styles.modalContent}>
                    <h2>Update Summary</h2>
                    <div className={styles.modalSection}>
                        <h3>Updated Item</h3>
                        <div className={styles.item}>
                            <p><strong>{updatedItem.title}</strong></p>
                            <p><strong>Percent Complete:</strong> {updatedItem.percentComplete.toFixed(2)}%</p>
                        </div>
                    </div>
                    {lockedItems.length > 0 && (
                        <div className={styles.modalSection}>
                            <h3>Affected Locked Items</h3>
                            <div className={styles.itemSection}>
                                {lockedItems.map((item, index) => (
                                    <ModalLockedItem
                                        key={index}
                                        mediaItem={item.mediaItem}
                                        lockedItemName={item.lockedItemName}
                                        percentComplete={item.percentComplete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;