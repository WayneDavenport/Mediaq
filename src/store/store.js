import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';
import selectedMediaItemReducer from './slices/selectedMediaItemSlice';
import mediaItemReducer from './slices/mediaItemSlice';
import lockFormReducer from './slices/lockFormSlice';

const store = configureStore({
    reducer: {
        search: searchReducer,
        selectedMediaItem: selectedMediaItemReducer,
        mediaItem: mediaItemReducer,
        lockForm: lockFormReducer,
        // other reducers...
    },
});

export default store;