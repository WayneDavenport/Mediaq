'use server'

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { findAffiliateLink } from '@/lib/supabase-gmg';

export async function fetchGmgLinksForGames(gameItems) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log('Unauthorized: No valid session in fetchGmgLinksForGames');
            throw new Error('Unauthorized');
        }

        // Get unique game titles
        const gameTitles = [...new Set(gameItems.flat().map(game => game.title))];
        if (gameTitles.length === 0) {
            console.log('No game titles provided.');
            return {};
        }
        console.log('Fetching GMG links for unique titles:', gameTitles);

        // Create an array of promises, calling findAffiliateLink for each title
        const linkPromises = gameTitles.map(async (title) => {
            try {
                const linkData = await findAffiliateLink(title);
                // Return an object with title and linkData (which might be null)
                return { title: title, linkData: linkData };
            } catch (error) {
                console.error(`Error fetching affiliate link for "${title}":`, error.message);
                return { title: title, linkData: null }; // Return null on error for this specific title
            }
        });

        // Wait for all promises to resolve
        const results = await Promise.all(linkPromises);

        // Build the final object, using lowercase titles as keys
        const linksObject = results.reduce((acc, result) => {
            if (result.linkData) { // Only add if linkData was found
                // Ensure result.title exists before lowercasing
                if (result.title) {
                    acc[result.title.toLowerCase()] = result.linkData; // linkData should already be { url: ..., price: ... }
                } else {
                    console.warn("findAffiliateLink result missing title:", result);
                }
            }
            return acc;
        }, {});

        console.log('Created linksObject using findAffiliateLink, keys:', Object.keys(linksObject));

        return linksObject;

    } catch (error) {
        // Catch errors from getServerSession or Promise.all setup
        console.error('General Error in fetchGmgLinksForGames:', error.message);
        return {};
    }
} 