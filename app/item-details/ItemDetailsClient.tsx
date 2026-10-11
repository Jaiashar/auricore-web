'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import ItemPricingSkeleton from '@/components/ItemPricingSkeleton';
import PricingLoadingOverlay from '@/components/PricingLoadingOverlay';

// Types
interface Option { value: string; label: string; }
interface CategoryField { id: string; label: string; type: string; required?: boolean; options?: Option[]; placeholder?: string; helpText?: string; dynamicOptions?: Record<string, Option[]>; showOnlyForForms?: string[]; }

type CategoryRecord = { id: string; label: string; fields?: CategoryField[]; parameterWeights?: Array<{ fieldId: string; weight: number }>; };
interface Item { id: string; category: string; condition: string; photos: string[]; dynamicFields: Record<string, any>; isUploading?: boolean; }
interface CustomerInfo { name: string; email: string; phone: string; address: string; }
interface CustomSelectProps { id: string; value: string; onChange: (value: string) => void; options: Option[]; placeholder: string; icon?: React.ReactNode; required?: boolean; disabled?: boolean; }


// Components
const FieldHelpTooltip: React.FC<{ helpText: string }> = ({ helpText }) => {
  if (!helpText) return null;
  return (
    <span className="ml-1 relative group inline-block">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-blue-600 inline cursor-help"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs p-2 rounded w-64 bottom-full left-1/2 transform -translate-x-1/2 mb-1 shadow-lg">
        {helpText}
        <div className="absolute w-3 h-3 bg-gray-800 rotate-45 left-1/2 -bottom-1 transform -translate-x-1/2"></div>
      </div>
    </span>
  );
};

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  icon,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || '';

  return (
    <div className="relative" ref={selectRef}>
      <div
        className={`flex items-center px-4 py-3 rounded-lg border ${
            isOpen ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-300'
        } bg-white cursor-pointer ${value ? 'text-black' : 'text-gray-500'} ${
            disabled ? 'bg-white text-gray-900 cursor-not-allowed' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        >
        {icon && <span className="text-gray-400 mr-2">{icon}</span>}
        <span className={`flex-grow truncate ${value ? 'font-medium text-gray-900' : ''}`}>
            {value ? selectedLabel : placeholder}
        </span>
        {!disabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0
                011.414 1.414l-4 4a1 1 0 01-1.414
                0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="sr-only"
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-1">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`px-4 py-2 cursor-pointer rounded-md ${
                  value === opt.value ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  {value === opt.value && (
                    <svg
                      className="w-4 h-4 mr-2 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010
                          1.414l-8 8a1 1 0 01-1.414
                          0l-4-4a1 1 0
                          011.414-1.414L8
                          12.586l7.293-7.293a1
                          1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className={value === opt.value ? '' : 'ml-6'}>{opt.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Constants
const conditionOptions: Option[] = [
  { value: 'mint', label: 'Mint - Like new with all original packaging' },
  { value: 'excellent', label: 'Excellent - Minimal signs of wear' },
  { value: 'very-good', label: 'Very Good - Minor signs of wear' },
  { value: 'good', label: 'Good - Visible signs of wear' },
  { value: 'fair', label: 'Fair - Significant wear and/or minor damage' },
];

// Utility Functions
const getPurityOptions = (metalType?: string, categoryData?: CategoryRecord): Option[] => {
  const purityField = categoryData?.fields?.find((f) => f.id === 'purity');
  if (!purityField || !purityField.dynamicOptions) {
    return purityField?.options || [];
  }
  return purityField.dynamicOptions[metalType!] || purityField.dynamicOptions.default;
};

const shouldDisableField = (fieldId: string, isPrefilled: boolean) => {
  // Only brand and model fields should remain locked if they're prefilled
  return (fieldId === 'brand' || fieldId === 'model') && isPrefilled;
};

const shouldDisplayField = (field: CategoryField, itemData: Item): boolean => {
  if (field.showOnlyForForms && itemData.dynamicFields) {
    // For sneakers category, check if this is a size field that should show based on intendedWearer
    if (itemData.category === 'sneakers' && (field.id === 'sizeMens' || field.id === 'sizeWomens')) {
      const wearer = itemData.dynamicFields.intendedWearer;
      
      // For men's size field, show if wearer is 'men' or 'unisex'
      if (field.id === 'sizeMens' && (wearer === 'men' || wearer === 'unisex')) {
        return true;
      }
      
      // For women's size field, show if wearer is 'women'
      if (field.id === 'sizeWomens' && wearer === 'women') {
        return true;
      }
      
      // Don't show the field if conditions aren't met
      return false;
    }
    
    // For other cases, like preciousMetals form field
    const currentForm = itemData.dynamicFields.form;
    return field.showOnlyForForms.includes(currentForm);
  }
  return true;
};

// Main Component
export default function ItemDetailsPage() {
  type PricingStage =
    | 'initializing'
    | 'searching'
    | 'analyzing'
    | 'calculating-data'
    | 'calculating-offer'
    | 'calculating-range'
    | 'finalizing'
    | 'complete';



  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('id');
  
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricingStage, setPricingStage] = useState<PricingStage>('initializing');

  
  const [categories, setCategories] = useState<Record<string, CategoryRecord>>({});
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [item, setItem] = useState<Item>({
    id: 'primary-item',
    category: '',
    condition: '',
    photos: [],
    dynamicFields: {}
  });
  
  const [matchData, setMatchData] = useState<any>(null);
  const [prefilled, setPrefilled] = useState<Record<string, boolean>>({});
  const [matchIndex, setMatchIndex] = useState<number>(0);

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // Survey: why are you using this service?
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  const [useCase, setUseCase] = useState<string>('');
  const useCaseOptions: Option[] = [
    { value: 'resell', label: 'Looking to resell' },
    { value: 'price',  label: 'Just want to get a price' },
    { value: 'loan',   label: 'Looking to get a loan with Auricore' },
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  
  // Load categories and match data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsDataLoading(true);
  
        // 1) Load all categories
        const categoriesSnap = await getDocs(collection(db, 'categories'));
        const categoriesData: Record<string, CategoryRecord> = {};
        categoriesSnap.forEach(docSnap => {
          categoriesData[docSnap.id] = {
            id: docSnap.id,
            ...(docSnap.data() as Omit<CategoryRecord, 'id'>)
          };
        });
        setCategories(categoriesData);
  
        // 2) Ensure we have a resultId
        if (!resultId) {
          setError('No result ID provided. Please return to the previous page.');
          return;
        }
  
        // 3) Fetch the analysis result
        const resultRef = doc(db, 'analysisResults', resultId);
        const resultSnap = await getDoc(resultRef);
        if (!resultSnap.exists()) {
          setError('Result not found. Please try again.');
          return;
        }
        const resultData = resultSnap.data() as any;
        setMatchData(resultData);
  
        // 4) Build initial item, including original photo if present
        const catId = resultData.categoryData.id;
        const initialItem: Item = {
          id: 'primary-item',
          category: catId,
          condition: '',
          photos: resultData.imageUrl ? [resultData.imageUrl] : [],
          dynamicFields: {}
        };
        if (resultData.imageUrl) {
          setPrefilled(prev => ({ ...prev, originalPhoto: true }));
        }
  
        // 5) Determine which match was selected
        const idxParam = searchParams.get('matchIndex');
        const idx = idxParam ? parseInt(idxParam, 10) : 0;
        setMatchIndex(idx);
  
        // 6) Prefill any structuredAttributes
        const candidate = resultData.matches?.[idx];
        if (candidate?.structuredAttributes) {
            for (const [fieldId, val] of Object.entries(candidate.structuredAttributes)) {
                // don’t auto-fill the "condition" field
                if (fieldId === 'condition') continue;
                if (val) {
                initialItem.dynamicFields[fieldId] = val;
                setPrefilled(prev => ({ ...prev, [fieldId]: true }));
                }
            }
        }
  
        // 7) Finally set the item
        setItem(initialItem);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(`Error loading data: ${err.message}`);
      } finally {
        setIsDataLoading(false);
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [resultId, searchParams]);
  
  
  
  // Handle item fields change
  const handleItemChange = (field: 'category' | 'condition', value: string) => {
    setItem(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle dynamic field change
  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    setItem(prev => {
      const newDynamic = { ...prev.dynamicFields, [fieldId]: value };
      
      // Handle metal type change in precious metals
      if (prev.category === 'preciousMetals' && fieldId === 'metalType') {
        delete newDynamic.purity;
      }
      
      // Handle form change in precious metals
      if (prev.category === 'preciousMetals' && fieldId === 'form') {
        const certField = categories.preciousMetals?.fields?.find((f) => f.id === 'certification');
        if (certField?.showOnlyForForms && !certField.showOnlyForForms.includes(value)) {
          delete newDynamic.certification;
        }
      }
      
      // Handle intended wearer change for sneakers
      if (prev.category === 'sneakers' && fieldId === 'intendedWearer') {
        // Clear size fields when changing intended wearer
        if (value === 'men' || value === 'unisex') {
          delete newDynamic.sizeWomens;
        } else if (value === 'women') {
          delete newDynamic.sizeMens;
        }
      }
      
      return {
        ...prev,
        dynamicFields: newDynamic
      };
    });
  };
  
  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show loading state
    setItem(prev => ({ ...prev, isUploading: true }));
    
    try {
      console.log(`Starting upload for file: ${file.name}`);
      
      // Create a unique filename to avoid collisions
      const uniqueFileName = `${Date.now()}-${file.name}`;
      
      // Generate session ID for temporary storage
      let tempSessionId;
      if (typeof window !== 'undefined') {
        tempSessionId = window.sessionStorage.getItem('temp_session_id') || 
          `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        if (!window.sessionStorage.getItem('temp_session_id')) {
          window.sessionStorage.setItem('temp_session_id', tempSessionId);
        }
      } else {
        tempSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Use a path that includes the session ID and item ID
      const storageRef = ref(storage, `uploads/${tempSessionId}/${item.id}/${uniqueFileName}`);
      
      // Upload with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'tempItemId': item.id,
          'uploadTime': new Date().toISOString(),
          'tempSessionId': tempSessionId
        }
      };
      
      await uploadBytes(storageRef, file, metadata);
      const url = await getDownloadURL(storageRef);
      
      // Update the item with the new photo URL
      setItem(prev => ({
        ...prev,
        photos: [...prev.photos, url],
        isUploading: false
      }));
      
    } catch (error: any) {
      console.error('Error during photo upload:', error);
      setSubmitError(`Error uploading photo: ${error.message || 'Unknown error'}`);
      
      // Reset uploading state
      setItem(prev => ({ ...prev, isUploading: false }));
    }
  };
  
  // Handle form submission
// Final version of handleSubmit function for ItemDetailsPage

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    setIsPricingLoading(true);
    
    try {
      // Basic validation
      if (!item.category) {
        throw new Error('Category is required');
      }
      
      if (!categories[item.category]?.fields?.some(f => f.id === 'condition') && !item.condition) {
        throw new Error('Condition is required');
      }

      if (!useCase) {
        throw new Error('Please tell us why you`re using this service');
      }
      
      const { id, category, condition, photos, dynamicFields } = item;
      const photoUrls = photos.filter((p) => p.startsWith('https://'));

      const cleanItem = {
        id,
        category,
        condition,
        photos: photoUrls,
        dynamicFields: JSON.parse(JSON.stringify(dynamicFields)),
        timestamp: new Date().toISOString()
      };

      const submitData = {
        resultId,
        item: cleanItem,
        customerInfo,
        surveyUseCase: useCase,
      };

      // Compose your Firestore payload
      const payload = {
        resultId,
        item: cleanItem,
        customerInfo,        // { name, email, phone, address }
        surveyUseCase: useCase
      };

      console.log('About to write to Firestore:', payload);
      await setDoc(doc(db, 'itemDetails', resultId!), payload);
      
      // Update the original analysis result to mark it as completed
      const analysisResultRef = doc(db, 'analysisResults', resultId!);
      await updateDoc(analysisResultRef, {
        detailsCompleted: true,
        detailsTimestamp: new Date().toISOString()
      });
      
      // Create an application record for pricing
      const applicationRef = doc(db, 'applications', resultId!);

      const matchIndex = searchParams.get('matchIndex') ? 
        parseInt(searchParams.get('matchIndex')!) : 0;
      const selectedMatch = matchData?.matches?.[matchIndex] || null;

      // Pick only the minimal category info
      const cleanCategory = {
        id: categories[item.category].id,
        label: categories[item.category].label
      };
      
      await setDoc(applicationRef, {
        customerInfo,
        items: [ cleanItem ],
        selectedMatch: selectedMatch,
        selectedMatches: { 'primary-item': selectedMatch },
        categoryData: cleanCategory,
        surveyUseCase: useCase,
        detailsTimestamp: new Date().toISOString(),
        status: 'submitted',
        submissionTimestamp: new Date().toISOString(),
        pricingStatus: 'pending',
        pricingItemStatus: { 'primary-item': 'pending' },
        pricingItemStage: { 'primary-item': 'initializing' },
        pricingItemProgress: { 'primary-item': 0 }
      });
      
      // Initiate pricing for the item via a client-side fetch
      try {
        console.log('Initiating pricing process...');
        const pricingRes = await fetch('/api/search-pricing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            applicationId: resultId,
            itemId: 'primary-item',
            isPreciousMetal: item.category === 'preciousMetals'
          })
        });
        
        if (pricingRes.ok) {
          console.log('Pricing process initiated successfully');
        } else {
          console.warn('Pricing initiation failed, but continuing with redirect');
        }
      } catch (pricingErr) {
        console.error('Error initiating pricing:', pricingErr);
        // We'll continue even if pricing initiation fails
      }
      
      // Redirect to confirmation page
      router.push(`/confirmation?applicationId=${resultId}&email=${encodeURIComponent(customerInfo.email)}`);
      
    } catch (err: any) {
        console.error('Error submitting form:', err);
        setSubmitError(err.message || 'An error occurred while submitting the form');
        setIsSubmitting(false);
        setIsPricingLoading(false);
    }
};
  
  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <Header activeTab="borrower" />
        <section className="pt-32 pb-16">
          <LoadingOverlay 
            message="Loading your item details..." 
            subMessage="Retrieving information about your selected item" 
            progress={isDataLoading ? 30 : 70} 
          />
        </section>
        <Footer />
      </main>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <Header activeTab="borrower" />
        <section className="pt-32 pb-16">
          <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-10 text-center">
            <div className="bg-red-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go Back
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }
  
  // Get current category
  const currentCategory = categories[item.category];
  
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Analytics />
      <SpeedInsights />
      <Header activeTab="borrower" />
  
      {isPricingLoading && (
        <PricingLoadingOverlay 
          visible={isPricingLoading} 
          applicationId={resultId!}
          itemId="primary-item"
        />
      )}

      <section className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg my-10">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Complete Your Item Details</h1>
          <p className="text-gray-600 mb-6">
            We've pre-filled information based on your item. Please verify and complete the remaining details.
          </p>
      
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {submitError}
          </div>
        </div>
      )}
      
      {matchData.matches[matchIndex] && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h2 className="text-lg font-medium text-blue-800 mb-2">Your Selected Match</h2>
            <div className="flex items-center">
            {(() => {
                const selected = matchData.matches[matchIndex];
                // Prefer thumbnail, then image, then placeholder
                const src = selected.thumbnail || selected.image;
                if (src) {
                return (
                    <div className="w-20 h-20 mr-4 bg-white rounded-md border border-gray-200 overflow-hidden flex-shrink-0">
                    <Image
                        src={src}
                        alt={selected.displayTitle || selected.title || 'Item'}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                    />
                    </div>
                );
                } else {
                return (
                    <div className="w-20 h-20 mr-4 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 012-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    </div>
                );
                }
            })()}
            <div className="flex-grow">
                <h3 className="font-medium text-blue-900">
                {matchData.matches[matchIndex].displayTitle || matchData.matches[matchIndex].title || 'Your Item'}
                </h3>
                <p className="text-sm text-blue-700">
                Some information has been pre-filled based on this match. Please review and complete any missing details.
                </p>
            </div>
            </div>
        </div>
        )}

      
      <form onSubmit={handleSubmit}>
        {/* Category */}
        <div className="mb-6">
          <label htmlFor="item-category" className="block text-gray-700 mb-2 font-medium">
            Category*
          </label>
          <CustomSelect
            id="item-category"
            value={item.category}
            onChange={(v) => handleItemChange('category', v)}
            options={Object.values(categories).map((c) => ({
              value: c.id,
              label: c.label,
            }))}
            placeholder="Select a category"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            }
            required
            disabled={true} // Category is pre-filled and locked
          />
          {prefilled.category && (
            <div className="mt-1 text-xs text-blue-600 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Pre-filled from your selection
            </div>
          )}
        </div>
        
        {/* Condition */}
        {!currentCategory?.fields?.some((f) => f.id === 'condition') && (
          <div className="mb-6">
            <label htmlFor="item-condition" className="block text-gray-700 mb-2 font-medium">
              Condition*
            </label>
            <CustomSelect
              id="item-condition"
              value={item.condition}
              onChange={(v) => handleItemChange('condition', v)}
              options={conditionOptions}
              placeholder="Select condition"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.820 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              required
            />
          </div>
        )}
        
        {/* Dynamic Fields */}
        {(() => {
          if (!item.category || !currentCategory) return null;
          
          // Separate fields by type for better organization
          const textareaFields = currentCategory.fields?.filter((f) => f.type === 'textarea') || [];
          const regularFields = currentCategory.fields?.filter(
            (f) => f.type !== 'textarea' && shouldDisplayField(f, item)
          ) || [];

          return (
            <div className="mt-4">
              {/* Precious metals header */}
              {item.category === 'preciousMetals' && (
                <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-amber-600 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h4 className="font-medium text-amber-800">Precious Metal Details</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Please provide accurate details about your precious metal item.
                    We'll calculate the value based on metal type, weight, and purity.
                  </p>
                </div>
              )}

              {/* Weight Section for Precious Metals */}
              {item.category === 'preciousMetals' && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                  <h5 className="font-medium text-gray-700 mb-3">Metal Details</h5>

                  {/* Metal Type */}
                  <div className="mb-4">
                    {regularFields
                      .filter((f) => f.id === 'metalType')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];

                        const fieldValue = item.dynamicFields[field.id] || '';
                        const optionsArray = [...(field.options || [])];
                        
                        // Add the current value to options if it doesn't exist
                        if (fieldValue && !optionsArray.some(opt => opt.value === fieldValue)) {
                          optionsArray.push({
                            value: fieldValue,
                            label: fieldValue
                          });
                        }

                        return (
                          <div key={fid}>
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <CustomSelect
                                id={fid}
                                value={fieldValue}
                                onChange={onVal}
                                options={optionsArray}
                                placeholder={`Select ${field.label}`}
                                required={field.required}
                                disabled={shouldDisableField(field.id, isPrefilled)}
                              />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Form */}
                  <div className="mb-4">
                    {regularFields
                      .filter((f) => f.id === 'form')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];

                        const fieldValue = item.dynamicFields[field.id] || '';
                        const optionsArray = [...(field.options || [])];
                        
                        // Add the current value to options if it doesn't exist
                        if (fieldValue && !optionsArray.some(opt => opt.value === fieldValue)) {
                          optionsArray.push({
                            value: fieldValue,
                            label: fieldValue
                          });
                        }

                        return (
                          <div key={fid}>
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <CustomSelect
                                id={fid}
                                value={fieldValue}
                                onChange={onVal}
                                options={optionsArray}
                                placeholder={`Select ${field.label}`}
                                required={field.required}
                                disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Weight value & unit */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {regularFields
                      .filter((f) => f.id === 'weightValue')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];
                        return (
                          <div key={fid}>
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <input
                              id={fid}
                              type="number"
                              value={item.dynamicFields[field.id] || ''}
                              onChange={(e) => onVal(e.target.value)}
                              required={field.required}
                              min="0"
                              step="any"
                              placeholder={field.placeholder}
                              className={`w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                isPrefilled ? 'bg-gray-50 text-gray-900 font-medium' : ''
                              }`}
                              disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {regularFields
                      .filter((f) => f.id === 'weightUnit')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];

                        const fieldValue = item.dynamicFields[field.id] || '';
                        const optionsArray = [...(field.options || [])];
                        
                        // Add the current value to options if it doesn't exist
                        if (fieldValue && !optionsArray.some(opt => opt.value === fieldValue)) {
                          optionsArray.push({
                            value: fieldValue,
                            label: fieldValue
                          });
                        }

                        return (
                          <div key={fid}>
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <CustomSelect
                              id={fid}
                              value={fieldValue}
                              onChange={onVal}
                              options={optionsArray}
                              placeholder={`Select ${field.label}`}
                              required={field.required}
                              disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Purity */}
                  <div className="mb-4">
                    {regularFields
                      .filter((f) => f.id === 'purity')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const opts = getPurityOptions(
                          item.dynamicFields.metalType,
                          currentCategory
                        );
                        const isPrefilled = prefilled[field.id];

                        const fieldValue = item.dynamicFields[field.id] || '';
                        const purityOptions = [...getPurityOptions(
                          item.dynamicFields.metalType,
                          currentCategory
                        )];
                        
                        // Add the current value to options if it doesn't exist
                        if (fieldValue && !purityOptions.some(opt => opt.value === fieldValue)) {
                          purityOptions.push({
                            value: fieldValue,
                            label: fieldValue
                          });
                        }

                        return (
                          <div key={fid}>
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <CustomSelect
                                id={fid}
                                value={fieldValue}
                                onChange={onVal}
                                options={purityOptions}
                                placeholder={
                                    item.dynamicFields.metalType
                                    ? `Select ${field.label}`
                                    : 'Select metal type first'
                                }
                                required={field.required}
                                disabled={isPrefilled || !item.dynamicFields.metalType}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Additional Details for Precious Metals */}
              {item.category === 'preciousMetals' && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                  <h5 className="font-medium text-gray-700 mb-3">Additional Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {regularFields
                      .filter((f) => f.id === 'mintMark')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];
                        return (
                          <div key={fid}>
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <input
                              id={fid}
                              type="text"
                              value={item.dynamicFields[field.id] || ''}
                              onChange={(e) => onVal(e.target.value)}
                              required={field.required}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              className={`w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                isPrefilled ? 'bg-gray-50 text-gray-900 font-medium' : ''
                              }`}
                              disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {regularFields
                      .filter((f) => f.id === 'yearMinted')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];
                        return (
                          <div key={fid}>
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <input
                              id={fid}
                              type="text"
                              value={item.dynamicFields[field.id] || ''}
                              onChange={(e) => onVal(e.target.value)}
                              required={field.required}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              className={`w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                isPrefilled ? 'bg-gray-50 text-gray-900 font-medium' : ''
                              }`}
                              disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {regularFields
                      .filter((f) => f.id === 'certification')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];

                        const fieldValue = item.dynamicFields[field.id] || '';
                        const optionsArray = [...(field.options || [])];
                        
                        // Add the current value to options if it doesn't exist
                        if (fieldValue && !optionsArray.some(opt => opt.value === fieldValue)) {
                          optionsArray.push({
                            value: fieldValue,
                            label: fieldValue
                          });
                        }
                        
                        return (
                          <div key={fid} className="col-span-2">
                            <div className="flex items-center">
                              <label htmlFor={fid} className="block text-gray-700 mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </div>
                            <CustomSelect
                                id={fid}
                                value={fieldValue}
                                onChange={onVal}
                                options={optionsArray}
                                placeholder={`Select ${field.label}`}
                                required={field.required}
                                disabled={shouldDisableField(field.id, isPrefilled)}
                              />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {regularFields
                      .filter((f) => f.id === 'condition')
                      .map((field) => {
                        const fid = `${item.id}-${field.id}`;
                        const onVal = (v: string) =>
                          handleDynamicFieldChange(field.id, v);
                        const isPrefilled = prefilled[field.id];

                        const fieldValue = item.dynamicFields[field.id] || '';
                        const optionsArray = [...(field.options || [])];
                        
                        // Add the current value to options if it doesn't exist
                        if (fieldValue && !optionsArray.some(opt => opt.value === fieldValue)) {
                          optionsArray.push({
                            value: fieldValue,
                            label: fieldValue
                          });
                        }

                        return (
                          <div key={fid} className="col-span-2">
                            <label htmlFor={fid} className="block text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                              {field.helpText && (
                                <FieldHelpTooltip helpText={field.helpText} />
                              )}
                            </label>
                            <CustomSelect
                                id={fid}
                                value={fieldValue}
                                onChange={onVal}
                                options={optionsArray}
                                placeholder={`Select ${field.label}`}
                                required={field.required}
                                disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Non-precious metals regular fields */}
              {item.category !== 'preciousMetals' && regularFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                  {regularFields.map((field) => {
                    const fid = `${item.id}-${field.id}`;
                    const onVal = (v: string) =>
                      handleDynamicFieldChange(field.id, v);
                    const isPrefilled = prefilled[field.id];
                    
                    const fieldValue = item.dynamicFields[field.id] || '';
                    const optionsArray = [...(field.options || [])];
                    
                    // Add the current value to options if it doesn't exist
                    if (fieldValue && !optionsArray.some(opt => opt.value === fieldValue)) {
                      optionsArray.push({
                        value: fieldValue,
                        label: fieldValue
                      });
                    }

                    return (
                      <div key={fid}>
                        <label htmlFor={fid} className="block text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                          {field.helpText && (
                            <FieldHelpTooltip helpText={field.helpText} />
                          )}
                        </label>
                        {field.type === 'select' ? (
                          <>
                            <CustomSelect
                                id={fid}
                                value={fieldValue}
                                onChange={onVal}
                                options={optionsArray}
                                placeholder={`Select ${field.label}`}
                                required={field.required}
                                disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              id={fid}
                              type={field.type}
                              value={item.dynamicFields[field.id] || ''}
                              onChange={(e) => onVal(e.target.value)}
                              required={field.required}
                              placeholder={field.placeholder || `Enter ${field.label}`}
                              className={`w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                isPrefilled ? 'bg-gray-50 text-gray-900 font-medium' : ''
                              }`}
                              min={field.type === 'number' ? '0' : undefined}
                              step={field.type === 'number' ? 'any' : undefined}
                              disabled={shouldDisableField(field.id, isPrefilled)}
                            />
                            {isPrefilled && (
                              <div className="mt-1 text-xs text-blue-600 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pre-filled from your selection
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Textarea fields */}
              {textareaFields.length > 0 && (
                <div className="space-y-4">
                  {textareaFields.map((field) => {
                    const fid = `${item.id}-${field.id}`;
                    const onVal = (v: string) =>
                      handleDynamicFieldChange(field.id, v);
                    const isPrefilled = prefilled[field.id];
                    return (
                      <div key={fid}>
                        <label htmlFor={fid} className="block text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                          {field.helpText && (
                            <FieldHelpTooltip helpText={field.helpText} />
                          )}
                        </label>
                        <textarea
                          id={fid}
                          value={item.dynamicFields[field.id] || ''}
                          onChange={(e) => onVal(e.target.value)}
                          required={field.required}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          className={`w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all ${
                            isPrefilled ? 'bg-white text-gray-900 font-medium' : 'text-gray-900'
                          }`}
                          rows={4}
                          disabled={shouldDisableField(field.id, isPrefilled)}
                        />
                        {isPrefilled && (
                          <div className="mt-1 text-xs text-blue-600 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Pre-filled from your selection
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

     {/* Survey: why are you using this service? */}
     <div className="mb-6">
       <label htmlFor="use-case" className="block text-gray-700 mb-2 font-medium">
         Why are you using this service?<span className="text-red-500 ml-1">*</span>
       </label>
       <CustomSelect
         id="use-case"
         value={useCase}
         onChange={setUseCase}
         options={useCaseOptions}
         placeholder="Select an option"
         required
       />
       {!useCase && (
         <p className="mt-1 text-sm text-red-600">
           Please tell us why you’re using this service
         </p>
       )}
     </div>
        
        {/* Photos */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <label className="block text-gray-700 mb-3 font-medium">
            Photos
          </label>

          {/* Display existing photos */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-4">
            {item.photos.map((photo, pi) => (
              <div
                key={pi}
                className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square border border-gray-200 shadow-sm hover:shadow transition-all"
              >
                <Image
                  src={photo}
                  alt={`Item photo ${pi + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />

                {/* Only show delete button for non-original photos */}
                {!(pi === 0 && prefilled.originalPhoto) && (
                  <button
                    type="button"
                    onClick={() =>
                      setItem(prev => ({
                        ...prev,
                        photos: prev.photos.filter((_, i) => i !== pi),
                      }))
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 
                        4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 
                        4.293a1 1 0 01-1.414-1.414L8.586 10 
                        4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}

                {/* "Original Photo" badge */}
                {pi === 0 && prefilled.originalPhoto && (
                  <div className="absolute bottom-1 left-1 right-1 bg-blue-600 bg-opacity-70 text-white text-xs py-1 px-2 rounded text-center">
                    Original Photo
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload more photos */}
          <div className="flex items-center mb-3">
            <label
              className={`cursor-pointer px-4 py-2 ${
                item.isUploading
                  ? 'bg-gray-100 text-gray-400 border-gray-200'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              } rounded-lg transition-colors border flex items-center shadow-sm`}
            >
              {item.isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 
                        002 2h12a2 2 0 002-2V5a2 
                        2 0 00-2-2H4zm12 12H4l4-8 3 
                        6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add More Photos
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={item.isUploading}
              />
            </label>
            <span className="ml-3 text-sm text-gray-500">
              {item.photos.length > 0
                ? `${item.photos.length} photo(s) total`
                : 'No photos uploaded'}
            </span>
          </div>

          {prefilled.originalPhoto && (
            <div className="mt-1 text-xs text-blue-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 
                    8a1 1 0 01-1.414 0l-4-4a1 1 0 
                    011.414-1.414L8 12.586l7.293-7.293a1 
                    1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Your original photo has been pre-filled
            </div>
          )}
        </div>
        
        {/* Personal Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Your Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Full Name*
              </label>
              <input
                id="name"
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-black"
              />
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email*
              </label>
              <input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-black"
              />
            </div>
            
            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-gray-700 mb-2">
                Phone Number*
              </label>
              <input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                onBlur={() => {
                  // Format phone number on blur
                  try {
                    const parsed = parsePhoneNumberFromString(customerInfo.phone, 'US');
                    if (parsed && parsed.isValid()) {
                      setCustomerInfo(prev => ({ ...prev, phone: parsed.formatNational() }));
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }}
                required
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-black"
              />
            </div>
            
            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-gray-700 mb-2">
                Address*
              </label>
              <input
                id="address"
                type="text"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                required
                placeholder="Enter your full address"
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-black"
              />
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Complete Application
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}