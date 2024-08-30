// src/components/FriendZone.js
import React from 'react';
import MediaRow from '@/components/media-gallery/MediaRow';

const FriendZone = ({ friendsMediaQueues }) => {
    return (
        <div className="friend-zone mt-8">
            <h2 className="text-2xl text-white font-bold mb-4">Friend Zone</h2>
            {friendsMediaQueues.length > 0 ? (
                friendsMediaQueues.map((friendQueue, index) => (
                    <div key={index} className="mb-8">
                        <h3 className="text-xl text-white font-semibold mb-2">{friendQueue.email}&apos;s Queue</h3>
                        <MediaRow title="Queue" items={friendQueue.mediaItems} />
                    </div>
                ))
            ) : (
                <p className="text-white">No friends&apos; media queues available</p>
            )}
        </div>
    );
};

export default FriendZone;