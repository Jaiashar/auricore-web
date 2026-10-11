"use client";

import React from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-medium mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/categories" className="block">
                    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="text-lg font-medium mb-2">Category Management</h2>
                        <p className="text-gray-600 text-sm">
                            Manage product categories and their fields for the intake form.
                        </p>
                    </div>
                </Link>

                {/* Add more admin cards as needed */}
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm opacity-50">
                    <h2 className="text-lg font-medium mb-2">User Management</h2>
                    <p className="text-gray-600 text-sm">
                        Manage user accounts and permissions (coming soon).
                    </p>
                </div>

                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm opacity-50">
                    <h2 className="text-lg font-medium mb-2">Analytics</h2>
                    <p className="text-gray-600 text-sm">
                        View item submission statistics (coming soon).
                    </p>
                </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-medium mb-2">Getting Started</h2>
                <p className="mb-2">
                    To set up your dynamic intake form:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Go to <Link href="/admin/categories" className="text-blue-600 underline">Category Management</Link></li>
                    <li>Click "Initialize Categories" to create the category structure in Firebase</li>
                    <li>Your intake form will automatically use these categories</li>
                </ol>
            </div>
        </div>
    );
}
