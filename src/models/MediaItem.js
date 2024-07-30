import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    completedDuration: { type: Number, required: true },
    percentComplete: { type: Number, required: true },
    complete: { type: Boolean, required: false },
    category: { type: String, required: true },
    mediaType: { type: String, required: true },
    description: { type: String },
    additionalFields: { type: Map, of: mongoose.Schema.Types.Mixed },
    userEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    locked: { type: Boolean, default: false },
    keyParent: { type: String, default: '' },
    goalCompletionTime: { type: Number, default: 0 },
    keyParentProgress: { type: Number, default: 0 }, // New field
}, { timestamps: true });

const MediaItem = mongoose.models.MediaItem || mongoose.model('MediaItem', mediaItemSchema);

export default MediaItem;