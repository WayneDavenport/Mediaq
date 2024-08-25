// src/components/ReadOnlyView.js
import React from 'react';
import styles from './UpdateForm.module.css';

const ReadOnlyView = ({ item, onEdit }) => {
    return (
        <div className="p-4 border rounded shadow">
            <div className="flex">
                <img src={item.backgroundArt} alt={item.title} className={styles.heroImage} />
                <div className="ml-4">
                    <h2 className="text-4xl font-bold">{item.title}</h2>
                    <p className="text-lg">{item.duration} minutes</p>
                    <p className="text-lg">{item.category}</p>
                </div>
            </div>
            <p className="mt-4 text-lg">{item.description}</p>
            <button onClick={onEdit} className="text-blue-500 mt-2">Edit</button>
        </div>
    );
};

export default ReadOnlyView;