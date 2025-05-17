'use client';

import { useState } from 'react';
import ProgressDisplay from './ProgressDisplay';
import AddLockForm from './AddLockForm';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ProgressSection({
    item,
    onUpdateClick,
    allCategories,
    mediaItems,
    incompleteItems,
    onOptimisticItemUpdate,
    onServerConfirmedItemUpdate,
    onItemUpdateError
}) {
    const [showLockForm, setShowLockForm] = useState(false);
    const [isAddingLock, setIsAddingLock] = useState(false);

    const handleLockSubmit = async (formData) => {
        if (!onOptimisticItemUpdate || !onServerConfirmedItemUpdate || !onItemUpdateError) {
            console.error("Optimistic update handlers are not provided to ProgressSection");
            toast.error("Cannot add lock: Configuration error.");
            return;
        }
        setIsAddingLock(true);

        const newLockOptimistic = {
            id: item.id,
            key_parent_text: formData.key_parent_id ? null : formData.key_parent_text,
            key_parent_id: formData.key_parent_id || null,
            lock_type: formData.key_parent_id ? 'specific' : (['movie', 'book', 'tv', 'game'].includes(formData.key_parent_text?.toLowerCase()) ? 'media_type' : 'category'),
            goal_time: formData.goal_time || null,
            goal_pages: formData.goal_pages || null,
            goal_episodes: formData.goal_episodes || null,
            goal_units: formData.goal_units || null,
            completed: false,
            completed_time: 0,
            pages_completed: 0,
            episodes_completed: 0,
            units_completed: 0,
        };

        const optimisticallyUpdatedItem = {
            ...item,
            locked_items: [...(item.locked_items || []), newLockOptimistic]
        };

        onOptimisticItemUpdate(item.id, optimisticallyUpdatedItem);

        try {
            const response = await fetch('/api/media-items/add-lock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    media_item_id: item.id,
                    ...formData
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to add lock requirements');
            }

            onServerConfirmedItemUpdate(result.data);

            setShowLockForm(false);
            toast.success('Lock requirements added successfully');
        } catch (error) {
            console.error('Error adding lock:', error);
            toast.error(error.message);
            onItemUpdateError(item.id);
        } finally {
            setIsAddingLock(false);
        }
    };

    const isItemCompleted = (itemId) => {
        return mediaItems.find(item => item.id === itemId)?.user_media_progress?.completed;
    };

    const lockedItem = item.locked_items?.find(lock =>
        lock.key_parent_id === item.id
    );

    const allLocksCompleted = item.locked_items?.length > 0 && item.locked_items.every(lock => lock.completed);
    const hasActiveLocks = item.locked_items?.some(lock => !lock.completed);

    return (
        <div className="space-y-4 relative z-40">
            {showLockForm ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Set Lock Requirements</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLockForm(false)}
                            disabled={isAddingLock}
                        >
                            Cancel
                        </Button>
                    </div>
                    <AddLockForm
                        onSubmit={handleLockSubmit}
                        allCategories={allCategories}
                        incompleteItems={incompleteItems}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <ProgressDisplay item={item} onUpdateClick={onUpdateClick} mediaItems={mediaItems} />
                    {(!item.locked_items?.length || allLocksCompleted) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLockForm(true)}
                            className="w-full"
                            disabled={isAddingLock}
                        >
                            {isAddingLock ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {allLocksCompleted ? 'Relock This ' : 'Lock This '}
                            {item.media_type.charAt(0).toUpperCase() + item.media_type.slice(1)}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
} 