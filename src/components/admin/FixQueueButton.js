'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FixQueueButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleFix = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/media-items/fix-queue', {
                method: 'POST'
            });
            const data = await response.json();

            if (response.ok) {
                if (data.updatedCount > 0) {
                    toast.success(
                        `Queue numbers fixed!`,
                        {
                            description: `Updated ${data.updatedCount} out of ${data.totalItems} items.`
                        }
                    );
                } else {
                    toast.info(
                        `Queue numbers are already correct!`,
                        {
                            description: `All ${data.totalItems} items are properly numbered.`
                        }
                    );
                }
            } else {
                toast.error('Failed to fix queue numbers', {
                    description: data.error
                });
            }
        } catch (error) {
            console.error('Error fixing queue:', error);
            toast.error('Failed to fix queue numbers', {
                description: 'An unexpected error occurred.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleFix}
            disabled={isLoading}
            variant="outline"
            size="sm"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing Queue...
                </>
            ) : (
                'Fix Queue Numbers'
            )}
        </Button>
    );
} 