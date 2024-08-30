import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';
import selectedMediaItemReducer from './slices/selectedMediaItemSlice';
import mediaItemReducer from './slices/mediaItemSlice';
import lockFormReducer from './slices/lockFormSlice';
import modalReducer from './slices/modalSlice';


const store = configureStore({
    reducer: {
        search: searchReducer,
        selectedMediaItem: selectedMediaItemReducer,
        mediaItem: mediaItemReducer,
        lockForm: lockFormReducer,
        modal: modalReducer,


        // other reducers...
    },
});

export default store;