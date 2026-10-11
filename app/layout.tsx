// app/layout.tsx (Server Component)
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Organization structured data for all pages
const structuredDataJSON = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Auricore",
    "url": "https://www.auricore.ai",
    "logo": "https://www.auricore.ai/logo2.png",
    "description": "Real-time pricing, analytics, and transaction intelligence for luxury goods marketplaces and resellers"
});

export const metadata: Metadata = {
    title: 'Auricore – Real-Time Luxury Pricing & Market Intelligence',
    description: 'Auricore provides AI-powered pricing and analytics for watches, handbags, sneakers, and more — trusted by luxury resellers and marketplaces.',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <head>
            {/* Using Next.js Script component for structured data */}
            <Script
                id="org-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: structuredDataJSON }}
            />
        </head>
        <body className={inter.className}>{children}</body>
        </html>
    )
}
