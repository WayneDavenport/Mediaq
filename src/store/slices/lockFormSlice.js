// src/store/slices/lockFormSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    locked: false,
    keyParent: '',
    goalTime: 0,
    goalPages: 0,
    goalEpisodes: 0
};

const lockFormSlice = createSlice({
    name: 'lockForm',
    initialState,
    reducers: {
        setLockFormData: (state, action) => {
            return { ...state, ...action.payload };
        },
        resetLockFormData: () => initialState
    }
});

export const { setLockFormData, resetLockFormData } = lockFormSlice.actions;
export default lockFormSlice.reducer;