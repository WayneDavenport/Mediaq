import React from 'react';
import MediaThumb from '@/components/MediaThumb';

const MediaRow = ({ title, items }) => {
    return (
        <div className="media-row mb-8">
            <h2 className="text-2xl text-white font-bold mb-4">{title}</h2>
            <div className="media-items flex overflow-x-scroll space-x-4">
                {items.map((item) => (
                    <MediaThumb key={item._id} item={item} />
                ))}
            </div>
        </div>
    );
};

export default MediaRow;