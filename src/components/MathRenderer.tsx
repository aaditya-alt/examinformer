'use client';

import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Cleanly formats markdown syntax (headings, bold, lists, callout boxes)
 * and strips unsightly raw '#' or '*' artifacts.
 */
function cleanMarkdown(text: string): string {
  if (!text) return '';
  let res = text;
  // Replace markdown headings (most specific first)
  res = res.replace(/^####\s*(.*)$/gm, '<div class="font-bold text-xs uppercase tracking-wider text-sky-700 dark:text-sky-400 mt-2 mb-1">$1</div>');
  res = res.replace(/^###\s*(.*)$/gm, '<div class="font-extrabold text-sm text-slate-900 dark:text-white mt-2.5 mb-1">$1</div>');
  res = res.replace(/^##\s*(.*)$/gm, '<div class="font-black text-base text-slate-900 dark:text-white mt-3 mb-1.5">$1</div>');
  // Replace blockquotes (> Trick / Tip)
  res = res.replace(/^>\s*(.*)$/gm, '<div class="my-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-400 text-xs text-amber-950 dark:text-amber-200 rounded-r font-medium">$1</div>');
  // Replace bold
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  // Replace italic
  res = res.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>');
  // Replace list items
  res = res.replace(/^[-•]\s+(.*)$/gm, '<div class="flex items-start gap-1.5 my-1"><span class="text-sky-500 font-bold shrink-0">•</span><span>$1</span></div>');
  // Replace numbered list items
  res = res.replace(/^(\d+)\.\s+(.*)$/gm, '<div class="flex items-start gap-1.5 my-1"><span class="font-bold text-slate-500 shrink-0">$1.</span><span>$2</span></div>');
  // Strip any leftover stray # or *
  res = res.replace(/[#*]/g, '');
  return res;
}

/**
 * MathRenderer: Renders text containing LaTeX math formulas (e.g. \( ... \) or $$ ... $$)
 * and properly converts HTML line breaks (<br>, <br/>, \n) and markdown into rich, elegant DOM.
 */
export function MathRenderer({ content, className = '' }: MathRendererProps) {
  if (!content) return null;

  // Split by inline math \( ... \) or display math $$ ... $$
  const parts = content.split(/(\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Inline KaTeX math
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={index}>{part}</span>;
          }
        }
        
        // Display KaTeX math
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <div key={index} className="my-2" dangerouslySetInnerHTML={{ __html: html }} />;
          } catch {
            return <span key={index}>{part}</span>;
          }
        }

        // Clean markdown formatting (headings, bold, lists, and strip stray # and *)
        const cleanedHtml = cleanMarkdown(part);

        // Regular text: split by HTML line breaks or newlines
        const textSegments = cleanedHtml.split(/(<br\s*\/?>|\r?\n)/gi);
        return (
          <span key={index}>
            {textSegments.map((seg, sIdx) => {
              if (/^<br\s*\/?>$/i.test(seg) || seg === '\n' || seg === '\r\n') {
                return <br key={sIdx} />;
              }
              return <span key={sIdx} dangerouslySetInnerHTML={{ __html: seg }} />;
            })}
          </span>
        );
      })}
    </span>
  );
}
