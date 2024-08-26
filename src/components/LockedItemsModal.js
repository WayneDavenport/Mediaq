import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import styles from './LockedItemsModal.module.css';

const modalVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
};

const LockedItemsModal = ({ isVisible, onClose, selectedMediaItem }) => {
    const [lockedItems, setLockedItems] = useState([]);

    useEffect(() => {
        if (isVisible && selectedMediaItem) {
            const fetchLockedItems = async () => {
                try {
                    const response = await axios.get(`/api/getLockedItems?keyParent=${selectedMediaItem._id}`);
                    setLockedItems(response.data.lockedItems);
                } catch (error) {
                    console.error('Failed to fetch locked items:', error);
                }
            };

            fetchLockedItems();

            const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [isVisible, selectedMediaItem, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={styles.modalOverlay}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants}
                >
                    <div className={styles.modalContent}>
                        <h2>Affected Locked Items</h2>
                        <ul>
                            {lockedItems.map(item => (
                                <li key={item._id}>{item.lockedItemName}</li>
                            ))}
                        </ul>
                        <button onClick={onClose} className={styles.closeButton}>Close</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LockedItemsModal;