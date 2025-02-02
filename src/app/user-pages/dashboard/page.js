'use client'

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useOutsideClick } from "@/hooks/use-outside-click";
import styles from './styles.module.css';
import { Badge } from "@/components/ui/badge";
import UpdateProgressModal from "@/components/progress/UpdateProgressModal";
import { Button } from "@/components/ui/button";
import ProgressDisplay from "@/components/progress/ProgressDisplay";
import ProgressSection from "@/components/progress/ProgressSection";
import CompletedSection from "@/components/dashboard/CompletedSection";


const PRESET_CATEGORIES = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'];

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [expandedId, setExpandedId] = useState(null);
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allCategories, setAllCategories] = useState(PRESET_CATEGORIES);
    const ref = useRef(null);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useOutsideClick(ref, (event) => {
        // Check if the click is within a Select/dropdown component
        const isSelectClick = event.target.closest('[role="combobox"]') ||
            event.target.closest('[role="listbox"]');

        if (!isSelectClick) {
            setExpandedId(null);
        }
    });

    useEffect(() => {
        const fetchMediaItems = async () => {
            if (status === "authenticated") {
                try {
                    const response = await fetch('/api/media-items');
                    const data = await response.json();
                    if (data.items) {
                        console.log('Fetched media items:', data.items);
                        setMediaItems(data.items);
                    }
                } catch (error) {
                    console.error('Error fetching media items:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchMediaItems();
    }, [status]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/media-items/categories');
                const data = await response.json();
                if (data.categories) {
                    const uniqueCategories = Array.from(new Set([...PRESET_CATEGORIES, ...data.categories]));
                    setAllCategories(uniqueCategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        if (status === "authenticated") {
            fetchCategories();
        }
    }, [status]);

    const handleProgressUpdate = (newProgress) => {
        setMediaItems(items =>
            items.map(item =>
                item.id === selectedItem.id
                    ? {
                        ...item,
                        user_media_progress: {
                            ...item.user_media_progress,
                            completed_duration: newProgress,
                            completed: newProgress >= getMaxValue(item),
                            episodes_completed: selectedItem.media_type === 'tv'
                                ? Math.floor(newProgress / (selectedItem.tv_shows?.average_runtime || 30))
                                : item.user_media_progress?.episodes_completed,
                            pages_completed: selectedItem.media_type === 'book'
                                ? newProgress
                                : item.user_media_progress?.pages_completed
                        }
                    }
                    : item
            )
        );
    };

    const getMaxValue = (item) => {
        switch (item.media_type) {
            case 'book':
                return item.books?.page_count || 0;
            case 'movie':
                return item.user_media_progress?.duration || item.movies?.runtime || 0;
            case 'tv':
                return item.user_media_progress?.duration || 0;
            case 'game':
                return item.user_media_progress?.duration || 0;
            default:
                return 100;
        }
    };

    if (status === "loading" || loading) {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>Access Denied</div>;
    }

    return (
        <>
            <AnimatePresence>
                {expandedId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.overlay}
                        onClick={() => setExpandedId(null)}
                    />
                )}
            </AnimatePresence>

            <motion.div className={styles.dashboardContainer}>
                <div>
                    <h1 className="text-2xl font-bold mb-6">
                        Welcome, {session?.user?.name || session?.user?.email || 'User'}!
                    </h1>

                    <div className={styles.mediaGrid}>
                        {mediaItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layoutId={`card-${item.id}`}
                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                className={styles.mediaCard}
                            >
                                <Card>
                                    <div className={styles.mediaContent}>
                                        <motion.div
                                            layoutId={`image-${item.id}`}
                                            className={styles.posterWrapper}
                                        >
                                            <Image
                                                src={(() => {
                                                    switch (item.media_type) {
                                                        case 'movie':
                                                        case 'tv':
                                                            return item.poster_path
                                                                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                                                : '/images/placeholder.jpg';
                                                        case 'book':
                                                            return item.poster_path || '/images/placeholder.jpg';
                                                        case 'game':
                                                            return item.poster_path || '/images/placeholder.jpg';
                                                        default:
                                                            return '/images/placeholder.jpg';
                                                    }
                                                })()}
                                                alt={item.title}
                                                width={64}
                                                height={64}
                                                className="object-cover rounded"
                                            />
                                        </motion.div>
                                        <motion.h2
                                            layoutId={`title-${item.id}`}
                                            className={styles.mediaTitle}
                                        >
                                            {item.title}
                                        </motion.h2>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                    <CompletedSection />
                </div>


                <div>
                    {/* Right column - reserved for future analytics */}
                </div>
            </motion.div>

            <AnimatePresence>
                {expandedId && (
                    <motion.div
                        ref={ref}
                        layoutId={`card-${expandedId}`}
                        className={styles.expandedCard}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {mediaItems.map(item => item.id === expandedId && (
                            <Card key={item.id} className={styles.expandedCardInner}>
                                <div className={styles.expandedContent}>
                                    <motion.div
                                        layoutId={`image-${item.id}`}
                                        className={styles.expandedPoster}
                                    >
                                        <Image
                                            src={(() => {
                                                switch (item.media_type) {
                                                    case 'movie':
                                                    case 'tv':
                                                        return item.poster_path
                                                            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                                            : '/images/placeholder.jpg';
                                                    case 'book':
                                                        return item.poster_path || '/images/placeholder.jpg';
                                                    case 'game':
                                                        return item.poster_path || '/images/placeholder.jpg';
                                                    default:
                                                        return '/images/placeholder.jpg';
                                                }
                                            })()}
                                            alt={item.title}
                                            width={240}
                                            height={360}
                                            className="object-cover rounded"
                                        />
                                    </motion.div>
                                    <div className={styles.expandedDetails}>
                                        <motion.h2
                                            layoutId={`title-${item.id}`}
                                            className={styles.expandedTitle}
                                        >
                                            {item.title}
                                        </motion.h2>

                                        <div className={styles.progressSection}>
                                            <ProgressSection
                                                item={item}
                                                onUpdateClick={(item) => {
                                                    setSelectedItem(item);
                                                    setUpdateModalOpen(true);
                                                }}
                                                allCategories={allCategories}
                                                incompleteItems={mediaItems.filter(i => !i.user_media_progress?.completed)}
                                            />
                                        </div>

                                        <div className={styles.detailsGrid}>
                                            <div>
                                                <span className="font-semibold">Category:</span> {item.category}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Type:</span> {item.media_type}
                                            </div>
                                            {item.media_type === 'movie' && (
                                                <>
                                                    <div>
                                                        <span className="font-semibold">Duration:</span> {item.user_media_progress?.duration} min
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Director:</span> {item.movies?.director}
                                                    </div>
                                                </>
                                            )}
                                            {item.media_type === 'tv' && (
                                                <>
                                                    <div>
                                                        <span className="font-semibold">Episodes:</span> {item.tv_shows?.total_episodes}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Seasons:</span> {item.tv_shows?.seasons}
                                                    </div>
                                                </>
                                            )}
                                            {item.media_type === 'book' && (
                                                <>
                                                    <div>
                                                        <span className="font-semibold">Pages:</span> {item.books?.page_count}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Author:</span> {
                                                            item.books?.authors ?
                                                                (typeof item.books.authors === 'string'
                                                                    ? JSON.parse(item.books.authors).join(', ')
                                                                    : item.books.authors.join(', ')
                                                                )
                                                                : 'Unknown Author'
                                                        }
                                                    </div>
                                                </>
                                            )}
                                            {item.media_type === 'game' && (
                                                <>
                                                    <div>
                                                        <span className="font-semibold">Playtime:</span> {item.games?.average_playtime} hours
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Rating:</span> {item.games?.metacritic || 'N/A'}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.descriptionWrapper}>
                                    <div className={styles.description}>
                                        {item.description}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <Link href="/user-pages/search">
                Search
            </Link>
            {selectedItem && (
                <UpdateProgressModal
                    isOpen={updateModalOpen}
                    onClose={() => {
                        setUpdateModalOpen(false);
                        setSelectedItem(null);
                    }}
                    item={selectedItem}
                    onUpdate={handleProgressUpdate}
                />
            )}
        </>
    );
}