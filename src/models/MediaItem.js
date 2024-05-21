import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: String, required: true },
    category: { type: String, required: true },
    mediaType: { type: String, required: true },
    description: { type: String },
    additionalFields: { type: Map, of: String },
    userEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true }); // Enable timestamps

const MediaItem = mongoose.models.MediaItem || mongoose.model('MediaItem', mediaItemSchema, 'mediaItems');

export default MediaItem;