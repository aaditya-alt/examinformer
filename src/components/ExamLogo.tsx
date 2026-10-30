import React from 'react';

interface ExamLogoProps {
  type: 'ssc' | 'rrb' | 'combo';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ExamLogo({ type, size = 'md', className = '' }: ExamLogoProps) {
  const sizeMap = {
    xs: 'w-6 h-6 p-0.5',
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-1.5',
    lg: 'w-14 h-14 p-2',
    xl: 'w-16 h-16 p-2.5',
  };

  const badgeWrapper = "rounded-full bg-white dark:bg-slate-100 shadow-md border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 transition-transform hover:scale-105";

  if (type === 'combo') {
    return (
      <div className={`flex items-center -space-x-2 ${className}`}>
        <div className={`${sizeMap[size]} ${badgeWrapper} z-10 ring-2 ring-blue-500/20`}>
          <img
            src="/ssc-logo.png"
            alt="SSC Official Emblem"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <div className={`${sizeMap[size]} ${badgeWrapper} ring-2 ring-emerald-500/20`}>
          <img
            src="/rrb-logo.png"
            alt="RRB Official Emblem"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>
    );
  }

  const logoSrc = type === 'rrb' ? '/rrb-logo.png' : '/ssc-logo.png';
  const altText = type === 'rrb' ? 'Railway Recruitment Boards' : 'Staff Selection Commission';
  const ringColor = type === 'rrb' ? 'ring-emerald-500/30' : 'ring-blue-500/30';

  return (
    <div className={`${sizeMap[size]} ${badgeWrapper} ring-2 ${ringColor} ${className}`}>
      <img
        src={logoSrc}
        alt={altText}
        className="w-full h-full object-contain rounded-full"
      />
    </div>
  );
}
