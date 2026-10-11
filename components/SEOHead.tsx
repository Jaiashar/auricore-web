// components/SEOHead.tsx
import Head from 'next/head'

interface SEOHeadProps {
    title: string
    description: string
    canonicalUrl?: string
    ogImage?: string
    ogType?: string
    twitterCard?: string
}

export default function SEOHead({
                                    title,
                                    description,
                                    canonicalUrl,
                                    ogImage = '/og-image.jpg', // Default OG image - create this 1200x630px image in your public folder
                                    ogType = 'website',
                                    twitterCard = 'summary_large_image'
                                }: SEOHeadProps) {
    // Construct the full URL for canonical and OG tags
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.auricore.com'
    const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl
    const fullOgImageUrl = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

    return (
        <Head>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description}/>
            <link rel="canonical" href={fullCanonicalUrl}/>

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType}/>
            <meta property="og:url" content={fullCanonicalUrl}/>
            <meta property="og:title" content={title}/>
            <meta property="og:description" content={description}/>
            <meta property="og:image" content={fullOgImageUrl}/>

            <meta name="robots" content="index, follow"/>
            <meta name="author" content="Auricore"/>
            <meta name="keywords"
                  content="asset-backed lending, luxury items, financial services, leasing, peer lending"/>
            <meta name="theme-color" content="#1E40AF"/>

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard}/>
            <meta name="twitter:title" content={title}/>
            <meta name="twitter:description" content={description}/>
            <meta name="twitter:image" content={fullOgImageUrl}/>

            {/* Viewport and other important tags */}
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <meta charSet="utf-8"/>

            {/* Favicon - add these files to your public directory */}
            <link rel="icon" href="/favicon.ico"/>
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
            <link rel="manifest" href="/site.webmanifest"/>
        </Head>
    )
}
