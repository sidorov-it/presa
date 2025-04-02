import React, { ButtonHTMLAttributes, AnchorHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ThemedHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const ThemedHeading = ({ 
  as: Component = 'h2', 
  className, 
  children, 
  ...props 
}: ThemedHeadingProps) => {
  return (
    <Component 
      className={cn('themed-heading', className)} 
      {...props}
    >
      {children}
    </Component>
  );
};

export const ThemedText = ({ 
  className, 
  children, 
  ...props 
}: HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p 
      className={cn('themed-text', className)} 
      {...props}
    >
      {children}
    </p>
  );
};

interface ThemedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pill' | 'rounded' | 'square';
}

export const ThemedButton = ({ 
  className, 
  variant = 'rounded', 
  children, 
  ...props 
}: ThemedButtonProps) => {
  return (
    <button 
      className={cn('themed-button', variant, className)} 
      {...props}
    >
      {children}
    </button>
  );
};

export const ThemedLink = ({ 
  className, 
  children, 
  ...props 
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return (
    <a 
      className={cn('themed-link', className)} 
      {...props}
    >
      {children}
    </a>
  );
};

export const ThemedCard = ({ 
  className, 
  children, 
  ...props 
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={cn('themed-card p-4', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

export const ThemedBlock = ({ 
  className, 
  children, 
  ...props 
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={cn('themed-block', className)} 
      {...props}
    >
      {children}
    </div>
  );
}; 