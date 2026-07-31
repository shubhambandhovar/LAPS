import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'success' | 'warning' | 'danger';
  animate?: boolean;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'primary', animate = false, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    
    const variants = {
      primary: 'border-transparent bg-primary-500 text-white shadow hover:bg-primary-500/80',
      secondary: 'border-transparent bg-secondary-500 text-white shadow hover:bg-secondary-500/80',
      accent: 'border-transparent bg-accent-500 text-white shadow hover:bg-accent-500/80',
      outline: 'text-primary-700 border border-primary-500',
      success: 'border-transparent bg-success text-white shadow hover:bg-success/80',
      warning: 'border-transparent bg-warning text-white shadow hover:bg-warning/80',
      danger: 'border-transparent bg-danger text-white shadow hover:bg-danger/80',
    };

    const combinedClassName = cn(baseStyles, variants[variant], className);

    if (animate) {
      return (
        <motion.div
          ref={ref}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={combinedClassName}
          {...(props as any)}
        />
      );
    }

    return (
      <div ref={ref} className={combinedClassName} {...props} />
    );
  }
);
Badge.displayName = 'Badge';
