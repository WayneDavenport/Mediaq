import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchMediaItem = createAsyncThunk(
    'mediaItem/fetchMediaItem',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/getMediaItemById?id=${id}`);
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
    reducers: {
        updateComments: (state, action) => {
            if (state.data) {
                state.data.comments = action.payload;
            }
        }
    },
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
            });
    }
});

export const { updateComments } = mediaItemSlice.actions;

export const listenForComments = (dispatch) => {
    const eventSource = new EventSource('/api/commentsSSE');

    eventSource.onmessage = (event) => {
        const newComments = JSON.parse(event.data);
        dispatch(updateComments(newComments));
    };

    return () => {
        eventSource.close();
    };
};

export default mediaItemSlice.reducer;