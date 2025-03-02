/* import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET() {
    try {
        // Get your dynamic routes from the database
        // This is just an example - adapt based on your schema
        const { data: media, error } = await supabase
            .from('movies') // or whatever table stores your media
            .select('id, slug, updated_at')
            .limit(1000); // Adjust based on your site size

        if (error) throw error;

        // Create sitemap XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add static pages
        xml += `  <url>
    <loc>https://www.mediaq.io</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

        // Add dynamic pages
        if (media) {
            media.forEach(item => {
                xml += `  <url>
    <loc>https://www.mediaq.io/media/${item.slug || item.id}</loc>
    <lastmod>${new Date(item.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
            });
        }

        xml += '</urlset>';

        // Return the XML with the correct content type
        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate sitemap' },
            { status: 500 }
        );
    }
}  */