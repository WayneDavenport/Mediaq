// controllers/lockController.js
import MediaItem from '@/models/MediaItem';

export const isItemLocked = async (item, userId) => {
    if (!item.lockCondition || !item.lockCondition.type) {
        return false;
    }

    const mediaItems = await MediaItem.find({ userId });

    if (item.lockCondition.type === 'mediaItem') {
        const requiredItem = mediaItems.find(i => i._id.toString() === item.lockCondition.value);
        return !requiredItem || !requiredItem.complete;
    }

    if (item.lockCondition.type === 'categoryTime') {
        const totalCompletedTime = mediaItems
            .filter(i => i.category === item.lockCondition.value && i.complete)
            .reduce((acc, i) => acc + i.completedDuration, 0);
        return totalCompletedTime < item.goalCompletionTime;
    }

    if (item.lockCondition.type === 'mediaTypeTime') {
        const totalCompletedTime = mediaItems
            .filter(i => i.mediaType === item.lockCondition.value && i.complete)
            .reduce((acc, i) => acc + i.completedDuration, 0);
        return totalCompletedTime < item.goalCompletionTime;
    }

    return false;
};
