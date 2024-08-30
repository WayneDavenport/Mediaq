// src/store/slices/modalSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isVisible: false,
    content: null, // This will now store data, not React elements
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        showModal: (state, action) => {
            state.isVisible = true;
            state.content = action.payload; // Store the data here
        },
        hideModal: (state) => {
            state.isVisible = false;
            state.content = null;
        },
    },
});

export const { showModal, hideModal } = modalSlice.actions;
export default modalSlice.reducer;