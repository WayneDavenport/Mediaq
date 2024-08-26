import React from 'react';
import styles from './BackgroundBlur.module.css';

const BackgroundBlur = ({ isVisible }) => {
    return (
        isVisible && <div className={styles.blurOverlay}></div>
    );
};

export default BackgroundBlur;