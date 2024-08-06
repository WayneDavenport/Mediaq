// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';

const store = configureStore({
    reducer: {
        search: searchReducer,
        // other reducers...
    },
});

export default store;