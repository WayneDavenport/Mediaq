import fs from 'fs';
import path from 'path';

const sourcePath = 'C:\\Users\\wayne\\OneDrive\\Desktop\\Mediaq-Location\\mediaq\\USD-Affiliate-Product-Catalog_CUSTOM.xml';
const destPath = path.join(process.cwd(), 'public', 'assets', 'USD-Affiliate-Product-Catalog_CUSTOM.xml');

// Create directory if it doesn't exist
const assetsDir = path.join(process.cwd(), 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log('Created assets directory');
}

// Copy the file
fs.copyFileSync(sourcePath, destPath);
console.log(`Copied GMG catalog to ${destPath}`); 