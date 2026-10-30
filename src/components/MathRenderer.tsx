'use client';

import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders text containing LaTeX math formulas (e.g. \( ... \) or $$ ... $$)
 */
export function MathRenderer({ content, className = '' }: MathRendererProps) {
  if (!content) return null;

  // Split by inline math \( ... \) or display math $$ ... $$
  const parts = content.split(/(\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={index}>{part}</span>;
          }
        } else if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <div key={index} className="my-2" dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={index}>{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
