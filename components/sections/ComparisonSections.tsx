// app/components/sections/ComparisonSections.tsx
import React, { useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';

// Types
export interface ComparisonFeature {
  name: string;
  auricore: boolean;
  [key: string]: any;
}

export interface CompetitorOption {
  id: string;
  name: string;
}

// Mobile comparison tabs component
export const MobileComparisonTabs: React.FC<{
  activeOption: string;
  options: CompetitorOption[];
  setActiveOption: (id: string) => void;
}> = ({ activeOption, options, setActiveOption }) => (
  <div className="flex overflow-x-auto pb-2 mb-4 md:hidden">
    <div className="flex space-x-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => setActiveOption(option.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${
            activeOption === option.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  </div>
);

// Auricore advantages component for mobile
export const AuricoreAdvantages: React.FC<{
  features: ComparisonFeature[];
  competitorOptions: CompetitorOption[];
}> = ({ features, competitorOptions }) => {
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
  const auricoreAdvantages = features.filter((f) => f.auricore);

  return (
    <div className="md:hidden">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 p-4">
          <h3 className="text-white font-medium text-center">Auricore Advantages</h3>
        </div>
        {auricoreAdvantages.map((feature, idx) => (
          <div key={idx}>
            <div
              className={`flex items-center justify-between p-4 cursor-pointer ${
                idx !== auricoreAdvantages.length - 1 ? 'border-b border-gray-100' : ''
              } ${selectedFeature === idx ? 'bg-blue-50' : ''}`}
              onClick={() =>
                setSelectedFeature(selectedFeature === idx ? null : idx)
              }
            >
              <div className="text-gray-800 font-medium flex-1">{feature.name}</div>
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-green-50 rounded-full mr-2">
                  <Check className="w-4 h-4 text-green-600" />
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedFeature === idx ? 'transform rotate-180' : ''
                  }`}
                />
              </div>
            </div>
            {selectedFeature === idx && (
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-3">How competitors compare:</p>
                <div className="space-y-2">
                  {competitorOptions
                    .filter((opt) => opt.id !== 'auricore')
                    .map((competitor) => (
                      <div
                        key={competitor.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">{competitor.name}</span>
                        {feature[competitor.id] ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-50 rounded-full">
                            <Check className="w-3 h-3 text-green-600" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-50 rounded-full">
                            <X className="w-3 h-3 text-red-500" />
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="bg-gray-50 p-3 text-center text-xs text-gray-500">
          *Based on industry research as of April 2025
        </div>
      </div>
    </div>
  );
};

// Borrower comparison section
export const BorrowerComparisonSection: React.FC = () => {
  const borrowerOptions: CompetitorOption[] = [
    { id: 'auricore', name: 'Auricore' },
    { id: 'pawnShops', name: 'Pawn Shops' },
    { id: 'personalLoans', name: 'Personal Loans' },
    { id: 'luxuryPawnShops', name: 'Luxury Pawn Shops' },
  ];

  const borrowerComparison: ComparisonFeature[] = [
    { name: 'Item stays with you', auricore: true, pawnShops: false, personalLoans: false, luxuryPawnShops: false },
    { name: '2.6% - 3% monthly rate or less', auricore: true, pawnShops: false, personalLoans: false, luxuryPawnShops: false },
    { name: 'AI-powered valuation', auricore: true, pawnShops: false, personalLoans: false, luxuryPawnShops: false },
    { name: 'No credit impact on default', auricore: true, pawnShops: true, personalLoans: false, luxuryPawnShops: true },
    { name: 'Transparent fees', auricore: true, pawnShops: false, personalLoans: true, luxuryPawnShops: false },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">How We Compare</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Our innovative approach offers advantages that traditional options can't match.
          </p>
        </div>

        {/* Mobile */}
        <AuricoreAdvantages
          features={borrowerComparison}
          competitorOptions={borrowerOptions}
        />

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="grid grid-cols-5 bg-gray-100 p-4 text-center font-medium text-gray-900">
              <div className="text-left">Features</div>
              <div>Auricore</div>
              <div>Pawn Shops</div>
              <div>Personal Loans</div>
              <div>Luxury Pawn Shops</div>
            </div>
            {borrowerComparison.map((item, idx) => {
              const checkOrX = (val: boolean) =>
                val ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-green-50 rounded-full">
                    <Check className="w-4 h-4 text-green-600" />
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-red-50 rounded-full">
                    <X className="w-4 h-4 text-red-500" />
                  </span>
                );
              return (
                <div
                  key={idx}
                  className="grid grid-cols-5 p-4 border-t border-gray-100 text-center text-gray-700"
                >
                  <div className="text-left">{item.name}</div>
                  <div>{checkOrX(item.auricore)}</div>
                  <div>{checkOrX(item.pawnShops)}</div>
                  <div>{checkOrX(item.personalLoans)}</div>
                  <div>{checkOrX(item.luxuryPawnShops)}</div>
                </div>
              );
            })}
            <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
              *Based on industry research as of April 2025
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Lender comparison section
export const LenderComparisonSection: React.FC = () => {
  const lenderOptions: CompetitorOption[] = [
    { id: 'auricore', name: 'Auricore' },
    { id: 'tradP2P', name: 'Other P2P' },
    { id: 'bankSavings', name: 'Bank Savings' },
    { id: 'stockMarket', name: 'Stock Market' },
  ];

  const lenderComparison: ComparisonFeature[] = [
    { name: '8-10% annual returns', auricore: true, tradP2P: false, bankSavings: false, stockMarket: true },
    { name: 'Asset-backed security', auricore: true, tradP2P: false, bankSavings: false, stockMarket: false },
    { name: 'GPS tracking', auricore: true, tradP2P: false, bankSavings: false, stockMarket: false },
    { name: 'Default protection', auricore: true, tradP2P: false, bankSavings: true, stockMarket: false },
    { name: 'AI valuation tech', auricore: true, tradP2P: false, bankSavings: false, stockMarket: false },
    { name: 'Low risk', auricore: true, tradP2P: false, bankSavings: true, stockMarket: false },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">
            Higher Returns, Better Security
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            See how Auricore stacks up against other investment options in today's market.
          </p>
        </div>

        {/* Mobile */}
        <AuricoreAdvantages
          features={lenderComparison}
          competitorOptions={lenderOptions}
        />

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="grid grid-cols-5 bg-gray-100 p-4 text-center font-medium text-gray-900">
              <div className="text-left">Features</div>
              <div>Auricore</div>
              <div>Other P2P Lending</div>
              <div>Bank Savings</div>
              <div>Stock Market</div>
            </div>
            {lenderComparison.map((item, idx) => {
              const checkOrX = (val: boolean) =>
                val ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-green-50 rounded-full">
                    <Check className="w-4 h-4 text-green-600" />
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-red-50 rounded-full">
                    <X className="w-4 h-4 text-red-500" />
                  </span>
                );
              return (
                <div
                  key={idx}
                  className="grid grid-cols-5 p-4 border-t border-gray-100 text-center text-gray-700"
                >
                  <div className="text-left">{item.name}</div>
                  <div>{checkOrX(item.auricore)}</div>
                  <div>{checkOrX(item.tradP2P)}</div>
                  <div>{checkOrX(item.bankSavings)}</div>
                  <div>{checkOrX(item.stockMarket)}</div>
                </div>
              );
            })}
            <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
              *Based on industry research as of April 2025
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};