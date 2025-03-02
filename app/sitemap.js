export default async function sitemap() {
    // Base URL for your site
    const baseUrl = 'https://www.mediaq.io';

    // Define your main pages
    const pages = [
        '',
        '/user-pages/dashboard',
        '/user-pages/search',
        '/user-pages/gallery',
        '/user-pages/social',
        // Add other important pages
    ].map(path => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date().toISOString(),
        // Set appropriate priority
        priority: path === '' ? 1 : 0.8,
        changeFrequency: 'weekly'
    }));

    // You can also add dynamic pages if needed
    // const dynamicPages = await fetchDynamicPages();

    return [...pages];
} 