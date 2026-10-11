import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: [
            "serpapi.com",
            "encrypted-tbn0.gstatic.com",
            "firebasestorage.googleapis.com",
            'encrypted-tbn0.gstatic.com',
            'encrypted-tbn1.gstatic.com',
            'encrypted-tbn2.gstatic.com',
            'encrypted-tbn3.gstatic.com',
        ],
    },
    // other config options here
};

export default nextConfig;
