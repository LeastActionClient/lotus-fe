import React from 'react';
import { Button } from './Button';

const Pagination = ({ page, totalPages, onPageChange, className = '' }) => {
  if (!totalPages || totalPages <= 1) return null;

  const visiblePages = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={`flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="text-sm text-gray-500 text-center sm:text-left">
        Page {page} of {totalPages}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        {visiblePages().map((item, index) => (
          item === '...' ? (
            <span key={`gap-${index}`} className="px-2 text-sm text-gray-400">...</span>
          ) : (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={item === page ? 'default' : 'outline'}
              onClick={() => onPageChange(item)}
              className={item === page ? 'bg-blue-600 hover:bg-blue-700 text-white border-0' : ''}
            >
              {item}
            </Button>
          )
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
