import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchMediaItem = createAsyncThunk(
    'mediaItem/fetchMediaItem',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/getMediaItemById?id=${id}`);
            if (response.status === 200) {
                const item = response.data;

                // Fetch image URL
                let imageUrl = '';
                if (item.mediaType === 'Book' && item.additionalFields.isbn) {
                    const imageResponse = await axios.get(`https://covers.openlibrary.org/b/isbn/${item.additionalFields.isbn}-M.jpg`);
                    if (imageResponse.status === 200) {
                        imageUrl = imageResponse.config.url;
                    }
                } else if (item.mediaType === 'Movie' || item.mediaType === 'Show') {
                    const imageResponse = await axios.get('/api/tmdb', {
                        params: {
                            query: item.title,
                            mediaType: item.mediaType.toLowerCase()
                        }
                    });
                    if (imageResponse.data.results.length > 0) {
                        imageUrl = `https://image.tmdb.org/t/p/w500${imageResponse.data.results[0].poster_path}`;
                    }
                } else if (item.mediaType === 'VideoGame' && item.additionalFields.coverArt) {
                    imageUrl = item.additionalFields.coverArt;
                }

                return { ...item, imageUrl };
            }
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const addComment = createAsyncThunk(
    'mediaItem/addComment',
    async ({ mediaItemId, text }, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/addComment', { mediaItemId, text });
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const addReply = createAsyncThunk(
    'mediaItem/addReply',
    async ({ mediaItemId, commentId, text }, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/addReply', { mediaItemId, commentId, text });
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const mediaItemSlice = createSlice({
    name: 'mediaItem',
    initialState: {
        data: null,
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMediaItem.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMediaItem.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchMediaItem.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                state.data = action.payload;
            })
            .addCase(addReply.fulfilled, (state, action) => {
                state.data = action.payload;
            });
    }
});

export default mediaItemSlice.reducer;