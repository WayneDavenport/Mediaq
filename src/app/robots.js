import { MetadataRoute } from 'next'

export default function robots() {
    // Define the base URL from environment variables for different environments
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return {
        rules: [
            {
                userAgent: '*', // Apply to all user agents initially
                allow: '/',       // Allow crawling of most of the site
                // Disallow specific bots known to ignore rules from accessing the honeypot
                // Example: Add user agents like 'BadBot/1.0', 'AnotherBadCrawler' below
                // UserAgent: 'BadBot/1.0',
                // Disallow: '/api/honeypot-trap',
            },
            {
                // Rule specifically for the honeypot - Disallow all access to it
                // While the above rule might suffice, this adds explicitness.
                // Some interpretations might prioritize the most specific rule.
                userAgent: '*',
                disallow: '/api/honeypot-trap',
            }
            // Add more specific rules for known bad bots if needed later
            // {
            //   userAgent: 'KnownBadBot',
            //   disallow: '/api/honeypot-trap',
            // },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
} 