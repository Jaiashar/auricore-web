// next-sitemap.config.js
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://www.auricore.com',
    generateRobotsTxt: true,
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/*', '/_next/*', '/admin/*']
            }
        ]
    },
    exclude: ['/admin/*', '/api/*'], // Exclude routes that shouldn't be in sitemap
    sitemapSize: 5000, // Split sitemap if number of URLs > 5000
    changefreq: 'weekly',
    priority: 0.7,
    transform: async (config, path) => {
        // Custom priority for important pages
        let priority = config.priority;

        if (path === '/') priority = 1.0;
        if (path === '/how-it-works') priority = 0.9;

        return {
            loc: path,
            changefreq: config.changefreq,
            priority,
            lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
            alternateRefs: config.alternateRefs ?? []
        };
    }
};
