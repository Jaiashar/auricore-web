// app/components/ui/Button.tsx
import React from 'react';
import Link from 'next/link';

// Types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  href?: string;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

// Shared Button component
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  href,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}) => {
  const base =
    'py-2 sm:py-3 px-4 sm:px-6 font-medium rounded-lg transition-all duration-300 flex items-center justify-center text-sm sm:text-base';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg',
    secondary:
      'bg-white hover:bg-gray-100 text-blue-600 border border-blue-200 hover:border-blue-300',
    outline:
      'bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-300',
    text: 'bg-transparent hover:bg-blue-50 text-blue-600 underline-offset-2 hover:underline',
  };

  const content = (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );

  return href ? (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  ) : (
    content
  );
};