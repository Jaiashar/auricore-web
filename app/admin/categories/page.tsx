"use client";

import React, { useState } from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const categorySchema = {
    watches: {
        id: "watches",
        label: "Watches",
        description: "Luxury timepieces from recognized brands. Please include reference numbers when available.",
        excludeInfo: "Unbranded or fashion watches (e.g., MVMT, Daniel Wellington)",
        parameterWeights: [
            { fieldId: "brand", weight: 1 },
            { fieldId: "modelName", weight: 1 },
            { fieldId: "condition", weight: 1 },
            { fieldId: "boxPapers", weight: 0.7 },
            { fieldId: "yearManufacture", weight: 0.6 },
            { fieldId: "caseMaterial", weight: 0.8 },
            { fieldId: "movementType", weight: 0.7 },
            { fieldId: "intendedWearer", weight: 0.6 }
        ],
        fields: [
            { id: "brand", label: "Brand", type: "text", required: true },
            { id: "modelName", label: "Model / Reference Number", type: "text", required: true },
            { id: "condition", label: "Condition", type: "select", required: true, options: [
                    { value: "new", label: "New (Unworn)" },
                    { value: "like-new", label: "Like New (Worn few times)" },
                    { value: "used", label: "Used (Visible wear)" },
                    { value: "damaged", label: "Damaged (Needs repair)" }
                ]},
            { id: "boxPapers", label: "Box & Papers", type: "select", required: true, options: [
                    { value: "complete", label: "Complete Set (Box & Papers)" },
                    { value: "papers-only", label: "Papers Only" },
                    { value: "box-only", label: "Box Only" },
                    { value: "none", label: "No Box or Papers" }
                ]},
            { id: "yearManufacture", label: "Year of Manufacture", type: "text", required: false },
            { id: "caseMaterial", label: "Case Material", type: "text", required: true },
            { id: "movementType", label: "Movement Type", type: "select", required: true, options: [
                    { value: "automatic", label: "Automatic" },
                    { value: "manual", label: "Manual Wind" },
                    { value: "quartz", label: "Quartz" },
                    { value: "other", label: "Other" }
                ]},
            { id: "intendedWearer", label: "Intended Wearer", type: "select", required: true, options: [
                    { value: "men", label: "Men" },
                    { value: "women", label: "Women" },
                    { value: "unisex", label: "Unisex" }
                ]}
        ]
    },
    handbags: {
        id: "handbags",
        label: "Handbags",
        description: "Designer and luxury handbags. Please specify size, material, and any distinctive features.",
        excludeInfo: "No-name or fast-fashion brands (e.g., Zara, Aldo)",
        parameterWeights: [
            { fieldId: "brand", weight: 1 },
            { fieldId: "modelName", weight: 1 },
            { fieldId: "material", weight: 0.8 },
            { fieldId: "condition", weight: 1 },
            { fieldId: "size", weight: 0.6 },
            { fieldId: "color", weight: 0.5 },
            { fieldId: "intendedWearer", weight: 0.6 }
        ],
        fields: [
            { id: "brand", label: "Brand", type: "text", required: true },
            { id: "modelName", label: "Model", type: "text", required: true },
            { id: "material", label: "Material", type: "text", required: false },
            { id: "size", label: "Size", type: "select", required: true, options: [
                    { value: "mini", label: "Mini" },
                    { value: "small", label: "Small" },
                    { value: "medium", label: "Medium" },
                    { value: "large", label: "Large" },
                    { value: "maxi", label: "Maxi/Oversized" }
                ]},
            { id: "color", label: "Color", type: "text", required: true },
            { id: "condition", label: "Condition", type: "select", required: true, options: [
                    { value: "new", label: "New" },
                    { value: "like-new", label: "Like New" },
                    { value: "used", label: "Used" },
                    { value: "damaged", label: "Damaged" }
                ]},
            { id: "intendedWearer", label: "Intended Wearer", type: "select", required: true, options: [
                    { value: "women", label: "Women" },
                    { value: "men", label: "Men" },
                    { value: "unisex", label: "Unisex" }
                ]}
        ]
    },
    jewelry: {
        id: "jewelry",
        label: "Branded Jewelry",
        description: "Designer jewelry from recognized luxury brands. Please provide as much detail as possible.",
        excludeInfo: "Any jewelry without recognizable brand provenance",
        parameterWeights: [
            { fieldId: "brand", weight: 1 },
            { fieldId: "material", weight: 1 },
            { fieldId: "gemstoneType", weight: 0.8 },
            { fieldId: "modelName", weight: 1 },
            { fieldId: "condition", weight: 1 },
            { fieldId: "boxPapers", weight: 0.5 },
            { fieldId: "intendedWearer", weight: 0.8 }
        ],
        fields: [
            { id: "brand", label: "Brand", type: "text", required: true },
            { id: "material", label: "Material", type: "select", required: true, options: [
                    { value: "gold-18k", label: "18k Gold" },
                    { value: "gold-14k", label: "14k Gold" },
                    { value: "platinum", label: "Platinum" },
                    { value: "silver", label: "Sterling Silver" },
                    { value: "mixed", label: "Mixed Materials" }
                ]},
            { id: "gemstoneType", label: "Gemstone Type", type: "text", required: false },
            { id: "modelName", label: "Model Name", type: "text", required: true },
            { id: "condition", label: "Condition", type: "select", required: true, options: [
                    { value: "new", label: "New" },
                    { value: "like-new", label: "Like New" },
                    { value: "used", label: "Used" },
                    { value: "damaged", label: "Damaged" }
                ]},
            { id: "boxPapers", label: "Box & Papers", type: "select", required: true, options: [
                    { value: "complete", label: "Complete Set (Box & Papers)" },
                    { value: "papers-only", label: "Papers Only" },
                    { value: "box-only", label: "Box Only" },
                    { value: "none", label: "No Box or Papers" }
                ]},
            { id: "intendedWearer", label: "Intended Wearer", type: "select", required: true, options: [
                    { value: "women", label: "Women" },
                    { value: "men", label: "Men" },
                    { value: "unisex", label: "Unisex" }
                ]}
        ]
    },
    sneakers: {
        id: "sneakers",
        label: "Sneakers",
        description: "Limited edition, collectible, and designer sneakers. Please include style codes if available.",
        excludeInfo: "Unbranded or fast-fashion sneakers",
        parameterWeights: [
            { fieldId: "brand", weight: 1 },
            { fieldId: "modelName", weight: 1 },
            { fieldId: "condition", weight: 1 },
            { fieldId: "sizeMens", weight: 0.7 },
            { fieldId: "sizeWomens", weight: 0.7 },
            { fieldId: "boxIncluded", weight: 0.6 },
            { fieldId: "colorway", weight: 0.5 },
            { fieldId: "intendedWearer", weight: 0.6 }
        ],
        fields: [
            { id: "brand", label: "Brand", type: "text", required: true },
            { id: "modelName", label: "Model / Style Code", type: "text", required: true },
            { 
                id: "intendedWearer", 
                label: "Intended Wearer", 
                type: "select", 
                required: true, 
                options: [
                    { value: "men", label: "Men" },
                    { value: "women", label: "Women" },
                    { value: "unisex", label: "Unisex" }
                ]
            },
            { 
                id: "sizeMens", 
                label: "Size (US Men's)", 
                type: "select", 
                required: true, 
                showOnlyForForms: ["men", "unisex"],
                options: [
                    { value: "4", label: "US 4" },
                    { value: "4.5", label: "US 4.5" },
                    { value: "5", label: "US 5" },
                    { value: "5.5", label: "US 5.5" },
                    { value: "6", label: "US 6" },
                    { value: "6.5", label: "US 6.5" },
                    { value: "7", label: "US 7" },
                    { value: "7.5", label: "US 7.5" },
                    { value: "8", label: "US 8" },
                    { value: "8.5", label: "US 8.5" },
                    { value: "9", label: "US 9" },
                    { value: "9.5", label: "US 9.5" },
                    { value: "10", label: "US 10" },
                    { value: "10.5", label: "US 10.5" },
                    { value: "11", label: "US 11" },
                    { value: "11.5", label: "US 11.5" },
                    { value: "12", label: "US 12" },
                    { value: "12.5", label: "US 12.5" },
                    { value: "13", label: "US 13" },
                    { value: "13.5", label: "US 13.5" },
                    { value: "14", label: "US 14" },
                    { value: "15", label: "US 15" },
                    { value: "16", label: "US 16" }
                ]
            },
            { 
                id: "sizeWomens", 
                label: "Size (US Women's)", 
                type: "select", 
                required: true, 
                showOnlyForForms: ["women"],
                options: [
                    { value: "5", label: "US 5" },
                    { value: "5.5", label: "US 5.5" },
                    { value: "6", label: "US 6" },
                    { value: "6.5", label: "US 6.5" },
                    { value: "7", label: "US 7" },
                    { value: "7.5", label: "US 7.5" },
                    { value: "8", label: "US 8" },
                    { value: "8.5", label: "US 8.5" },
                    { value: "9", label: "US 9" },
                    { value: "9.5", label: "US 9.5" },
                    { value: "10", label: "US 10" },
                    { value: "10.5", label: "US 10.5" },
                    { value: "11", label: "US 11" },
                    { value: "11.5", label: "US 11.5" },
                    { value: "12", label: "US 12" }
                ]
            },
            { id: "condition", label: "Condition", type: "select", required: true, options: [
                    { value: "deadstock", label: "Deadstock (New/Unworn)" },
                    { value: "lightly-worn", label: "Lightly Worn (1-5 wears)" },
                    { value: "used", label: "Used (Visible wear)" },
                    { value: "damaged", label: "Damaged (Significant issues)" }
                ]},
            { id: "boxIncluded", label: "Original Box", type: "select", required: true, options: [
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" }
                ]},
            { id: "colorway", label: "Colorway", type: "text", required: false }
        ]
    },
    preciousMetals: {
        id: "preciousMetals",
        label: "Precious Metals",
        description: "Investment-grade precious metals including coins, bars, and bullion. Please provide detailed specifications and certification information.",
        excludeInfo: "Jewelry items (use Jewelry category), industrial metals, or non-precious alloys",
        parameterWeights: [
            { fieldId: "metalType", weight: 1 },
            { fieldId: "form", weight: 0.9 },
            { fieldId: "weightValue", weight: 1 },
            { fieldId: "weightUnit", weight: 0.8 },
            { fieldId: "purity", weight: 1 },
            { fieldId: "mintMark", weight: 0.8 },
            { fieldId: "yearMinted", weight: 0.7 },
            { fieldId: "certification", weight: 0.8 },
            { fieldId: "condition", weight: 0.9 }
        ],
        fields: [
            { id: "metalType", label: "Metal Type", type: "select", required: true, options: [
                    { value: "gold", label: "Gold" },
                    { value: "silver", label: "Silver" },
                    { value: "platinum", label: "Platinum" },
                    { value: "palladium", label: "Palladium" },
                    { value: "other", label: "Other Precious Metal" }
                ]},
            { id: "form", label: "Form", type: "select", required: true, options: [
                    { value: "coin", label: "Coin" },
                    { value: "bar", label: "Bar" },
                    { value: "round", label: "Round" },
                    { value: "ingot", label: "Ingot" },
                    { value: "other", label: "Other" }
                ]},
            { id: "weightValue", label: "Weight Value", type: "number", required: true, placeholder: "Enter weight value" },
            { id: "weightUnit", label: "Weight Unit", type: "select", required: true, options: [
                    { value: "g", label: "Grams (g)" },
                    { value: "kg", label: "Kilograms (kg)" },
                    { value: "oz", label: "Ounces (oz)" },
                    { value: "ozt", label: "Troy Ounces (ozt)" }
                ]},
            { id: "purity", label: "Purity", type: "select", required: true, options: [], dynamicOptions: {
                    gold: [
                        { value: "999-fine", label: "999 Fine (24k / .999)", purityDecimal: 0.999 },
                        { value: "995-fine", label: "995 Fine (23.9k / .995)", purityDecimal: 0.995 },
                        { value: "9999-fine", label: "9999 Fine (24k+ / .9999)", purityDecimal: 0.9999 },
                        { value: "916-fine", label: "916 Fine (22k / .916)", purityDecimal: 0.916 },
                        { value: "900-fine", label: "900 Fine (21.6k / .900)", purityDecimal: 0.900 },
                        { value: "800-fine", label: "800 Fine (19.2k / .800)", purityDecimal: 0.800 },
                        { value: "750-fine", label: "750 Fine (18k / .750)", purityDecimal: 0.750 },
                        { value: "585-fine", label: "585 Fine (14k / .585)", purityDecimal: 0.585 },
                        { value: "other", label: "Other Purity", purityDecimal: null }
                    ],
                    silver: [
                        { value: "999-fine", label: "999 Fine (.999)", purityDecimal: 0.999 },
                        { value: "9999-fine", label: "9999 Fine (.9999)", purityDecimal: 0.9999 },
                        { value: "925-sterling", label: "925 Sterling Silver (.925)", purityDecimal: 0.925 },
                        { value: "900-fine", label: "900 Fine (.900)", purityDecimal: 0.900 },
                        { value: "800-fine", label: "800 Fine (.800)", purityDecimal: 0.800 },
                        { value: "other", label: "Other Purity", purityDecimal: null }
                    ],
                    platinum: [
                        { value: "9995-fine", label: "9995 Fine (.9995)", purityDecimal: 0.9995 },
                        { value: "999-fine", label: "999 Fine (.999)", purityDecimal: 0.999 },
                        { value: "950-fine", label: "950 Fine (.950)", purityDecimal: 0.950 },
                        { value: "900-fine", label: "900 Fine (.900)", purityDecimal: 0.900 },
                        { value: "other", label: "Other Purity", purityDecimal: null }
                    ],
                    palladium: [
                        { value: "9995-fine", label: "9995 Fine (.9995)", purityDecimal: 0.9995 },
                        { value: "999-fine", label: "999 Fine (.999)", purityDecimal: 0.999 },
                        { value: "950-fine", label: "950 Fine (.950)", purityDecimal: 0.950 },
                        { value: "other", label: "Other Purity", purityDecimal: null }
                    ],
                    default: [
                        { value: "999-fine", label: "999 Fine (.999)", purityDecimal: 0.999 },
                        { value: "995-fine", label: "995 Fine (.995)", purityDecimal: 0.995 },
                        { value: "900-fine", label: "900 Fine (.900)", purityDecimal: 0.900 },
                        { value: "other", label: "Other Purity", purityDecimal: null }
                    ]
                }},
            { id: "mintMark", label: "Mint/Manufacturer", type: "text", required: false },
            { id: "yearMinted", label: "Year Minted/Manufactured", type: "text", required: false },
            { 
                id: "certification", 
                label: "Certification", 
                type: "select", 
                required: true, 
                showOnlyForForms: ["coin", "bar"],
                helpText: "Select the organization that has certified your item's authenticity and condition.",
                options: [
                    { value: "pcgs", label: "PCGS (Professional Coin Grading Service)" },
                    { value: "ngc", label: "NGC (Numismatic Guaranty Corporation)" },
                    { value: "anacs", label: "ANACS (American Numismatic Association Certification Service)" },
                    { value: "icg", label: "ICG (Independent Coin Graders)" },
                    { value: "self-assay", label: "Self-Assayed (Personal verification)" },
                    { value: "manufacturer", label: "Manufacturer Certified" },
                    { value: "none", label: "No Certification (Raw)" }
            ]
            },
            { id: "condition", label: "Condition", type: "select", required: true, options: [
                    { value: "mint", label: "Mint State (MS)" },
                    { value: "bu", label: "Brilliant Uncirculated (BU)" },
                    { value: "proof", label: "Proof" },
                    { value: "au", label: "Almost Uncirculated (AU)" },
                    { value: "xf", label: "Extremely Fine (XF/EF)" },
                    { value: "vf", label: "Very Fine (VF)" },
                    { value: "damaged", label: "Damaged" }
                ]}
        ]
    }
};


// Function to initialize categories in Firestore
const initializeCategories = async () => {
    try {
        const batch = writeBatch(db);

        Object.entries(categorySchema).forEach(([categoryId, categoryData]) => {
            const docRef = doc(db, "categories", categoryId);
            batch.set(docRef, categoryData);
        });

        await batch.commit();
        console.log("✅ Categories initialized in Firebase!");
        return { success: true };
    } catch (error) {
        console.error("❌ Error initializing categories:", error);
        return { success: false, error };
    }
};

export default function AdminCategoriesPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; error?: any } | null>(null);

    const handleInitialize = async () => {
        if (window.confirm('This will add or overwrite all category data in Firebase. Continue?')) {
            setLoading(true);
            try {
                const result = await initializeCategories();
                setResult(result);
            } catch (error) {
                setResult({ success: false, error });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-medium mb-6">Category Management</h1>

            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-medium mb-2">Initialize Categories</h2>
                <p className="mb-4 text-sm text-gray-600">
                    This will create or update all category definitions in your Firebase database.
                    Use this when setting up the system or when making changes to category fields.
                </p>

                <button
                    onClick={handleInitialize}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Initializing...' : 'Initialize Categories'}
                </button>
            </div>

            {result && (
                <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {result.success
                        ? 'Categories successfully initialized! Your form will now dynamically load these categories and their fields.'
                        : `Error: ${result.error?.message || 'Unknown error'}`}
                </div>
            )}

            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h2 className="text-lg font-medium mb-2">Category Schema Preview</h2>
                <p className="mb-4 text-sm text-gray-600">
                    These are the categories that will be added to your database.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(categorySchema).map((category) => (
                        <div key={category.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <h3 className="font-medium text-lg">{category.label}</h3>
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            <p className="text-xs text-gray-500">Fields: {category.fields.length}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
