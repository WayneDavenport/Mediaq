export const WORDS_PER_PAGE = 300; // Average words per page

export const calculateReadingTime = (pages, pagesPerMin) => {
    if (!pages || !pagesPerMin) return 0;
    return Math.round(pages / pagesPerMin); // Convert to minutes
};

export const calculatePagesFromTime = (minutes, pagesPerHalfHour) => {
    if (!minutes || !pagesPerHalfHour) return 0;
    return Math.round((minutes / 30) * pagesPerHalfHour);
};

export const calculateTVDuration = (episodes, runtime = 30) => {
    if (!episodes) return 0;
    return episodes * runtime;
}; 