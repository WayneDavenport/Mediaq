// src/context/MediaItemsContext.js
import React, { createContext, useState, useContext } from 'react';

const MediaItemsContext = createContext();

export const useMediaItems = () => useContext(MediaItemsContext);

export const MediaItemsProvider = ({ children }) => {
    const [mediaItems, setMediaItems] = useState([]);

    const addMediaItem = (newItem) => {
        setMediaItems((prevItems) => [...prevItems, newItem]);
    };

    const updateMediaItems = (items) => {
        setMediaItems(items);
    };

    return (
        <MediaItemsContext.Provider value={{ mediaItems, addMediaItem, updateMediaItems }}>
            {children}
        </MediaItemsContext.Provider>
    );
};