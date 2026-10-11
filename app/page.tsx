"use client";
import React, { useState, useEffect } from 'react';

// Main landing page component
const LuxuryResellerLanding = () => {
    const [visibleSections, setVisibleSections] = useState(new Set());

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisibleSections(prev => new Set([...prev, entry.target.id]));
                    }
                });
            },
            { threshold: 0.1 }
        );

        const sections = document.querySelectorAll('[data-section]');
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen font-light">


            {/* Hero Section */}
            <HeroPage />

            {/* Features Section */}
            <section className="py-24 bg-neutral-50" data-section id="features">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-medium text-neutral-900 mb-4">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                            Our platform combines cutting-edge technology with deep market insights to give you the competitive edge in luxury reselling.
                        </p>
                    </div>

                    {/* Feature 1 */}
                    <div className="mb-24 text-center">
                        <h3 className="text-3xl font-medium text-neutral-900 mb-6">Intelligent Product Discovery</h3>
                        <p className="text-lg text-neutral-600 mb-12 max-w-3xl mx-auto">
                            Get accurate pricing powered by machine learning algorithms analyzing millions of luxury transactions across all major marketplaces
                        </p>
                        <div className="relative group">
                            <img
                                src="coming-soon/preview-homepage.png"
                                alt="Smart Product Discovery"
                                className={`w-full mx-auto rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500 ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0093FF]/10 to-[#0573CC]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="mb-24 text-center">
                        <h3 className="text-3xl font-medium text-neutral-900 mb-6">Comprehensive Analytics</h3>
                        <p className="text-lg text-neutral-600 mb-12 max-w-3xl mx-auto">
                            Track volatility, liquidity scores, and risk assessments to make informed investment decisions for your luxury portfolio
                        </p>
                        <div className="relative group">
                            <img
                                src="coming-soon/preview-product.png"
                                alt="Comprehensive Analytics"
                                className={`w-full mx-auto rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500 ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0093FF]/10 to-[#0573CC]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="mb-12 text-center">
                        <h3 className="text-3xl font-medium text-neutral-900 mb-6">Transaction History</h3>
                        <p className="text-lg text-neutral-600 mb-12 max-w-3xl mx-auto">
                            Record your transactions and get personalized insights combining your data with our market intelligence for optimal profit margins
                        </p>
                        <div className="relative group">
                            <img
                                src="coming-soon/preview-transaction.png"
                                alt="Transaction History"
                                className={`w-full mx-auto rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500 ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0093FF]/10 to-[#0573CC]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                    </div>

                    {/* Mid-page CTA */}
                    <div className="text-center mt-16">
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
                            <h3 className="text-2xl font-medium text-neutral-900 mb-4">Ready to Transform Your Business?</h3>
                            <p className="text-neutral-600 mb-6">Join hundreds of luxury resellers who are already on the waitlist.</p>
                            <EmailInput variation="inline" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20" style={{ background: 'linear-gradient(135deg, #0093FF 0%, #0573CC 100%)' }} data-section id="analytics">
                <div className="max-w-6xl mx-auto px-4">
                    <div className={`text-center transition-all duration-700 ${visibleSections.has('analytics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="inline-block bg-white bg-opacity-20 rounded-3xl p-12 mb-8">
                            <div className="text-6xl md:text-7xl font-medium text-white mb-4">10+</div>
                            <div className="text-xl text-white font-medium">Categories</div>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-light text-white mb-12">Track and analyze luxury goods across all major categories</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {['Handbags', 'Watches', 'Jewelry', 'Shoes', 'Clothing', 'Accessories'].map((category, index) => (
                                <div key={category} className={`bg-white bg-opacity-10 rounded-2xl p-6 text-center transition-all duration-500 hover:bg-opacity-20 ${visibleSections.has('analytics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 0.1}s` }}>
                                    <div className="font-light text-white">{category}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-white" data-section id="final-cta">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className={`transition-all duration-700 ${visibleSections.has('final-cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <h2 className="text-3xl font-medium mb-6 text-neutral-900">
                            Ready to Transform Your Luxury Reselling Business?
                        </h2>
                        <p className="text-lg mb-12 text-neutral-600 max-w-2xl mx-auto">
                            Join hundreds of luxury resellers who are already waiting for our platform launch. Be the first to get access to advanced pricing insights and analytics.
                        </p>
                        <EmailInput />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-neutral-200">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <div className="mb-6">
                        <div className="text-xl font-medium text-neutral-900 mb-2">Auricore</div>
                        <p className="text-neutral-600 text-sm">Smart pricing for luxury resellers</p>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-neutral-500">
                        <span>© 2025 Auricore</span>
                        <a href="#" className="hover:text-neutral-900 transition-colors">Privacy Policy</a>
                        <a href="mailto:contact@auricore.com" className="hover:text-neutral-900 transition-colors">contact@auricore.com</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LuxuryResellerLanding;

// Loading spinner component
function LoadingSpinner() {
    return (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.273 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
}

// Email input component with multiple variations
function EmailInput({ variation = "default" }: { variation?: "default" | "primary" | "inline" }) {
    const [email, setEmail] = useState<string>('');
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        // Call your actual API
        fetch('/api/add-waitlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('This email is already registered. We appreciate the enthusiasm, though!');
                }
                throw new Error('An unexpected error occurred. Please try again later.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Email added to waitlist:', data);
            setIsSubmitted(true);
            setError(null);
            
            // Reset after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
                setEmail('');
            }, 3000);
        })
        .catch(error => {
            console.error('Error adding email to waitlist:', error);
            setError(error.message || 'An unexpected error occurred. Please try again later.');
        })
        .finally(() => {
            setLoading(false);
        });
    };

    if (variation === "inline") {
        return (
            <div>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0093FF] focus:border-transparent text-neutral-700 placeholder-neutral-400"
                        disabled={loading || isSubmitted}
                    />
                    <div className="relative">
                        <button
                            type="submit"
                            disabled={loading || isSubmitted}
                            className="px-6 py-3 bg-gradient-to-r from-[#0093FF] to-[#0573CC] text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                            <span className={loading ? "invisible" : ""}>
                                {isSubmitted ? 'Thank you!' : 'Get Notified'}
                            </span>
                        </button>
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        )}
                    </div>
                </form>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
        );
    }

    if (variation === "primary") {
        return (
            <div>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0093FF] focus:border-transparent text-neutral-700 placeholder-neutral-400"
                        disabled={loading || isSubmitted}
                    />
                    <div className="relative">
                        <button
                            type="submit"
                            disabled={loading || isSubmitted}
                            className="px-6 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200 font-medium disabled:opacity-50"
                        >
                            <span className={loading ? "invisible" : ""}>
                                {isSubmitted ? 'Thank you!' : 'Get Notified'}
                            </span>
                        </button>
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        )}
                    </div>
                </form>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
        );
    }

    // Default variation
    return (
        <div>
            <form className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto" onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="border border-neutral-300 w-full px-6 py-4 rounded-lg focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#0093FF] text-neutral-900 placeholder-neutral-400"
                    disabled={loading || isSubmitted}
                />
                <div className="relative">
                    <button
                        type="submit"
                        disabled={loading || isSubmitted}
                        className="whitespace-nowrap w-full sm:w-auto px-8 py-4 text-white rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-[#0093FF] to-[#0573CC] hover:shadow-lg hover:scale-105 disabled:opacity-50"
                    >
                        <span className={loading ? "invisible" : ""}>
                            {isSubmitted ? 'Thank you!' : 'Get Early Access'}
                        </span>
                    </button>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    )}
                </div>
            </form>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            {isSubmitted && (
                <p className="mt-4 text-green-600 text-center">
                    Thank you! You'll be notified when we launch.
                </p>
            )}
        </div>
    );
}

// Hero section component
function HeroPage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background Blobs */}
            <img
                src="coming-soon/blob-3.svg"
                alt=""
                className="absolute top-0 left-0 opacity-50 max-w-none object-none animate-[wobble_5s_ease-in-out_infinite]"
            />
            <img
                src="coming-soon/blob-2.svg"
                alt=""
                className="absolute top-0 left-0 opacity-50 max-w-none object-none animate-[wobble_5s_ease-in-out_infinite]"
                style={{ animationDelay: '2s' }}
            />
            <img
                src="coming-soon/blob-1.svg"
                alt=""
                className="absolute top-0 left-0 opacity-50 max-w-none object-none animate-[wobble_5s_ease-in-out_infinite]"
                style={{ animationDelay: '4s' }}
            />

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-16">
                <div className="text-center max-w-4xl">
                    {/* Coming Soon Text */}
                    <h1
                        className="md:text-8xl text-5xl font-dm-serif-display tracking-[.15em] text-neutral-800 mb-36 sm:mb-56 leading-tight mt-10 md:mt-0"
                        style={{ transform: "scaleY(1.1)" }}
                    >
                        Coming Soon
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-3xl text-neutral-600 mb-12 font-light tracking-[.2em]">
                        ALL-IN-ONE PLATFORM FOR<br />LUXURY RESELLERS
                    </p>
                    <p className="text-normal md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-12">
                        Smart pricing, comprehensive analytics, and personalized insights for luxury goods.
                        Manage your entire reselling business from one powerful platform.
                    </p>

                    {/* Email Signup Form */}
                    <EmailInput variation="primary" />
                </div>
            </div>
        </div>
    );
}