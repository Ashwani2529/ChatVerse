import React from 'react';

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

const Spinner = ({ size = 'md', className = '', label = 'Loading' }) => (
  <span
    role="status"
    aria-label={label}
    className={`inline-block animate-spin rounded-full border-current border-r-transparent ${sizes[size]} ${className}`}
  />
);

export default Spinner;
