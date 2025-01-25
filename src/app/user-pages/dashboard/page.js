'use client'

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import styles from './styles.module.css';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [expandedId, setExpandedId] = useState(null);
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (status === "loading" || loading) {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>Access Denied</div>;
    }

    return (
        <motion.div
            className={styles.dashboardContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-2xl font-bold mb-6">Welcome, {session?.user?.name || session?.user?.email || 'User'}!</h1>

            <motion.div className={styles.mediaGrid}>
                {mediaItems.map((item) => (
                    <motion.div
                        key={item.id}
                        className={styles.mediaCard}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                        <Card>
                            <motion.div
                                layout
                                className={`${styles.mediaImage} ${expandedId === item.id ? styles.expanded : ''}`}
                            >
                                <motion.div
                                    layoutId={`poster-${item.id}`}
                                    className={`${styles.posterWrapper} ${expandedId === item.id ? styles.expanded : ''}`}
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
                                        width={expandedId === item.id ? 192 : 64}
                                        height={expandedId === item.id ? 256 : 64}
                                        className="object-cover rounded"
                                    />
                                </motion.div>

                                <motion.h2
                                    layoutId={`title-${item.id}`}
                                    className={`${styles.mediaTitle} ${expandedId === item.id ? styles.expanded : styles.thumbnail}`}
                                >
                                    {item.title}
                                </motion.h2>

                                <AnimatePresence mode="sync">
                                    {expandedId === item.id && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: 1,
                                                transition: { duration: 0.2, delay: 0.1 }
                                            }}
                                            exit={{
                                                opacity: 0,
                                                transition: { duration: 0.15 }
                                            }}
                                            className={styles.detailsWrapper}
                                        >
                                            <motion.div
                                                className={styles.detailsGrid}
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: { duration: 0.2, delay: 0.15 }
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: -8,
                                                    transition: { duration: 0.1 }
                                                }}
                                            >
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
                                                            <span className="font-semibold">Author:</span> {item.books?.authors?.[0]}
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
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence mode="sync">
                                    {expandedId === item.id && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{
                                                height: "auto",
                                                transition: { duration: 0.3 }
                                            }}
                                            exit={{
                                                height: 0,
                                                transition: { duration: 0.2 }
                                            }}
                                            className={styles.descriptionWrapper}
                                        >
                                            <motion.div
                                                className={styles.description}
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: { duration: 0.2, delay: 0.2 }
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: -8,
                                                    transition: { duration: 0.1 }
                                                }}
                                            >
                                                {item.description}
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Link href="/user-pages/search" className="text-blue-500 hover:underline">
                    Search for more media
                </Link>
            </motion.div>
        </motion.div>
    );
}