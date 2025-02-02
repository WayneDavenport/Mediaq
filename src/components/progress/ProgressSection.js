'use client';

import { useState } from 'react';
import ProgressDisplay from './ProgressDisplay';
import AddLockForm from './AddLockForm';
import { Button } from '../ui/button';

export default function ProgressSection({
    item,
    onUpdateClick,
    allCategories,
    incompleteItems
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
                throw new Error('Failed to add lock');
            }

            setShowLockForm(false);
            // You might want to add a refresh function here to update the item data
        } catch (error) {
            console.error('Error adding lock:', error);
        }
    };

    if (showLockForm) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Add Lock Requirements</h3>
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
        );
    }

    return (
        <div className="space-y-4">
            <ProgressDisplay item={item} onUpdateClick={onUpdateClick} />
            {!item.locked_items?.length && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLockForm(true)}
                    className="w-full"
                >
                    Add Lock Requirements
                </Button>
            )}
        </div>
    );
} 