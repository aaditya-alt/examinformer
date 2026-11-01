'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  as?: 'div' | 'span';
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&rArr;/g, '⇒')
    .replace(/&lArr;/g, '⇐')
    .replace(/&hArr;/g, '⇔')
    .replace(/&there4;/g, '∴')
    .replace(/&minus;/g, '−')
    .replace(/&plusmn;/g, '±')
    .replace(/&asymp;/g, '≈')
    .replace(/&ne;/g, '≠')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&deg;/g, '°')
    .replace(/&Omega;/g, 'Ω')
    .replace(/&pound;/g, '£')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Robustly parses and formats KaTeX math formulas and markdown styling
 * into a single unified, valid, and crash-proof HTML markup.
 */
function renderMathAndMarkdownToHtml(content: string): string {
  if (!content) return '';
  let str = decodeHtmlEntities(typeof content === 'string' ? content : String(content));

  // Normalize tabs and excessive whitespace
  str = str.replace(/\t+/g, ' ');
  str = str.replace(/^[ \t]+$/gm, '');
  str = str.replace(/(?:\r?\n[ \t]*){2,}/g, '\n\n');
  str = str
    .split('\n')
    .map((l) => l.trim())
    .join('\n');
  str = str.replace(/\n{2,}/g, '\n\n').trim();

  // Strip stray unescaped short tokens like $s, $3, $2e when not in math formula
  str = str.replace(/\$([a-zA-Z0-9]{1,4})(?![^$]*\$)/g, '$1');

  // Extract KaTeX mathematical formulas into placeholders
  const mathPlaceholders: string[] = [];
  str = str.replace(/(\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$)/g, (match) => {
    let rendered = match;
    try {
      if (match.startsWith('\\(') && match.endsWith('\\)')) {
        const formula = match.slice(2, -2);
        rendered = katex.renderToString(formula, { displayMode: false, throwOnError: false });
      } else if (match.startsWith('$$') && match.endsWith('$$')) {
        const formula = match.slice(2, -2);
        rendered = `<div class="my-2">${katex.renderToString(formula, { displayMode: true, throwOnError: false })}</div>`;
      }
    } catch {
      rendered = match;
    }
    const token = `__MATH_PLACEHOLDER_${mathPlaceholders.length}__`;
    mathPlaceholders.push(rendered);
    return token;
  });

  // Markdown styling transformations
  str = str.replace(/^####\s+(.*)$/gm, '<div class="font-bold text-xs uppercase tracking-wider text-sky-700 dark:text-sky-400 mt-2 mb-1">$1</div>');
  str = str.replace(/^###\s+(.*)$/gm, '<div class="font-extrabold text-sm text-slate-900 dark:text-white mt-2.5 mb-1">$1</div>');
  str = str.replace(/^##\s+(.*)$/gm, '<div class="font-black text-base text-slate-900 dark:text-white mt-3 mb-1.5">$1</div>');
  str = str.replace(/^>\s+(.*)$/gm, '<div class="my-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-400 text-xs text-amber-950 dark:text-amber-200 rounded-r font-medium">$1</div>');
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  str = str.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>');
  str = str.replace(/^[-•]\s+(.*)$/gm, '<div class="flex items-start gap-1.5 my-0.5"><span class="text-sky-500 font-bold shrink-0">•</span><span>$1</span></div>');
  str = str.replace(/^(\d+)\.\s+(.*)$/gm, '<div class="flex items-start gap-1.5 my-0.5"><span class="font-bold text-slate-500 shrink-0">$1.</span><span>$2</span></div>');
  str = str.replace(/[#*]/g, '');

  // Convert newlines into single <br /> without huge gaps
  str = str.replace(/(<\/div>)\s*\n+/gi, '$1');
  str = str.replace(/\n+\s*(<div)/gi, '$1');
  str = str.replace(/\n\n+/g, '<br />');
  str = str.replace(/\n/g, '<br />');
  str = str.replace(/(<br\s*\/?>){2,}/gi, '<br />');

  // Re-inject rendered KaTeX blocks
  for (let i = 0; i < mathPlaceholders.length; i++) {
    str = str.replace(`__MATH_PLACEHOLDER_${i}__`, mathPlaceholders[i]);
  }

  return str;
}

export function MathRenderer({ content, className = '', as = 'span' }: MathRendererProps) {
  const html = useMemo(() => {
    try {
      return renderMathAndMarkdownToHtml(content);
    } catch (e) {
      console.warn('MathRenderer parsing fallback:', e);
      return typeof content === 'string' ? content : String(content || '');
    }
  }, [content]);

  if (!content) return null;

  if (as === 'div') {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
