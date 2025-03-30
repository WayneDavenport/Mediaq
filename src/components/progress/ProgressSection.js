'use client';

import { useState } from 'react';
import ProgressDisplay from './ProgressDisplay';
import AddLockForm from './AddLockForm';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function ProgressSection({
    item,
    onUpdateClick,
    allCategories,
    mediaItems,
    incompleteItems,
    onItemUpdate
}) {
    const [showLockForm, setShowLockForm] = useState(false);

    const handleLockSubmit = async (data) => {
        try {
            const response = await fetch('/api/media-items/add-lock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    media_item_id: item.id,
                    ...data
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add lock');
            }

            const lockData = await response.json();

            // Update the item locally with the new lock
            const updatedItem = {
                ...item,
                locked_items: [lockData]
            };

            // Call the update function passed from parent
            if (onItemUpdate) {
                onItemUpdate(updatedItem);
            }

            setShowLockForm(false);
            toast.success('Lock requirements added successfully');
        } catch (error) {
            console.error('Error adding lock:', error);
            toast.error(error.message);
        }
    };

    const isItemCompleted = (itemId) => {
        return mediaItems.find(item => item.id === itemId)?.user_media_progress?.completed;
    };

    const lockedItem = item.locked_items?.find(lock =>
        lock.key_parent_id === item.id
    );

    // Helper to determine if all existing locks are completed
    const allLocksCompleted = item.locked_items?.length > 0 && item.locked_items.every(lock => lock.completed);
    // Helper to determine if there are any active (non-completed) locks
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
                        >
                            {allLocksCompleted ? 'Relock This ' : 'Lock This '}
                            {item.media_type.charAt(0).toUpperCase() + item.media_type.slice(1)}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
} 