// components/sections/ItemPreview.tsx
import React from 'react';
import { Search, CheckCircle, XCircle, Edit2 } from 'lucide-react';

interface ItemPreviewProps {
  item: any | null;
  isLoading: boolean;
  uploadedImage: string | null;
  processingStage?: 'initial' | 'uploading' | 'identifying' | 'extracting' | 'complete';
}

export const ItemPreview: React.FC<ItemPreviewProps> = ({
  item,
  isLoading,
  uploadedImage,
  processingStage = 'initial'
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              <div className="h-4 bg-gray-200 rounded col-span-2"></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              <div className="h-4 bg-gray-200 rounded col-span-2"></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              <div className="h-4 bg-gray-200 rounded col-span-2"></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              <div className="h-4 bg-gray-200 rounded col-span-2"></div>
            </div>
          </div>
          
          <div className="mt-6 h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
        {uploadedImage ? (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing your photo</h3>
            <p className="text-gray-600">
              {processingStage === 'uploading' && 'Uploading your photo...'}
              {processingStage === 'identifying' && 'Identifying your item using AI...'}
              {processingStage === 'extracting' && 'Extracting detailed information...'}
              {processingStage === 'initial' && 'Please wait while our AI identifies your item.'}
            </p>
            
            {processingStage !== 'initial' && processingStage !== 'complete' && (
              <div className="w-full max-w-xs mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ 
                      width: processingStage === 'uploading' ? '25%' : 
                             processingStage === 'identifying' ? '50%' : 
                             processingStage === 'extracting' ? '75%' : '100%' 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Upload</span>
                  <span>Identify</span>
                  <span>Extract</span>
                  <span>Price</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No item identified yet</h3>
            <p className="text-gray-600">
              Upload a photo of your luxury item to get started.
            </p>
          </>
        )}
      </div>
    );
  }

  // Display identified item details
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 h-full">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {item.brand} {item.model}
          </h3>
          <p className="text-sm text-gray-500">{item.type}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex justify-between items-center">
            <div className="text-sm text-blue-700">Estimated Value</div>
            <div className="text-lg font-bold text-blue-800">{item.estimatedValue}</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-gray-500">Condition</div>
          <div className="col-span-2 text-sm text-gray-900 flex items-center">
            {item.condition}
            <button className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
              <Edit2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="text-sm font-medium text-gray-500">Year</div>
          <div className="col-span-2 text-sm text-gray-900 flex items-center">
            {item.year}
            <button className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
              <Edit2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        {item.details && Object.entries(item.details).map(([key, value]: [string, any]) => (
          <div key={key} className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-gray-500">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <div className="col-span-2 text-sm text-gray-900 flex items-center">
              {value}
              <button className="ml-2 p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50">
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center">
        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
        <span className="text-xs text-gray-500">
          AI-powered identification complete
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        * Value estimate is based on market data and item condition
      </div>
    </div>
  );
};