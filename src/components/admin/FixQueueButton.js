'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function FixQueueButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFix = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/media-items/fix-queue', {
                method: 'POST'
            });
            const data = await response.json();
            if (response.ok) {
                setResult(`Successfully updated ${data.updatedCount} items`);
            } else {
                setResult('Error: ' + data.error);
            }
        } catch (error) {
            setResult('Error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Button
                onClick={handleFix}
                disabled={isLoading}
            >
                {isLoading ? 'Fixing Queue Numbers...' : 'Fix Queue Numbers'}
            </Button>
            {result && <p className="mt-2 text-sm">{result}</p>}
        </div>
    );
} 