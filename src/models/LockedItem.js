// src/models/LockedItem.js
import mongoose from 'mongoose';

const LockedItemSchema = new mongoose.Schema({
    lockedItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaItem',
        required: true
    },
    lockedItemName: {
        type: String, // Can be Media Item ID, category, or media type
        /* required: true */
    },
    keyParent: {
        type: String, // Can be Media Item ID, category, or media type
        required: true
    },
    goalTime: {
        type: Number,
        required: true
    },
    goalPages: {
        type: Number
    },
    goalEpisodes: {
        type: Number
    },
    timeComplete: {
        type: Number,
        default: 0
    },
    percentComplete: {
        type: Number,
        default: 0
    },
    pagesComplete: {
        type: Number,
        default: 0
    },
    episodesComplete: {
        type: Number,
        default: 0
    },
    cleared: {
        type: Boolean,
        default: false
    }
});

const LockedItem = mongoose.models.LockedItem || mongoose.model('LockedItem', LockedItemSchema);

export default LockedItem;