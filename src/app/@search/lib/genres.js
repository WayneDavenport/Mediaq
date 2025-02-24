export const COMMON_GENRES = [
    { label: 'Action', value: 'action' },
    { label: 'Adventure', value: 'adventure' },
    { label: 'Comedy', value: 'comedy' },
    { label: 'Drama', value: 'drama' },
    { label: 'Fantasy', value: 'fantasy' },
    { label: 'Horror', value: 'horror' },
    { label: 'Mystery', value: 'mystery' },
    { label: 'Romance', value: 'romance' },
    { label: 'Sci-Fi', value: 'scifi' },
    { label: 'Thriller', value: 'thriller' },
    { label: 'Cyberpunk', value: 'cyberpunk' },
    { label: 'Historical', value: 'historical' },
    { label: 'Documentary', value: 'documentary' },
];

export const MEDIA_SPECIFIC_GENRES = {
    movie: [
        { label: 'Animation', value: 'animation' },
        { label: 'Biography', value: 'biography' },
        { label: 'Film-Noir', value: 'film_noir' },
        { label: 'Musical', value: 'musical' },
        { label: 'Western', value: 'western' },
    ],
    tv: [
        { label: 'Sitcom', value: 'sitcom' },
        { label: 'Reality', value: 'reality' },
        { label: 'Talk Show', value: 'talk_show' },
        { label: 'Anime', value: 'anime' },
        { label: 'Mini-Series', value: 'mini_series' },
    ],
    book: [
        { label: 'Fiction', value: 'fiction' },
        { label: 'Non-Fiction', value: 'non_fiction' },
        { label: 'Biography', value: 'biography' },
        { label: 'Self-Help', value: 'self_help' },
        { label: 'Poetry', value: 'poetry' },
        { label: 'Technical', value: 'technical' },
    ],
    game: [
        { label: 'RPG', value: 'rpg' },
        { label: 'FPS', value: 'fps' },
        { label: 'Strategy', value: 'strategy' },
        { label: 'Simulation', value: 'simulation' },
        { label: 'Sports', value: 'sports' },
        { label: 'Platformer', value: 'platformer' },
        { label: 'Puzzle', value: 'puzzle' },
        { label: 'Fighting', value: 'fighting' },
        { label: 'Shoot em Up', value: 'shmup' },
        { label: 'Roguelike', value: 'roguelike' },
        { label: 'Indie', value: 'indie' },
    ],
};

export const GAME_GENRE_DURATIONS = {
    'rpg': 3600,      // 60 hours
    'action': 1200,   // 20 hours
    'indie': 600,     // 10 hours
    'strategy': 1800, // 30 hours
    'DEFAULT': 2400   // 40 hours
}; 