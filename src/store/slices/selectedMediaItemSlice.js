import { createSlice } from '@reduxjs/toolkit';

const selectedMediaItemSlice = createSlice({
    name: 'selectedMediaItem',
    initialState: null,
    reducers: {
        setSelectedMediaItem: (state, action) => action.payload,
        clearSelectedMediaItem: () => null,
    },
});

export const { setSelectedMediaItem, clearSelectedMediaItem } = selectedMediaItemSlice.actions;
export default selectedMediaItemSlice.reducer;