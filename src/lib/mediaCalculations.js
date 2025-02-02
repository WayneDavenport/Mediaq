export const WORDS_PER_PAGE = 300; // Average words per page

export const calculateReadingTime = (pages, pagesPerHalfHour) => {
    if (!pages || !pagesPerHalfHour) return 0;
    return Math.round((pages / pagesPerHalfHour) * 30); // Convert to minutes
};

export const calculatePagesFromTime = (minutes, pagesPerHalfHour) => {
    if (!minutes || !pagesPerHalfHour) return 0;
    return Math.round((minutes / 30) * pagesPerHalfHour);
};

export const calculateTVDuration = (episodes, runtime = 30) => {
    if (!episodes) return 0;
    return episodes * runtime;
}; 