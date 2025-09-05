'use client';

import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  disabled?: boolean;
}

export default function Tooltip({ content, children, disabled = false }: TooltipProps) {
  const [show, setShow] = useState(false);

  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}