import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';
import selectedMediaItemReducer from './slices/selectedMediaItemSlice';
import mediaItemReducer from './slices/mediaItemSlice';

const store = configureStore({
    reducer: {
        search: searchReducer,
        selectedMediaItem: selectedMediaItemReducer,
        mediaItem: mediaItemReducer,
        // other reducers...
    },
});

export default store;