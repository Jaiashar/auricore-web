"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? "bg-gray-700" : "";
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar navigation */}
            <div className="w-64 bg-gray-800 text-white p-4">
                <div className="text-xl font-bold mb-8">Admin Panel</div>
                <nav>
                    <ul className="space-y-2">
                        <li>
                            <Link href="/admin" className={`block p-2 rounded hover:bg-gray-700 ${isActive('/admin')}`}>
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/categories" className={`block p-2 rounded hover:bg-gray-700 ${isActive('/admin/categories')}`}>
                                Category Management
                            </Link>
                        </li>
                        {/* Add more admin links as needed */}
                    </ul>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-grow bg-gray-50">
                {children}
            </div>
        </div>
    );
}
