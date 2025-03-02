'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function QueueGameItem({ gameData }) {
    const [affiliateInfo, setAffiliateInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getAffiliateData() {
            if (gameData.title) {
                setLoading(true);
                try {
                    const response = await fetch(`/api/gmg/affiliate-link?title=${encodeURIComponent(gameData.title)}`);
                    const data = await response.json();
                    setAffiliateInfo(data.link);
                } catch (error) {
                    console.error('Error fetching affiliate link:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }

        getAffiliateData();
    }, [gameData.title]);

    return (
        <div className="mt-4">
            {!loading && affiliateInfo && (
                <div className="bg-muted/20 p-3 rounded-md border">
                    <div className="flex items-center gap-3">
                        {affiliateInfo.image_url && (
                            <img
                                src={affiliateInfo.image_url}
                                alt={gameData.title}
                                className="w-16 h-16 object-cover rounded"
                            />
                        )}
                        <div>
                            <p className="text-sm font-medium">Available on Green Man Gaming</p>
                            <p className="text-sm text-primary">{affiliateInfo.price} {affiliateInfo.currency}</p>
                        </div>
                        <div className="ml-auto">
                            <a
                                href={affiliateInfo.affiliate_link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button size="sm" variant="default">Buy Now</Button>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 