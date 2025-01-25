/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                pathname: '/t/p/**',
            },
            {
                protocol: 'https',
                hostname: 'media.rawg.io',
                pathname: '/media/**',
            },
            {
                protocol: 'http',
                hostname: 'books.google.com',
                pathname: '/books/**',
            },
            {
                protocol: 'https',
                hostname: 'books.google.com',
                pathname: '/books/**',
            }
        ],
    },
};

export default nextConfig;
