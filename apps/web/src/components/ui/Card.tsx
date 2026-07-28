import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-surface-card border border-surface-border rounded-xl shadow-sm p-6 ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-xl font-heading font-semibold text-primary-700">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-6 pt-4 border-t border-surface-border">{footer}</div>}
    </div>
  );
};
