import React from 'react';
import { cn } from '../../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'alternate' | 'primary' | 'dark';
  containerSize?: 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, children, variant = 'default', containerSize = 'lg', animate = false, ...props }, ref) => {
    
    const variants = {
      default: 'bg-white',
      alternate: 'bg-surface-bg',
      primary: 'bg-primary-500 text-white',
      dark: 'bg-slate-900 text-white',
    };

    const sizes = {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      full: 'max-w-full px-0',
    };

    const containerClasses = cn(
      'mx-auto w-full px-4 sm:px-6 lg:px-8',
      sizes[containerSize],
      containerSize === 'full' ? 'px-0 sm:px-0 lg:px-0' : ''
    );

    const sectionClasses = cn('py-16 md:py-24', variants[variant], className);

    const content = (
      <div className={containerClasses}>
        {children}
      </div>
    );

    if (animate) {
      return (
        <motion.section
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={sectionClasses}
          {...(props as HTMLMotionProps<"section">)}
        >
          {content}
        </motion.section>
      );
    }

    return (
      <section ref={ref} className={sectionClasses} {...props}>
        {content}
      </section>
    );
  }
);
Section.displayName = 'Section';
