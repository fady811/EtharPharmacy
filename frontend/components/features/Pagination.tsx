'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Pagination as PaginationType } from '@/types';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { current_page, total_pages, has_next, has_previous } = pagination;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
      return pages;
    }

    let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < total_pages) {
      if (endPage < total_pages - 1) pages.push('...');
      pages.push(total_pages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
      <div className="text-sm text-gray-600">
        Page {current_page} of {total_pages} ({pagination.total_items} items)
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page - 1)}
          disabled={!has_previous}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <Button
              key={index}
              variant={page === current_page ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2 text-gray-400">
              {page}
            </span>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page + 1)}
          disabled={!has_next}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
