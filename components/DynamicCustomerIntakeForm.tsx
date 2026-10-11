/// <reference types="google.maps" />
'use client';

import React, {
  useState,
  useId,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
} from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import Script from 'next/script';

import ItemMatchSelector from '@/components/ItemMatchSelector';
import SkeletonItemMatch from '@/components/SkeletonItemMatch';
import LoadingOverlay from '@/components/LoadingOverlay';
import { formatMatchesForDisplay } from '@/utils/titleFormatters';

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
interface Option {
  value: string;
  label: string;
}

interface CategoryField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: Option[];
  placeholder?: string;
  helpText?: string;
  dynamicOptions?: Record<string, Option[]>;
  showOnlyForForms?: string[];
}

type CategoryRecord = {
  id: string;
  label: string;
  fields?: CategoryField[];
  parameterWeights?: Array<{ fieldId: string; weight: number }>;
};

interface Item {
  id: string;
  category: string;
  condition: string;
  photos: string[];
  dynamicFields: Record<string, any>;
  isUploading?: boolean; // Add this optional property
}

type Match = Record<string, any>;

interface AddressComponents {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
}

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  icon?: React.ReactNode;
  required?: boolean;
}

// ---------------------------------------------------------
// Component for displaying help tooltip
// ---------------------------------------------------------
const FieldHelpTooltip: React.FC<{ helpText: string }> = ({ helpText }) => {
  if (!helpText) return null;
  return (
    <span className="ml-1 relative group inline-block">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-blue-500 inline cursor-help"
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

// ---------------------------------------------------------
// Utility functions
// ---------------------------------------------------------
const normalizeWeightToGrams = (weightValue?: string, weightUnit?: string): number | null => {
  if (!weightValue || !weightUnit) return null;
  const value = parseFloat(weightValue);
  if (isNaN(value) || value <= 0) return null;
  switch (weightUnit) {
    case 'g':
      return value;
    case 'kg':
      return value * 1000;
    case 'oz':
      return value * 28.3495231;
    case 'ozt':
      return value * 31.1034768;
    default:
      return value;
  }
};

const gramsToTroyOunces = (grams: number): number => grams / 31.1034768;

const getPurityDecimal = (
  purityValue?: string,
  metalType?: string,
  categoryData?: CategoryRecord
): number | null => {
  if (!purityValue || !metalType || !categoryData) return null;
  const purityField = categoryData.fields?.find((f) => f.id === 'purity');
  if (!purityField || !purityField.dynamicOptions) return null;
  const options = purityField.dynamicOptions[metalType] || purityField.dynamicOptions.default;
  const selected = options.find((o) => o.value === purityValue);
  return selected ? (selected as any).purityDecimal : null;
};

const calculatePureTroyOunces = (item: Item, categoryData: CategoryRecord): number | null => {
  if (item.category !== 'preciousMetals') return null;
  const { metalType, weightValue, weightUnit, purity } = item.dynamicFields;
  const grams = normalizeWeightToGrams(weightValue, weightUnit);
  const purityDecimal = getPurityDecimal(purity, metalType, categoryData);
  if (grams === null || purityDecimal === null) return null;
  return gramsToTroyOunces(grams * purityDecimal);
};

// ---------------------------------------------------------
// CustomSelect Component
// ---------------------------------------------------------
const CustomSelect: React.FC<CustomSelectProps> = ({
    id,
    value,
    onChange,
    options,
    placeholder,
    icon,
    required = false,
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
            isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
          } bg-white cursor-pointer ${value ? 'text-gray-900' : 'text-gray-500'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {icon && <span className="text-gray-400 mr-2">{icon}</span>}
          <span className="flex-grow truncate">{value ? selectedLabel : placeholder}</span>
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
        </div>
  
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="sr-only"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
  
        {isOpen && (
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

// ---------------------------------------------------------
// Firebase Initialization
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// ---------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------
const conditionOptions: Option[] = [
  { value: 'mint', label: 'Mint - Like new with all original packaging' },
  { value: 'excellent', label: 'Excellent - Minimal signs of wear' },
  { value: 'very-good', label: 'Very Good - Minor signs of wear' },
  { value: 'good', label: 'Good - Visible signs of wear' },
  { value: 'fair', label: 'Fair - Significant wear and/or minor damage' },
];

const getDisplayLabel = (id: string): string =>
  id.startsWith('item-') ? `Item ${id.replace('item-', '')}` : id;

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------
const DynamicCustomerIntakeForm: React.FC = () => {
  const baseId = useId();
  const router = useRouter();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const placesAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
  }>({ name: '', email: '', phone: '', address: '' });

  const [validationErrors, setValidationErrors] = useState<{
    phone?: string;
    address?: string;
  }>({});

  const [categories, setCategories] = useState<Record<string, CategoryRecord>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [items, setItems] = useState<Item[]>([
    { id: 'item-1', category: '', condition: '', photos: [], dynamicFields: {} },
  ]);
  const [itemCounter, setItemCounter] = useState(2);
  const [matchesByItem, setMatchesByItem] = useState<Record<string, Match[]>>({});
  const [formattedMatchesByItem, setFormattedMatchesByItem] = useState<Record<string, any[]>>({});
  const [selectedMatches, setSelectedMatches] = useState<Record<string, Match>>({});
  const [showMatchSelection, setShowMatchSelection] = useState(false);
  const [loadedItems, setLoadedItems] = useState<string[]>([]);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [pricingStarted, setPricingStarted] = useState(false);
  const [pricingCompleted, setPricingCompleted] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const getPurityOptions = (metalType?: string, categoryData?: CategoryRecord): Option[] => {
    const purityField = categoryData?.fields?.find((f) => f.id === 'purity');
    if (!purityField || !purityField.dynamicOptions) {
      return purityField?.options || [];
    }
    return purityField.dynamicOptions[metalType!] || purityField.dynamicOptions.default;
  };

  // -------------------------------------------------------
  // Google Places Autocomplete init
  // -------------------------------------------------------
  const initPlacesAutocomplete = () => {
    if (
      addressInputRef.current &&
      typeof window !== 'undefined' &&
      window.google?.maps?.places
    ) {
      placesAutocomplete.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address'],
        }
      );
      placesAutocomplete.current.addListener('place_changed', () => {
        const place = placesAutocomplete.current?.getPlace();
        if (!place?.address_components) {
          setValidationErrors((prev) => ({
            ...prev,
            address: 'Please select a valid address from the suggestions',
          }));
          return;
        }
        const components: AddressComponents = {};
        place.address_components.forEach((c) => {
          const t = c.types[0];
          if (t === 'street_number') components.street_number = c.long_name;
          if (t === 'route') components.route = c.long_name;
          if (t === 'locality') components.locality = c.long_name;
          if (t === 'administrative_area_level_1')
            components.administrative_area_level_1 = c.short_name;
          if (t === 'postal_code') components.postal_code = c.long_name;
          if (t === 'country') components.country = c.long_name;
        });
        if (
          !components.street_number ||
          !components.route ||
          !components.locality ||
          !components.administrative_area_level_1 ||
          !components.postal_code
        ) {
          setValidationErrors((prev) => ({
            ...prev,
            address: 'Please provide a complete address',
          }));
          return;
        }
        setCustomerInfo((prev) => ({
          ...prev,
          address: place.formatted_address || '',
        }));
        setValidationErrors((prev) => ({ ...prev, address: undefined }));
      });
    }
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const parsed = parsePhoneNumberFromString(phoneNumber, 'US');
    if (!parsed || !parsed.isValid()) {
      setValidationErrors((prev) => ({
        ...prev,
        phone: 'Please enter a valid phone number',
      }));
      return false;
    }
    setCustomerInfo((prev) => ({
      ...prev,
      phone: parsed.formatNational(),
    }));
    setValidationErrors((prev) => ({ ...prev, phone: undefined }));
    return true;
  };

  // Handlers for customer info, items, dynamic fields, photos...
  const handleCustomerInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneBlur = () => {
    validatePhoneNumber(customerInfo.phone);
  };

  const handleItemChange = (
    id: string,
    field: 'category' | 'condition',
    value: string
  ) => {
    setItems((arr) =>
      arr.map((it) => {
        if (it.id !== id) return it;
        if (field === 'category') {
          return { ...it, [field]: value, dynamicFields: {} };
        }
        return { ...it, [field]: value };
      })
    );
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

// In the handleDynamicFieldChange function, add logic to reset size fields when intendedWearer changes
const handleDynamicFieldChange = (
  itemId: string,
  fieldId: string,
  value: string
) => {
  setItems((arr) =>
    arr.map((it) => {
      if (it.id !== itemId) return it;
      const newDynamic = { ...it.dynamicFields, [fieldId]: value };
      
      // Handle metal type change in precious metals
      if (it.category === 'preciousMetals' && fieldId === 'metalType') {
        delete newDynamic.purity;
      }
      
      // Handle form change in precious metals
      if (it.category === 'preciousMetals' && fieldId === 'form') {
        const certField = categories.preciousMetals?.fields?.find((f) => f.id === 'certification');
        if (certField?.showOnlyForForms && !certField.showOnlyForForms.includes(value)) {
          delete newDynamic.certification;
        }
      }
      
      // Handle intended wearer change for sneakers
      if (it.category === 'sneakers' && fieldId === 'intendedWearer') {
        // Clear size fields when changing intended wearer
        if (value === 'men' || value === 'unisex') {
          delete newDynamic.sizeWomens;
        } else if (value === 'women') {
          delete newDynamic.sizeMens;
        }
      }
      
      return { ...it, dynamicFields: newDynamic };
    })
  );
};

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item-${itemCounter}`,
        category: '',
        condition: '',
        photos: [],
        dynamicFields: {},
      },
    ]);
    setItemCounter(c => c + 1);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handlePhotoUpload = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Show loading state for this specific item
    setItems(arr => 
      arr.map(it => (it.id === id ? { ...it, isUploading: true } : it))
    );
    
    try {
      console.log(`Starting upload for item ${id}, file: ${file.name}`);
      
      // Create a unique filename to avoid collisions
      const uniqueFileName = `${Date.now()}-${file.name}`;
      
      // Create a better folder structure with a safer approach to sessionStorage
      let tempSessionId;
      
      // Only use sessionStorage in browser environment
      if (typeof window !== 'undefined') {
        tempSessionId = window.sessionStorage.getItem('temp_session_id') || 
          `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Store the session ID if not already stored
        if (!window.sessionStorage.getItem('temp_session_id')) {
          window.sessionStorage.setItem('temp_session_id', tempSessionId);
        }
      } else {
        // Fallback for server-side rendering
        tempSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Use a path that includes the session ID and the temporary item ID
      const storageRef = ref(storage, `uploads/${tempSessionId}/${id}/${uniqueFileName}`);
      
      console.log('Storage reference created, starting upload...');
      
      // Upload with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'tempItemId': id,
          'uploadTime': new Date().toISOString(),
          'tempSessionId': tempSessionId
        }
      };
      
      await uploadBytes(storageRef, file, metadata);
      
      console.log('File uploaded successfully, getting download URL...');
      
      const url = await getDownloadURL(storageRef);
      
      console.log(`Download URL obtained: ${url}`);
      
      // Update the items state with the new photo URL
      setItems(arr =>
        arr.map(it => (it.id === id ? { 
          ...it, 
          photos: [...it.photos, url],
          isUploading: false
        } : it))
      );
      
      // Show success message
      console.log(`Photo successfully uploaded for item ${id}`);
    } catch (error) {
      console.error('Error during photo upload:', error);
      setSubmitError(`Error uploading photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Reset uploading state even on error
      setItems(arr =>
        arr.map(it => (it.id === id ? { ...it, isUploading: false } : it))
      );
    }
  };

  const createItemDescription = (item: Item, categoryData?: CategoryRecord): string => {
    if (!categoryData) return '';
    let desc = '';
    if (Array.isArray(categoryData.parameterWeights)) {
      [...categoryData.parameterWeights]
        .sort((a, b) => b.weight - a.weight)
        .forEach((param) => {
          const val = item.dynamicFields[param.fieldId];
          if (val) {
            const fld = categoryData.fields?.find((f) => f.id === param.fieldId);
            if (fld) {
              if (fld.type === 'select' && fld.options) {
                const opt = fld.options.find((o) => o.value === val);
                if (opt) desc += `${fld.label}: ${opt.label}. `;
              } else desc += `${fld.label}: ${val}. `;
            }
          }
        });
    } else {
      categoryData.fields?.forEach((fld) => {
        const val = item.dynamicFields[fld.id];
        if (val) desc += `${fld.label}: ${val}. `;
      });
    }
    return desc;
  };

  const handleIndividualMatchSelection = async (itemId: string, match: Match): Promise<void> => {
    setSelectedMatches((prev) => ({ ...prev, [itemId]: match }));
  };

  const confirmAllMatches = async () => {
    const missing = items.filter((it) => !selectedMatches[it.id]);
    if (missing.length) {
      alert('Please select a match for every item.');
      return;
    }
    setIsSubmitting(true);
    setLoadingPhase('pricing');
    try {
      const appRef = doc(db, 'applications', applicationId!);
      const updateData: any = {
        matchSelectionStatus: 'complete',
        updatedAt: new Date().toISOString(),
        pricingStatus: 'pending',
        pricingStartedAt: new Date().toISOString(),
        pricingItemStatus: {},
      };

      for (const it of items) {
        const match = selectedMatches[it.id];
        const isPrecious = it.category === 'preciousMetals';

        if (isPrecious) {
          const pureOunces = calculatePureTroyOunces(it, categories[it.category]);

          updateData[`selectedMatches.${it.id}`] = {
            title: match.displayTitle || match.title,
            image: match.image,
            isPreciousMetalDisplay: true,
            criticalAttributes: {
              metalType: it.dynamicFields.metalType,
              form: it.dynamicFields.form,
              weightDisplay: `${it.dynamicFields.weightValue} ${it.dynamicFields.weightUnit}`,
              purity: it.dynamicFields.purity,
            },
          };

          updateData[`updatedItems.${it.id}`] = {
            id: it.id,
            category: 'preciousMetals',
            dynamicFields: {
              metalType: it.dynamicFields.metalType,
              form: it.dynamicFields.form,
              weightValue: it.dynamicFields.weightValue,
              weightUnit: it.dynamicFields.weightUnit,
              purity: it.dynamicFields.purity,
              calculated: {
                weightInGrams: normalizeWeightToGrams(
                  it.dynamicFields.weightValue,
                  it.dynamicFields.weightUnit
                ),
                purityDecimal: getPurityDecimal(
                  it.dynamicFields.purity,
                  it.dynamicFields.metalType,
                  categories[it.category]
                ),
                pureTroyOunces: pureOunces,
              },
            },
            isPreciousMetal: true,
          };
        } else {
          const sa = match.structuredAttributes || {};
          const updatedItem: Item = { ...it };
          if (it.category && Object.keys(sa).length) {
            const fields = categories[it.category].fields || [];
            const newDyn = { ...it.dynamicFields };
            fields.forEach((fld) => {
              const mv = sa[fld.id];
              if (mv) {
                if (fld.type === 'select' && fld.options) {
                  const mo =
                    fld.options.find((o) => o.label.toLowerCase() === mv.toLowerCase()) ||
                    fld.options.find((o) => mv.toLowerCase().includes(o.label.toLowerCase()));
                  if (mo) newDyn[fld.id] = mo.value;
                } else newDyn[fld.id] = mv;
              }
            });
            updatedItem.dynamicFields = newDyn;
          }
          updateData[`selectedMatches.${it.id}`] = {
            title: match.displayTitle || match.title,
            image: match.image,
            criticalAttributes: sa,
          };
          updateData[`updatedItems.${it.id}`] = updatedItem;
        }

        updateData[`pricingItemStatus.${it.id}`] = 'pending';
      }

      await updateDoc(appRef, updateData);
      setLoadingPhase('redirecting');
      setTimeout(() => {
        router.push(
          `/confirmation?applicationId=${applicationId}&email=${encodeURIComponent(
            customerInfo.email
          )}`
        );
      }, 500);

      // dispatch pricing jobs
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const match = selectedMatches[it.id];
        if (i > 0) await new Promise((r) => setTimeout(r, 200));
        try {
          await fetch('/api/search-pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              applicationId,
              query: match.displayTitle || match.title,
              category: it.category,
              matchTitle: match.displayTitle || match.title,
              itemId: it.id,
              isPreciousMetal: it.category === 'preciousMetals',
              metalType: it.category === 'preciousMetals' ? it.dynamicFields.metalType : undefined,
              form: it.category === 'preciousMetals' ? it.dynamicFields.form : undefined,
              weightValue: it.category === 'preciousMetals' ? it.dynamicFields.weightValue : undefined,
              weightUnit: it.category === 'preciousMetals' ? it.dynamicFields.weightUnit : undefined,
              purity: it.category === 'preciousMetals' ? it.dynamicFields.purity : undefined,
              backgroundProcessing: true,
            }),
          });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setPricingError(err.message || 'Error during processing');
      setLoadingPhase('redirecting');
      setTimeout(() => {
        router.push(
          `/confirmation?applicationId=${applicationId}&email=${encodeURIComponent(
            customerInfo.email
          )}`
        );
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setLoadingPhase('submitting');
    setLoadedItems([]);
    setLoadingComplete(false);

    // validation...
    const v = validateFormFields();
    if (!v.isValid) {
      setSubmitError(v.errorMessage!);
      setLoadingPhase(null);
      return;
    }

    setShowMatchSelection(true);
    const placeholders: Record<string, any[]> = {};
    items.forEach((it) => (placeholders[it.id] = Array(3).fill({ title: '', image: null, isLoading: true })));
    setFormattedMatchesByItem(placeholders);

    const formattedItems = items.map((it) => ({
      id: it.id,
      category: it.category,
      condition: it.condition,
      dynamicFields: it.dynamicFields,
      photos: it.photos,
      itemDescription: createItemDescription(it, categories[it.category]),
    }));

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerInfo, items: formattedItems, categories }),
      });
      if (!res.ok) {
        const text = await res.text();
        setSubmitError(`Server error: ${res.status} - ${text}`);
        setLoadingPhase(null);
        return;
      }
      const data = await res.json();
      setApplicationId(data.applicationId);

      const grouped = data.suggestedMatches.reduce(
        (acc: Record<string, Match[]>, im: any) => {
          acc[im.itemId] = im.matches.map((m: any) => ({
            ...m,
            originalItem: im.item,
            itemId: im.itemId,
          }));
          return acc;
        },
        {}
      );
      setMatchesByItem(grouped);

      const temp = { ...placeholders };
      const done: string[] = [];

      for (const itemId of Object.keys(grouped)) {
        setLoadingPhase(`formatting_${itemId}`);
        try {
          temp[itemId] = await formatMatchesForDisplay(grouped[itemId], categories);
        } catch {
          temp[itemId] = grouped[itemId].map((m: any) => ({
            ...m,
            displayTitle: m.title || 'Unknown',
          }));
        }
        done.push(itemId);
        setFormattedMatchesByItem({ ...temp });
        setLoadedItems([...done]);
        await new Promise((r) => setTimeout(r, 50));
      }

      setLoadingComplete(true);
      setLoadingPhase(null);
    } catch (err: any) {
      setSubmitError(`Submission failed: ${err.message}`);
      setLoadingPhase(null);
    }
  };

  useEffect(() => {
    if (matchesByItem && loadedItems.length > 0 && loadingComplete) {
      for (const itemId of loadedItems) {
        const matches = formattedMatchesByItem[itemId] || [];
        const item = items.find((it) => it.id === itemId);
        if (item?.category === 'preciousMetals' && matches.length === 1) {
          handleIndividualMatchSelection(itemId, matches[0]);
        }
      }
    }
  }, [loadingComplete, loadedItems, formattedMatchesByItem, items]);

  // Fetch categories
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        const data: Record<string, CategoryRecord> = {};
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as Omit<CategoryRecord, 'id'>;
          data[docSnap.id] = { id: docSnap.id, ...raw };
        });
        setCategories(data);
      } catch {
        setSubmitError('Error loading form data. Refresh page.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Init Google Places once script loads
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      initPlacesAutocomplete();
    }
  }, []);

  // Poll pricing status
  useEffect(() => {
    let iv: number;
    if (pricingStarted && applicationId && !pricingCompleted && !pricingError) {
      iv = window.setInterval(async () => {
        try {
          const docRef = doc(db, 'applications', applicationId);
          const appDoc = await getDoc(docRef);
          if (appDoc.exists()) {
            const data = appDoc.data() as any;
            if (data.pricingStatus === 'complete' && data.pricingData) {
              setPricingCompleted(true);
              clearInterval(iv);
              setLoadingPhase('redirecting');
              setTimeout(() => {
                router.push(
                  `/confirmation?applicationId=${applicationId}&email=${encodeURIComponent(
                    customerInfo.email
                  )}`
                );
              }, 1000);
            } else if (data.pricingStatus === 'error') {
              setPricingError(data.pricingError || 'Unknown pricing error');
              clearInterval(iv);
              setLoadingPhase('redirecting');
              setTimeout(() => {
                router.push(
                  `/confirmation?applicationId=${applicationId}&email=${encodeURIComponent(
                    customerInfo.email
                  )}`
                );
              }, 1000);
            }
          }
        } catch {
          // ignore
        }
      }, 2000);
    }
    return () => clearInterval(iv);
  }, [pricingStarted, applicationId, pricingCompleted, pricingError, customerInfo.email, router]);

  const validateFormFields = (): { isValid: boolean; errorMessage?: string } => {
    if (!customerInfo.name) return { isValid: false, errorMessage: 'Name is required' };
    if (!customerInfo.email) return { isValid: false, errorMessage: 'Email is required' };
    if (!customerInfo.phone || !validatePhoneNumber(customerInfo.phone))
      return { isValid: false, errorMessage: validationErrors.phone || 'Phone number is required' };
    if (!customerInfo.address) return { isValid: false, errorMessage: 'Address is required' };
    if (validationErrors.address)
      return { isValid: false, errorMessage: validationErrors.address };
    if (items.length === 0) return { isValid: false, errorMessage: 'At least one item required' };
    const incomplete = items.find(
      (it) =>
        !it.category ||
        (!it.condition &&
          !categories[it.category]?.fields?.some((f) => f.id === 'condition'))
    );
    if (incomplete)
      return { isValid: false, errorMessage: 'Complete all item details' };
    return { isValid: true };
  };

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-gray-100 p-8 rounded-3xl shadow-lg text-gray-900">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (loadingPhase) {
    let msg = 'Processing your request…';
    let sub = 'This may take a moment.';
    let prog = 50;
    switch (loadingPhase) {
      case 'submitting':
        msg = 'Submitting your information…';
        sub = 'Please wait.';
        prog = 25;
        break;
      case 'matching':
        msg = 'Finding the best matches…';
        sub = 'Our AI is searching.';
        prog = 50;
        break;
      case 'formatting':
        msg = 'Preparing your results…';
        sub = 'Almost there!';
        prog = 75;
        break;
      case 'pricing':
        msg = 'Calculating your offer…';
        sub = 'Analyzing market data.';
        prog = 85;
        break;
      case 'redirecting':
        msg = 'Finalizing…';
        sub = 'Redirecting.';
        prog = 95;
        break;
    }
    return <LoadingOverlay message={msg} subMessage={sub} progress={prog} />;
  }

  if (showMatchSelection) {
    return (
      <div>
        {items.map((it) => {
          const isItemLoaded = loadedItems.includes(it.id);
          const hasMatches = formattedMatchesByItem[it.id]?.length > 0;
          return (
            <div key={it.id} className="mb-8">
              <h3 className="text-xl font-medium mb-4">
                Matches for {getDisplayLabel(it.id)}
              </h3>
              {!isItemLoaded ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-blue-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.610A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.610-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700">Finding matches…</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      This typically takes 10-20 seconds
                    </div>
                  </div>
                  <SkeletonItemMatch />
                  <SkeletonItemMatch />
                  <SkeletonItemMatch />
                </div>
                ) : hasMatches ? (
                  <ItemMatchSelector
                    matches={formattedMatchesByItem[it.id] || []}
                    selectedMatchId={
                      selectedMatches[it.id]
                        ? (formattedMatchesByItem[it.id] || []).findIndex(
                            (m) => m === selectedMatches[it.id]
                          )
                        : null
                    }
                    onSelectMatch={(m: Match, idx: number) =>
                      handleIndividualMatchSelection(it.id, m)
                    }
                    onReload={() => setShowMatchSelection(false)}
                    categories={categories}
                    isLoading={false}
                  />
                ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-700 mb-2">
                      No matches found for {getDisplayLabel(it.id)}
                    </p>
                    <button
                      onClick={() => setShowMatchSelection(false)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors mt-2"
                    >
                      Edit item details
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loadingComplete && loadedItems.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-700 text-sm">Loading items…</span>
              <span className="text-blue-700 font-medium">
                {Math.round((loadedItems.length / items.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(loadedItems.length / items.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={() => setShowMatchSelection(false)}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Adjust Your Item Info
          </button>
          <button
            onClick={confirmAllMatches}
            disabled={!Object.keys(selectedMatches).length || isSubmitting || !loadedItems.length}
            className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center ${
              (!Object.keys(selectedMatches).length || isSubmitting || !loadedItems.length) &&
              'opacity-70 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Processing…
              </>
            ) : (
              <>
                Confirm Selections
                {!loadingComplete && loadedItems.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-500 px-2 py-1 rounded-full">
                    {loadedItems.length}/{items.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // Main form
  // -------------------------------------------------------
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_CLOUD_CREDENTIALS}&libraries=places`}
        onLoad={initPlacesAutocomplete}
      />

      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-6 text-white">
        <h2 className="text-2xl font-semibold mb-2">Asset Liquidity Application</h2>
        <p className="text-blue-100">
          Submit your luxury items for evaluation. Receive cash while keeping your items with you.
        </p>
      </div>

      <div className="p-8">
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

        <form onSubmit={handleSubmit}>
          {/* Your Information */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">Your Information</h3>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="group">
                  <label
                    htmlFor="name"
                    className="block text-gray-700 mb-2 group-focus-within:text-blue-600"
                  >
                    Full Name*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={customerInfo.name}
                      onChange={handleCustomerInfoChange}
                      required
                      className="pl-10 w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="group">
                  <label
                    htmlFor="email"
                    className="block text-gray-700 mb-2 group-focus-within:text-blue-600"
                  >
                    Email Address*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      required
                      className="pl-10 w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Phone Number */}
                <div className="group">
                  <label
                    htmlFor="phone"
                    className="block text-gray-700 mb-2 group-focus-within:text-blue-600"
                  >
                    Phone Number*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.740 4.435a1 1 0 01-.540 1.060l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.540l4.435.740a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.820 18 2 12.180 2 5V3z" />
                      </svg>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      onBlur={handlePhoneBlur}
                      required
                      placeholder="(555) 123-4567"
                      className={`pl-10 w-full px-4 py-3 rounded-lg bg-white border ${
                        validationErrors.phone
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 transition-all`}
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                </div>

                {/* Full Address */}
                <div className="group">
                  <label
                    htmlFor="address"
                    className="block text-gray-700 mb-2 group-focus-within:text-blue-600"
                  >
                    Full Address*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.050a7 7 0 119.900 9.900L10 18.900l-4.950-4.950a7 7 0 010-9.900zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      id="address"
                      name="address"
                      ref={addressInputRef}
                      type="text"
                      value={customerInfo.address}
                      onChange={handleCustomerInfoChange}
                      required
                      placeholder="Start typing your address..."
                      className={`pl-10 w-full px-4 py-3 rounded-lg bg-white border ${
                        validationErrors.address
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 transition-all`}
                    />
                  </div>
                  {validationErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Please select from the address suggestions for accurate verification
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 5a3 3 0 015-2.236A3 3 0 0114.830 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.170A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z"
                    clipRule="evenodd"
                  />
                  <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900">Your Items</h3>
            </div>

            <div className="space-y-6">
              {items.map((item, idx) => {
                const itemCategoryId = `item-category-${item.id}`;
                const itemConditionId = `item-condition-${item.id}`;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Item Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 rounded-t-xl border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 shadow-sm">
                          <span className="text-blue-700 font-semibold">{idx + 1}</span>
                        </div>
                        <h4 className="font-medium text-lg text-gray-900">Item {idx + 1}</h4>
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Item Content */}
                    <div className="p-6">
                      {/* Category */}
                      <div className="mb-6">
                        <label htmlFor={itemCategoryId} className="block text-gray-700 mb-2">
                          Category*
                        </label>
                        <CustomSelect
                          id={itemCategoryId}
                          value={item.category}
                          onChange={(v) => handleItemChange(item.id, 'category', v)}
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
                        />
                      </div>

                      {/* Condition */}
                      {!categories[item.category]?.fields?.some((f) => f.id === 'condition') && (
                        <div className="mb-6">
                          <label htmlFor={itemConditionId} className="block text-gray-700 mb-2">
                            Condition*
                          </label>
                          <CustomSelect
                            id={itemConditionId}
                            value={item.condition}
                            onChange={(v) => handleItemChange(item.id, 'condition', v)}
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
                                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.820 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.820-1.573l7-10a1 1 0 011.120-.38z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            }
                            required
                          />
                        </div>
                      )}

                      {/* ----------------
                          Dynamic Fields
                          ---------------- */}
                      {(() => {
                        const cat = categories[item.category];
                        if (!item.category || !cat) return null;

                        // textarea vs regular
                        const textareaFields = cat.fields?.filter((f) => f.type === 'textarea') || [];
                        const regularFields =
                          cat.fields?.filter(
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

                            {/* Weight Section */}
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
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            value={item.dynamicFields[field.id] || ''}
                                            onChange={onVal}
                                            options={field.options || []}
                                            placeholder={`Select ${field.label}`}
                                            required={field.required}
                                          />
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
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            value={item.dynamicFields[field.id] || ''}
                                            onChange={onVal}
                                            options={field.options || []}
                                            placeholder={`Select ${field.label}`}
                                            required={field.required}
                                          />
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
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                          />
                                        </div>
                                      );
                                    })}
                                  {regularFields
                                    .filter((f) => f.id === 'weightUnit')
                                    .map((field) => {
                                      const fid = `${item.id}-${field.id}`;
                                      const onVal = (v: string) =>
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            value={item.dynamicFields[field.id] || ''}
                                            onChange={onVal}
                                            options={field.options || []}
                                            placeholder={`Select ${field.label}`}
                                            required={field.required}
                                          />
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
                                        handleDynamicFieldChange(item.id, field.id, v);
                                      const opts = getPurityOptions(
                                        item.dynamicFields.metalType,
                                        cat
                                      );
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
                                            value={item.dynamicFields[field.id] || ''}
                                            onChange={onVal}
                                            options={opts}
                                            placeholder={
                                              item.dynamicFields.metalType
                                                ? `Select ${field.label}`
                                                : 'Select metal type first'
                                            }
                                            required={field.required}
                                          />
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Additional Details */}
                            {item.category === 'preciousMetals' && (
                              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
                                <h5 className="font-medium text-gray-700 mb-3">Additional Details</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                  {regularFields
                                    .filter((f) => f.id === 'mintMark')
                                    .map((field) => {
                                      const fid = `${item.id}-${field.id}`;
                                      const onVal = (v: string) =>
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                          />
                                        </div>
                                      );
                                    })}
                                  {regularFields
                                    .filter((f) => f.id === 'yearMinted')
                                    .map((field) => {
                                      const fid = `${item.id}-${field.id}`;
                                      const onVal = (v: string) =>
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                          />
                                        </div>
                                      );
                                    })}
                                  {regularFields
                                    .filter((f) => f.id === 'certification')
                                    .map((field) => {
                                      const fid = `${item.id}-${field.id}`;
                                      const onVal = (v: string) =>
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            value={item.dynamicFields[field.id] || ''}
                                            onChange={onVal}
                                            options={field.options || []}
                                            placeholder={`Select ${field.label}`}
                                            required={field.required}
                                          />
                                        </div>
                                      );
                                    })}
                                  {regularFields
                                    .filter((f) => f.id === 'condition')
                                    .map((field) => {
                                      const fid = `${item.id}-${field.id}`;
                                      const onVal = (v: string) =>
                                        handleDynamicFieldChange(item.id, field.id, v);
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
                                            value={item.dynamicFields[field.id] || ''}
                                            onChange={onVal}
                                            options={field.options || []}
                                            placeholder={`Select ${field.label}`}
                                            required={field.required}
                                          />
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Non-precious metals */}
                            {item.category !== 'preciousMetals' && regularFields.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                                {regularFields.map((field) => {
                                  const fid = `${item.id}-${field.id}`;
                                  const onVal = (v: string) =>
                                    handleDynamicFieldChange(item.id, field.id, v);
                                  const opts =
                                    item.category === 'preciousMetals' && field.id === 'purity'
                                      ? getPurityOptions(item.dynamicFields.metalType, cat)
                                      : field.options || [];
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
                                        <CustomSelect
                                          id={fid}
                                          value={item.dynamicFields[field.id] || ''}
                                          onChange={onVal}
                                          options={opts}
                                          placeholder={`Select ${field.label}`}
                                          required={field.required}
                                        />
                                      ) : (
                                        <input
                                          id={fid}
                                          type={field.type}
                                          value={item.dynamicFields[field.id] || ''}
                                          onChange={(e) => onVal(e.target.value)}
                                          required={field.required}
                                          placeholder={field.placeholder || `Enter ${field.label}`}
                                          className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                          min={field.type === 'number' ? '0' : undefined}
                                          step={field.type === 'number' ? 'any' : undefined}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Textareas */}
                            {textareaFields.length > 0 && (
                              <div className="space-y-4">
                                {textareaFields.map((field) => {
                                  const fid = `${item.id}-${field.id}`;
                                  const onVal = (v: string) =>
                                    handleDynamicFieldChange(item.id, field.id, v);
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
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={4}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Photos */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                        <label className="block text-gray-700 mb-3 font-medium">
                            Photos (Optional)
                        </label>
                        <div className="flex items-center mb-3">
                            <label className={`cursor-pointer px-4 py-2 ${
                            item.isUploading 
                                ? 'bg-gray-100 text-gray-400' 
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                            } rounded-lg transition-colors border ${
                            item.isUploading ? 'border-gray-200' : 'border-blue-200'
                            } flex items-center shadow-sm`}>
                            {item.isUploading ? (
                                <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                                Uploading...
                                </>
                            ) : (
                                <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                    fillRule="evenodd"
                                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                    clipRule="evenodd"
                                    />
                                </svg>
                                Add Photo
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(item.id, e)}
                                disabled={item.isUploading}
                            />
                            </label>
                            <span className="ml-3 text-sm text-gray-500">
                            {item.photos.length > 0
                                ? `${item.photos.length} photo(s) uploaded`
                                : 'No photos uploaded'}
                            </span>
                        </div>
                        {item.photos.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-3">
                            {item.photos.map((photo, pi) => (
                                <div
                                key={pi}
                                className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square border border-gray-200 shadow-sm hover:shadow transition-all"
                                >
                                <Image
                                    src={photo}
                                    alt={`Item ${idx + 1} photo ${pi + 1}`}
                                    width={100}
                                    height={100}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                    // Add a function to remove this photo
                                    setItems(prev => prev.map(it => 
                                        it.id === item.id 
                                        ? { ...it, photos: it.photos.filter((_, i) => i !== pi) }
                                        : it
                                    ));
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={addItem}
                className="px-6 py-3 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-all border border-blue-200 shadow-sm flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Another Item
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-10 pt-6 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              All fields marked with * are required
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-md flex items-center"
            >
              Submit Application
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DynamicCustomerIntakeForm;
