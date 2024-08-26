import React, { createContext, useState, useContext } from 'react';
import LockedItemsModal from '@/components/LockedItemsModal';
import BackgroundBlur from '@/components/BackgroundBlur';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedMediaItem, setSelectedMediaItem] = useState(null);

    const showModal = () => {
        setIsVisible(true);
    };

    const closeModal = () => {
        setIsVisible(false);
        setSelectedMediaItem(null);
    };

    return (
        <ModalContext.Provider value={{ isVisible, selectedMediaItem, setSelectedMediaItem, showModal, closeModal }}>
            {children}
            <BackgroundBlur isVisible={isVisible} />
            <LockedItemsModal isVisible={isVisible} onClose={closeModal} selectedMediaItem={selectedMediaItem} />
        </ModalContext.Provider>
    );
};