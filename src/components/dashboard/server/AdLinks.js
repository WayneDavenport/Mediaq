'use server';

// Define the ad data array
const adData = [
    {
        id: 'ad-ac-shadows',
        href: 'https://greenmangaming.sjv.io/jeZPNa', // Your specific link
        image: 'https://media.rawg.io/media/games/526/526881e0f5f8c1550e51df3801f96ea3.jpg', // Placeholder image
        title: "Assassin's Creed Shadows",
        alt: "Buy Assassin's Creed Shadows on Green Man Gaming"
    },
    // Add more game ad data objects here in the future
    // Example:
    // {
    //     id: 'ad-example-game',
    //     href: 'YOUR_AFFILIATE_LINK_HERE',
    //     image: 'PATH_TO_PLACEHOLDER_IMAGE',
    //     title: "Example Game",
    //     alt: "Buy Example Game on Green Man Gaming"
    // }
];

/**
 * Fetches the predefined ad links.
 * @returns {Promise<Array<object>>} A promise that resolves to the array of ad data objects.
 */
export async function getAdLinks() {
    // In a real scenario, this could fetch from a DB or CMS
    // For now, just return the predefined array
    return adData;
}
