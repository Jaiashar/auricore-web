// app/components/sections/FAQSection.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  anchorId?: string;
  faqData?: FAQItem[];
}

const FAQItemComponent: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen }) => (
  <div className="border-b border-gray-200 py-4">
    <button className="flex justify-between items-center w-full text-left" onClick={toggleOpen}>
      <h3 className="text-lg font-medium text-gray-900">{question}</h3>
      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="mt-2 text-gray-600 animate-fadeIn">
        {answer}
      </div>
    )}
  </div>
);

export const FAQSection: React.FC<FAQSectionProps> = ({ 
  title = "Frequently Asked Questions",
  subtitle = "Get answers to common questions about our asset-backed lending process",
  tagline = "Common Questions",
  anchorId = "faq",
  faqData
}) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const toggleFAQ = (i: number) => setExpandedFAQ(expandedFAQ === i ? null : i);

  // Default FAQ data for borrowers if none provided
  const defaultFaqData: FAQItem[] = [
    {
      question: 'How much can I get for my items?',
      answer:
        'You can get up to 70% of your item`s authenticated market value. E.g., a $10,000 watch → $7,000 funding.'
    },
    {
      question: "What if I don't repurchase?",
      answer:
        'No repayment required. If you don`t buy back, we collect the item with no credit impact.'
    },
    {
      question: 'Consequences of tampering?',
      answer:
        'Tampering triggers credit bureau reporting and possible legal action via GPS/tamper detection.'
    },
    {
      question: 'What fees apply?',
      answer:
        'One-time 3% onboarding fee. We offer the industry`s lowest interest rates; no hidden fees.'
    },
    {
      question: 'Will this affect my credit?',
      answer:
        'Soft credit check only—no score impact. Default with return has no credit consequence.'
    },
    {
      question: 'How long does it take?',
      answer:
        'Application to funding in 1–2 days, including item authentication and smart box setup.'
    },
    {
      question: 'Can I break my lease early?',
      answer:
        'Yes—break anytime for a fee, extend lease, or repurchase during the term for maximum flexibility.'
    }
  ];

  // Use provided FAQ data or default to borrower FAQs
  const displayFaqData = faqData || defaultFaqData;

  return (
    <section id={anchorId} className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 mb-4 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm">
            {tagline}
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">{title}</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="space-y-4">
            {displayFaqData.map((faq, i) => (
              <FAQItemComponent
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={expandedFAQ === i}
                toggleOpen={() => toggleFAQ(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};