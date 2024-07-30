import { configureStore } from '@reduxjs/toolkit';
import selectedMediaItemReducer from './slices/selectedMediaItemSlice';

const store = configureStore({
    reducer: {
        selectedMediaItem: selectedMediaItemReducer,
    },
});

export default store;