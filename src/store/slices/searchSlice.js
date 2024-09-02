// src/store/slices/searchSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    searchResults: [],
    stagingItem: null,
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        setSearchResults(state, action) {
            state.searchResults = action.payload;
        },
        setStagingItem(state, action) {
            state.stagingItem = action.payload;
        },
        clearSearchItem(state) {
            state.stagingItem = null; // Clear the stagingItem
        },
    },
});

export const { setSearchResults, setStagingItem, clearSearchItem } = searchSlice.actions;

export default searchSlice.reducer;