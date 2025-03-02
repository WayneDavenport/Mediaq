'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GmgCatalogSyncButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSync = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/sync-gmg-catalog', {
                method: 'POST'
            });
            const data = await response.json();

            if (response.ok) {
                toast.success(
                    `GMG Catalog Sync Complete!`,
                    {
                        description: `Successfully synced ${data.count} games to the database.`
                    }
                );
            } else {
                toast.error('Failed to sync GMG catalog', {
                    description: data.error
                });
            }
        } catch (error) {
            console.error('Error syncing GMG catalog:', error);
            toast.error('Failed to sync GMG catalog', {
                description: 'An unexpected error occurred.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleSync}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600"
            variant="default"
            size="sm"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Abducting Green Man Catalog...
                </>
            ) : (
                'Abduct Green Man Catalog'
            )}
        </Button>
    );
} 