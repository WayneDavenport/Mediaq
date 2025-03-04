'use server'

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function fetchGmgLinksForGames(gameItems) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            console.log('Unauthorized: No valid session');
            throw new Error('Unauthorized');
        }

        // Flatten and extract titles, handling potential nested arrays
        const gameTitles = gameItems.flat().map(game => game.title);
        console.log('Fetching GMG links for:', gameTitles);

        // Fetch GMG links from your Supabase table with correct table name
        const { data: gmgLinks, error } = await supabase
            .from('gmg_games')
            .select('title, affiliate_link')
            .in('title', gameTitles);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('GMG links from Supabase:', gmgLinks);

        // Convert array to object with title as key
        const linksObject = gmgLinks.reduce((acc, item) => {
            acc[item.title] = item.affiliate_link;
            return acc;
        }, {});

        return linksObject;
    } catch (error) {
        console.error('Error in GmgLinkFetcher:', error);
        return {};
    }
} 