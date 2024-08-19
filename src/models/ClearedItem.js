// src/models/ClearedItem.js
import mongoose from 'mongoose';

const ClearedItemSchema = new mongoose.Schema({
    lockedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem', required: true },
    lockedItemName: { type: String, required: true },
    keyParent: { type: String, required: true },
    goalTime: { type: Number, required: true },
    goalPages: { type: Number, required: true },
    goalEpisodes: { type: Number, required: true },
    timeComplete: { type: Number, required: true },
    percentComplete: { type: Number, required: true },
    pagesComplete: { type: Number, required: true },
    episodesComplete: { type: Number, required: true },
    clearedAt: { type: Date, default: Date.now }
});

export default mongoose.models.ClearedItem || mongoose.model('ClearedItem', ClearedItemSchema);