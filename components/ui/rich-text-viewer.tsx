'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RichTextViewerProps {
  content: string;
  className?: string;
}

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  if (!content) {
    return null;
  }

  return (
    <div 
      className={cn(
        'prose prose-sm max-w-none',
        'prose-p:mb-2 prose-p:mt-0',
        'prose-strong:font-semibold',
        'prose-em:italic',
        'prose-underline:underline',
        'prose-strike:line-through',
        'prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800',
        'prose-mark:bg-yellow-200 prose-mark:px-1 prose-mark:py-0.5 prose-mark:rounded',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
} 