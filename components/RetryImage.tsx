import React, { useState, useEffect, FC } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';

interface RetryImageProps {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    maxRetries?: number;
    retryDelay?: number;
}

const RetryImage: FC<RetryImageProps> = ({
                                             src,
                                             alt,
                                             width = 96,
                                             height = 96,
                                             className,
                                             maxRetries = 3,
                                             retryDelay = 1500
                                         }) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [retries, setRetries] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Reset state when src changes
    useEffect(() => {
        setCurrentSrc(src);
        setRetries(0);
        setLoading(true);
        setError(false);
    }, [src]);

    const handleError = () => {
        if (retries < maxRetries) {
            // Wait before retrying
            setTimeout(() => {
                console.log(`Retrying image load (${retries + 1}/${maxRetries}): ${src}`);
                // Adding a cache-busting parameter
                const cacheBuster = `?retry=${retries + 1}&t=${Date.now()}`;
                setCurrentSrc(src.includes('?') ? `${src}&cb=${Date.now()}` : `${src}${cacheBuster}`);
                setRetries(retries + 1);
            }, retryDelay);
        } else {
            console.log(`Failed to load image after ${maxRetries} retries: ${src}`);
            setError(true);
            setLoading(false);
        }
    };

    if (error || !currentSrc) {
        return (
            <div className={`rounded bg-gray-100 flex items-center justify-center ${className}`}>
                <Search className="w-8 h-8 text-gray-400" />
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                </div>
            )}
            <Image
                src={currentSrc}
                alt={alt || "Product image"}
                width={width}
                height={height}
                className={`object-contain ${error || loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
                onError={handleError}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default RetryImage;
