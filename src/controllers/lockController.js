// controllers/lockController.js
import MediaItem from '@/models/MediaItem';
import { pages } from 'next/dist/build/templates/app-page';

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

/* {
    lockedItem: 'object id number - required';
    keyParent: 'Media Item, category, or media type(object id) - required';
    GoalTime: 'number of minutes - required'
    (if Book) Goal pages: "number of pages - not required";
    (if Show) Goal episodes: "number of pages - not required"; 
    timeComplete: "initially 0. Updated when keyparent has CompletedDuration updated";
    percentComplete: "intitially 0/ same";
    pagesComplete:"initially 0/ same";
    episodesComplete:""


}
 */