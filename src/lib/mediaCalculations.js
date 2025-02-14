export const WORDS_PER_PAGE = 300; // Average words per page

export const calculateReadingTime = (pages, pagesPerMin) => {
    if (!pages || !pagesPerMin) return 0;
    return Math.round(pages / pagesPerMin); // Convert to minutes
};

export const calculatePagesFromTime = (minutes, pagesPerMin) => {
    if (!minutes || !pagesPerMin) return 0;
    return Math.round(minutes * pagesPerMin);
};

export const calculateTVDuration = (episodes, runtime = 30) => {
    if (!episodes) return 0;
    return episodes * runtime;
}; 