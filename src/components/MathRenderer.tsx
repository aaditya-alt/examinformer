'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  as?: 'div' | 'span';
}

function decodeHtmlEntities(raw: string): string {
  if (!raw) return '';
  let str = String(raw);

  // Replace reasoning and entity artifacts
  str = str.replace(/@amp;?/gi, '&');

  const entityMap: Record<string, string> = {
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&bull;': '•',
    '&lt;': '<',
    '&gt;': '>',
    '&sup2;': '²',
    '&sup3;': '³',
    '&rArr;': '⇒',
    '&lArr;': '⇐',
    '&hArr;': '⇔',
    '&there4;': '∴',
    '&minus;': '−',
    '&times;': '×',
    '&divide;': '÷',
    '&plusmn;': '±',
    '&asymp;': '≈',
    '&ne;': '≠',
    '&le;': '≤',
    '&ge;': '≥',
    '&ang;': '∠',
    '&angle;': '∠',
    '&deg;': '°',
    '&Delta;': 'Δ',
    '&delta;': 'δ',
    '&pi;': 'π',
    '&theta;': 'θ',
    '&alpha;': 'α',
    '&beta;': 'β',
    '&gamma;': 'γ',
    '&infin;': '∞',
    '&sim;': '∼',
    '&cong;': '≅',
    '&perp;': '⊥',
    '&radic;': '√',
    '&Omega;': 'Ω',
    '&pound;': '£',
    '&cent;': '¢',
    '&yen;': '¥',
    '&euro;': '€',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&nbsp;': ' '
  };

  // Multiple passes to unwrap double/triple-encoded entities
  for (let pass = 0; pass < 3; pass++) {
    for (const [ent, rep] of Object.entries(entityMap)) {
      if (str.includes(ent)) {
        str = str.split(ent).join(rep);
      }
    }
    if (str.includes('&amp;')) {
      str = str.replace(/&amp;/g, '&');
    }
    str = str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  }

  // Handle superscripts and subscripts in mathematical notation
  str = str.replace(/<sup>2<\/sup>/gi, '²');
  str = str.replace(/<sup>3<\/sup>/gi, '³');
  str = str.replace(/<sup>4<\/sup>/gi, '⁴');
  str = str.replace(/<sup>5<\/sup>/gi, '⁵');
  str = str.replace(/<sup>6<\/sup>/gi, '⁶');
  str = str.replace(/<sup>([0-9a-zA-Z+-]+)<\/sup>/gi, '^($1)');
  str = str.replace(/<sub>([0-9a-zA-Z+-]+)<\/sub>/gi, '_($1)');

  return str;
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

  // Clean up isolated consecutive single numbers / options stacked vertically (e.g. "2\n3\n4" or "(1)\n(2)\n(3)")
  str = str.replace(/(?:^|\n)(\(?\d{1,2}\)?|\(?[a-dA-D]\)?)\s*\n+(\(?\d{1,2}\)?|\(?[a-dA-D]\)?)(?=\s*\n|$)/g, '$1, $2');
  str = str.replace(/(?:^|\n)(\(?\d{1,2}\)?|\(?[a-dA-D]\)?)\s*\n+(\(?\d{1,2}\)?|\(?[a-dA-D]\)?)(?=\s*\n|$)/g, '$1, $2');

  // Strip stray unescaped short tokens like $s, $3, $2e when not in math formula
  str = str.replace(/\$([a-zA-Z0-9]{1,4})(?![^$]*\$)/g, '$1');

  // Extract images (both Markdown ![alt](url) and HTML <img ...>) into placeholders
  const imagePlaceholders: string[] = [];
  str = str.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/g, (match, alt, url) => {
    const token = `__IMG_PLACEHOLDER_${imagePlaceholders.length}__`;
    imagePlaceholders.push(
      `<span class="block my-2 text-center"><img src="${url}" alt="${alt || 'Diagram'}" class="max-h-72 max-w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white object-contain inline-block p-1.5 shadow-2xs" loading="lazy" /></span>`
    );
    return token;
  });

  str = str.replace(/<img\s+[^>]*?src=["'](https?:\/\/[^"']+)["'][^>]*?\/?>/gi, (match, url) => {
    const token = `__IMG_PLACEHOLDER_${imagePlaceholders.length}__`;
    imagePlaceholders.push(
      `<span class="block my-2 text-center"><img src="${url}" alt="Diagram" class="max-h-72 max-w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white object-contain inline-block p-1.5 shadow-2xs" loading="lazy" /></span>`
    );
    return token;
  });

  // Extract KaTeX mathematical formulas into placeholders:
  // Supports \(...\), $$, and inline $...$
  const mathPlaceholders: string[] = [];
  str = str.replace(/(\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$([^\$\n]{1,120})\$)/g, (match, p1, p2) => {
    let rendered = match;
    try {
      if (match.startsWith('\\(') && match.endsWith('\\)')) {
        const formula = match.slice(2, -2);
        rendered = katex.renderToString(formula, { displayMode: false, throwOnError: false });
      } else if (match.startsWith('$$') && match.endsWith('$$')) {
        const formula = match.slice(2, -2);
        rendered = `<div class="my-2">${katex.renderToString(formula, { displayMode: true, throwOnError: false })}</div>`;
      } else if (match.startsWith('$') && match.endsWith('$') && p2) {
        rendered = katex.renderToString(p2.trim(), { displayMode: false, throwOnError: false });
      }
    } catch {
      rendered = match;
    }
    const token = `__MATH_PLACEHOLDER_${mathPlaceholders.length}__`;
    mathPlaceholders.push(rendered);
    return token;
  });

  // Convert plain text squares/cubes into proper superscripts:
  // 1. Metric units (cm2 -> cm², m2 -> m², etc.)
  str = str.replace(/\b(cm|mm|m|km|ft|in|sec|s)2\b/gi, '$1<sup>2</sup>');
  str = str.replace(/\b(cm|mm|m|km|ft|in)3\b/gi, '$1<sup>3</sup>');
  // 2. Algebraic expressions like x^2, y^2, (a+b)^2 -> x<sup>2</sup>
  str = str.replace(/\b([a-zA-Z\(\)])\^([0-9\+\-n]+)\b/g, '$1<sup>$2</sup>');
  // 3. Mathematical variables written as x2, y2, a2, b2 before operators
  str = str.replace(/\b([a-zA-Z])2(?=\s*[\+\-\*\/\=\,\)]|\s*$|\s+(?:is|equals|equal))/g, '$1<sup>2</sup>');
  str = str.replace(/\b([a-zA-Z])3(?=\s*[\+\-\*\/\=\,\)]|\s*$|\s+(?:is|equals|equal))/g, '$1<sup>3</sup>');
  str = str.replace(/(sin|cos|tan|cot|sec|cosec)2\b/gi, '$1<sup>2</sup>');
  // 4. Unicode superscripts to HTML <sup>
  str = str.replace(/²/g, '<sup>2</sup>');
  str = str.replace(/³/g, '<sup>3</sup>');
  str = str.replace(/⁴/g, '<sup>4</sup>');

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

  // Re-inject rendered image blocks
  for (let i = 0; i < imagePlaceholders.length; i++) {
    str = str.replace(`__IMG_PLACEHOLDER_${i}__`, imagePlaceholders[i]);
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
