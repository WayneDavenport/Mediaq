import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';

// Cached loader to prevent redundant parsing
export const loadGmgCatalog = cache(async () => {
    try {
        // Using the correct file path
        const xmlPath = path.join(process.cwd(), 'public', 'assets', 'USD-Affiliate-Product-Catalog_CUSTOM.xml');
        const xmlData = await fs.readFile(xmlPath, 'utf8');

        const parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true,
            isArray: (name) => name === 'product'
        });

        const result = parser.parse(xmlData);
        return result.products.product;
    } catch (error) {
        console.error('Error loading GMG catalog:', error);
        return [];
    }
});

// Server component for rendering game details
export default async function GmgGameDetails({ gameName }) {
    const catalog = await loadGmgCatalog();
    const game = catalog.find(g =>
        g.product_name.toLowerCase() === gameName.toLowerCase()
    );

    if (!game) return null;

    return (
        <div className="game-details">
            <h1>{game.product_name}</h1>
            <div className="flex gap-4">
                <img
                    src={game.image_url}
                    alt={game.product_name}
                    width={320}
                    height={180}
                    className="rounded-md"
                />
                <div>
                    <div dangerouslySetInnerHTML={{ __html: game.description }} />
                    <div className="mt-4">
                        <span className="font-bold">{game.price} {game.currency}</span>
                        <a
                            href={game.deep_link}
                            className="ml-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Buy on Green Man Gaming
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
} 