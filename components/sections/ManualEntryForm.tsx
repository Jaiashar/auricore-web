// components/sections/ManualEntryForm.tsx
import React, { useState } from 'react';

interface ManualEntryFormProps {
  onSubmit: (formData: any) => void;
  isSubmitting: boolean;
}

// Define the categories and their fields
const categories = [
  {
    id: 'watches',
    label: 'Watches',
    fields: [
      { id: 'brand', label: 'Brand', type: 'text', required: true },
      { id: 'model', label: 'Model', type: 'text', required: true },
      { id: 'reference', label: 'Reference Number', type: 'text', required: false },
      { 
        id: 'material', 
        label: 'Case Material', 
        type: 'select', 
        required: true, 
        options: [
          { value: 'stainless-steel', label: 'Stainless Steel' },
          { value: 'yellow-gold', label: 'Yellow Gold' },
          { value: 'rose-gold', label: 'Rose Gold' },
          { value: 'white-gold', label: 'White Gold' },
          { value: 'platinum', label: 'Platinum' },
          { value: 'titanium', label: 'Titanium' },
          { value: 'ceramic', label: 'Ceramic' },
          { value: 'other', label: 'Other' }
        ]
      },
      { 
        id: 'movement', 
        label: 'Movement', 
        type: 'select', 
        required: true, 
        options: [
          { value: 'automatic', label: 'Automatic' },
          { value: 'manual', label: 'Manual Wind' },
          { value: 'quartz', label: 'Quartz' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'year',
        label: 'Production Year (if known)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 2020 or "circa 1990s"'
      },
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: [
          { value: 'new-unworn', label: 'New/Unworn' },
          { value: 'excellent', label: 'Excellent' },
          { value: 'very-good', label: 'Very Good' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' }
        ]
      },
      {
        id: 'box-papers',
        label: 'Box and Papers',
        type: 'select',
        required: true,
        options: [
          { value: 'complete', label: 'Complete Set (Box & Papers)' },
          { value: 'box-only', label: 'Box Only' },
          { value: 'papers-only', label: 'Papers Only' },
          { value: 'none', label: 'No Box or Papers' }
        ]
      }
    ]
  },
  {
    id: 'handbags',
    label: 'Handbags',
    fields: [
      { id: 'brand', label: 'Brand', type: 'text', required: true },
      { id: 'model', label: 'Model', type: 'text', required: true },
      { 
        id: 'material', 
        label: 'Material', 
        type: 'select', 
        required: true, 
        options: [
          { value: 'leather', label: 'Leather' },
          { value: 'exotic', label: 'Exotic Leather' },
          { value: 'canvas', label: 'Canvas' },
          { value: 'fabric', label: 'Fabric' },
          { value: 'other', label: 'Other' }
        ]
      },
      { id: 'color', label: 'Color', type: 'text', required: true },
      { 
        id: 'size', 
        label: 'Size', 
        type: 'select', 
        required: true, 
        options: [
          { value: 'mini', label: 'Mini' },
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }
        ]
      },
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: [
          { value: 'new', label: 'New/Unused' },
          { value: 'excellent', label: 'Excellent' },
          { value: 'very-good', label: 'Very Good' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' }
        ]
      },
      {
        id: 'accessories',
        label: 'Accessories',
        type: 'select',
        required: true,
        options: [
          { value: 'complete', label: 'Complete Set (Box, Dustbag, Cards)' },
          { value: 'partial', label: 'Partial Accessories' },
          { value: 'none', label: 'No Accessories' }
        ]
      }
    ]
  },
  {
    id: 'jewelry',
    label: 'Jewelry',
    fields: [
      { id: 'type', label: 'Type', type: 'select', required: true, 
        options: [
          { value: 'ring', label: 'Ring' },
          { value: 'bracelet', label: 'Bracelet' },
          { value: 'necklace', label: 'Necklace' },
          { value: 'earrings', label: 'Earrings' },
          { value: 'other', label: 'Other' }
        ]
      },
      { id: 'brand', label: 'Brand (if any)', type: 'text', required: false },
      { 
        id: 'metal', 
        label: 'Metal', 
        type: 'select', 
        required: true, 
        options: [
          { value: 'yellow-gold', label: 'Yellow Gold' },
          { value: 'white-gold', label: 'White Gold' },
          { value: 'rose-gold', label: 'Rose Gold' },
          { value: 'platinum', label: 'Platinum' },
          { value: 'silver', label: 'Silver' },
          { value: 'other', label: 'Other' }
        ]
      },
      { 
        id: 'gemstone', 
        label: 'Primary Gemstone', 
        type: 'select', 
        required: false, 
        options: [
          { value: 'diamond', label: 'Diamond' },
          { value: 'ruby', label: 'Ruby' },
          { value: 'sapphire', label: 'Sapphire' },
          { value: 'emerald', label: 'Emerald' },
          { value: 'pearl', label: 'Pearl' },
          { value: 'other', label: 'Other' },
          { value: 'none', label: 'No Gemstones' }
        ]
      },
      { id: 'carat', label: 'Carat Weight (if known)', type: 'text', required: false },
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: [
          { value: 'new', label: 'New/Unworn' },
          { value: 'excellent', label: 'Excellent' },
          { value: 'very-good', label: 'Very Good' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' }
        ]
      },
      {
        id: 'documentation',
        label: 'Documentation',
        type: 'select',
        required: true,
        options: [
          { value: 'certificate', label: 'Has Certificate/Documents' },
          { value: 'none', label: 'No Documentation' }
        ]
      }
    ]
  },
  {
    id: 'sneakers',
    label: 'Sneakers',
    fields: [
      { id: 'brand', label: 'Brand', type: 'text', required: true },
      { id: 'model', label: 'Model', type: 'text', required: true },
      { id: 'colorway', label: 'Colorway', type: 'text', required: true },
      { 
        id: 'size', 
        label: 'Size (US)', 
        type: 'text', 
        required: true 
      },
      { 
        id: 'condition', 
        label: 'Condition', 
        type: 'select', 
        required: true,
        options: [
          { value: 'new', label: 'New/Deadstock' },
          { value: 'worn-once', label: 'Worn Once' },
          { value: 'slightly-used', label: 'Slightly Used' },
          { value: 'used', label: 'Used' }
        ]
      },
      {
        id: 'packaging',
        label: 'Packaging',
        type: 'select',
        required: true,
        options: [
          { value: 'original-all', label: 'Original Box & All Accessories' },
          { value: 'original-box', label: 'Original Box Only' },
          { value: 'replacement-box', label: 'Replacement Box' },
          { value: 'no-box', label: 'No Box' }
        ]
      }
    ]
  },
  {
    id: 'preciousMetals',
    label: 'Precious Metals',
    fields: [
      { 
        id: 'metalType', 
        label: 'Metal Type', 
        type: 'select', 
        required: true,
        options: [
          { value: 'gold', label: 'Gold' },
          { value: 'silver', label: 'Silver' },
          { value: 'platinum', label: 'Platinum' },
          { value: 'palladium', label: 'Palladium' }
        ]
      },
      { 
        id: 'form', 
        label: 'Form', 
        type: 'select', 
        required: true,
        options: [
          { value: 'bar', label: 'Bar' },
          { value: 'coin', label: 'Coin' },
          { value: 'round', label: 'Round' },
          { value: 'other', label: 'Other' }
        ]
      },
      { id: 'weightValue', label: 'Weight', type: 'text', required: true },
      {
        id: 'weightUnit',
        label: 'Weight Unit',
        type: 'select',
        required: true,
        options: [
          { value: 'g', label: 'Grams (g)' },
          { value: 'kg', label: 'Kilograms (kg)' },
          { value: 'oz', label: 'Ounces (oz)' },
          { value: 'ozt', label: 'Troy Ounces (ozt)' }
        ]
      },
      {
        id: 'purity',
        label: 'Purity',
        type: 'select',
        required: true,
        options: [
          { value: '24k', label: '24K (99.9%)' },
          { value: '22k', label: '22K (91.7%)' },
          { value: '18k', label: '18K (75.0%)' },
          { value: '14k', label: '14K (58.3%)' },
          { value: '999-silver', label: 'Silver (999)' },
          { value: '925-silver', label: 'Silver (925)' },
          { value: 'platinum-999', label: 'Platinum (999)' },
          { value: 'platinum-950', label: 'Platinum (950)' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'certification',
        label: 'Certification',
        type: 'select',
        required: false,
        options: [
          { value: 'yes', label: 'Yes, with assay certificate' },
          { value: 'no', label: 'No certification' }
        ]
      }
    ]
  }
];

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  onSubmit,
  isSubmitting
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setFormData({});
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    const category = categories.find(c => c.id === selectedCategory);
    
    if (!category) {
      newErrors.category = 'Please select a category';
    } else {
      // Check required fields
      category.fields.forEach(field => {
        if (field.required && !formData[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
        }
      });
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the form data
    onSubmit({
      category: selectedCategory,
      ...formData
    });
  };

  const selectedCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Item Category*
        </label>
        <select
          id="category"
          name="category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          required
          className={`block w-full rounded-md border ${
            errors.category ? 'border-red-300' : 'border-gray-300'
          } px-4 py-3 bg-white focus:border-blue-500 focus:ring-blue-500`}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.label}</option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      {/* Dynamic fields based on selected category */}
      {selectedCategoryObj && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">
              {selectedCategoryObj.label} Details
            </h3>
            <p className="text-sm text-blue-700">
              Please provide as much detail as possible for an accurate valuation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {selectedCategoryObj.fields.map(field => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}{field.required ? '*' : ''}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    id={field.id}
                    name={field.id}
                    value={formData[field.id] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                    className={`block w-full rounded-md border ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    } px-4 py-3 bg-white focus:border-blue-500 focus:ring-blue-500`}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    name={field.id}
                    value={formData[field.id] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`block w-full rounded-md border ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    } px-4 py-3 bg-white focus:border-blue-500 focus:ring-blue-500`}
                  />
                ) : (
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    value={formData[field.id] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                    placeholder={field.placeholder}
                    className={`block w-full rounded-md border ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    } px-4 py-3 bg-white focus:border-blue-500 focus:ring-blue-500`}
                  />
                )}
                
                {errors[field.id] && (
                  <p className="mt-1 text-sm text-red-600">{errors[field.id]}</p>
                )}
              </div>
            ))}
          </div>
          
          {/* Additional Details (optional textarea) */}
          <div>
            <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              id="additionalDetails"
              name="additionalDetails"
              value={formData.additionalDetails || ''}
              onChange={handleInputChange}
              rows={4}
              placeholder="Add any other details that might help with valuation (e.g., special features, history, modifications)."
              className="block w-full rounded-md border border-gray-300 px-4 py-3 bg-white focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-lg px-6 py-4 font-medium text-white shadow-sm ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Get Valuation'
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default ManualEntryForm;