import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    queueNumber: { type: Number, default: 0 },
    duration: { type: Number, required: true },//
    completedDuration: { type: Number, required: true },//
    percentComplete: { type: Number, required: true },//
    complete: { type: Boolean, required: false },
    category: { type: String, required: true },
    mediaType: { type: String, required: true },//
    description: { type: String },
    posterPath: { type: String },
    backdropPath: { type: String },
    additionalFields: { type: Map, of: mongoose.Schema.Types.Mixed },
    userEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    comments: {
        type: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                text: { type: String, required: true },
                replies: [
                    {
                        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                        text: { type: String, required: true },
                        createdAt: { type: Date, default: Date.now }
                    }
                ],
                createdAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    }
}, { timestamps: true });

const MediaItem = mongoose.models.MediaItem || mongoose.model('MediaItem', mediaItemSchema);

export default MediaItem;