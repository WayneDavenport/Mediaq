import supabase from '@/lib/supabaseClient';
import { loadGmgCatalog } from '@/components/server/GmgCatalog';

// Function to populate Supabase with GMG catalog data
export async function syncGmgCatalogToSupabase() {
    try {
        console.log('Loading GMG catalog...');
        const catalog = await loadGmgCatalog();

        // Transform XML data to a cleaner structure
        const games = catalog.map(product => ({
            id: product.product_id,
            title: product.product_name,
            description: product.description,
            price: parseFloat(product.price),
            currency: product.currency,
            image_url: product.image_url,
            affiliate_link: product.deep_link,
            brand: product.brand,
            drm: product.drm,
            steam_app_id: product.steamapp_id,
            manufacturer: product.manufacturer,
            source: 'gmg',
            last_updated: new Date().toISOString()
        }));

        console.log(`Processing ${games.length} games...`);

        // For larger catalogs, process in batches
        const batchSize = 100;
        for (let i = 0; i < games.length; i += batchSize) {
            const batch = games.slice(i, i + batchSize);
            const { error } = await supabase
                .from('gmg_games')
                .upsert(batch, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });

            if (error) throw error;
            console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(games.length / batchSize)}`);
        }

        console.log(`Successfully synced ${games.length} games to Supabase`);
        return games.length;
    } catch (error) {
        console.error('Error syncing GMG catalog to Supabase:', error);
        throw error;
    }
}

// Function to find affiliate link for a game in user's queue
export async function findAffiliateLink(gameTitle) {
    try {
        // First try exact match
        let { data, error } = await supabase
            .from('gmg_games')
            .select('title, affiliate_link, image_url, price, currency')
            .eq('title', gameTitle)
            .limit(1);

        // If no exact match, try partial match
        if ((!data || data.length === 0) && gameTitle) {
            const { data: similarData, error: similarError } = await supabase
                .from('gmg_games')
                .select('title, affiliate_link, image_url, price, currency')
                .ilike('title', `%${gameTitle}%`)
                .limit(1);

            if (similarError) throw similarError;
            data = similarData;
        }

        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('Error finding affiliate link:', error);
        return null;
    }
} 