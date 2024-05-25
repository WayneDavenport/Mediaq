import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    percentComplete: { type: Number, required: true },
    complete: { type: Boolean, required: false },
    category: { type: String, required: true },
    mediaType: { type: String, required: true },
    description: { type: String },
    additionalFields: { type: Map, of: String },
    userEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    lockCondition: {
        type: {
            type: String,
            enum: ['mediaItem', 'categoryTime', 'mediaTypeTime', 'none'],
            required: false
        },
        value: { type: String, required: false },
        duration: { type: Number, required: false }
    },
    goalCompletionTime: { type: Number, required: false, default: 0 },
    completedDuration: { type: Number, required: false, default: 0 }
}, { timestamps: true }); // Enable timestamps

const MediaItem = mongoose.models.MediaItem || mongoose.model('MediaItem', mediaItemSchema);

export default MediaItem;