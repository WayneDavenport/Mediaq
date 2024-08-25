import React, { useState } from 'react';
import Slider from 'react-slick';
import MediaThumb from '@/components/media-gallery/MediaThumb';
import ExpandedMediaView from '@/components/media-gallery/ExpandedMediaView';
import styles from './MediaGallery.module.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const MediaRow = ({ title, items }) => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleThumbClick = (item) => {
        setSelectedItem(item);
    };

    const handleClose = () => {
        setSelectedItem(null);
    };

    // Calculate the number of slides to show
    const slidesToShow = Math.min(items.length, 7);

    const settings = {
        dots: true,
        infinite: items.length > slidesToShow,
        speed: 500,
        slidesToShow: slidesToShow,
        slidesToScroll: slidesToShow,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: Math.min(items.length, 3),
                    slidesToScroll: Math.min(items.length, 3),
                    infinite: items.length > 3,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: Math.min(items.length, 2),
                    slidesToScroll: Math.min(items.length, 2),
                    initialSlide: 2,
                    infinite: items.length > 2,
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: Math.min(items.length, 1),
                    slidesToScroll: Math.min(items.length, 1),
                    infinite: items.length > 1,
                }
            }
        ]
    };

    return (
        <div className={styles.mediaRow}>
            <h2 className={styles.mediaRowTitle}>{title}</h2>
            {selectedItem ? (
                <ExpandedMediaView item={selectedItem} onClose={handleClose} />
            ) : (
                <Slider {...settings} className={styles.mediaItems}>
                    {items.map((item) => (
                        <div key={item._id}>
                            <MediaThumb item={item} onClick={handleThumbClick} />
                        </div>
                    ))}
                </Slider>
            )}
        </div>
    );
};

export default MediaRow;