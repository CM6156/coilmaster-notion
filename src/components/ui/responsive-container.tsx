import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  containerType?: 'inline-size' | 'size' | 'normal';
  containerName?: string;
}

/**
 * 컨테이너 쿼리를 활용한 반응형 컨테이너
 * @container 쿼리를 사용하여 부모 컨테이너 크기에 따라 반응
 */
export function ResponsiveContainer({ 
  children, 
  className, 
  containerType = 'inline-size',
  containerName 
}: ResponsiveContainerProps) {
  const containerStyle = {
    containerType,
    containerName,
  };

  return (
    <div 
      className={cn(
        // 기본 컨테이너 스타일
        'w-full',
        // 컨테이너 쿼리 지원
        '@container',
        // 모바일 우선 반응형
        'space-y-2 @sm:space-y-3 @md:space-y-4 @lg:space-y-6',
        // 패딩 조정
        'p-3 @sm:p-4 @md:p-5 @lg:p-6 @xl:p-8',
        className
      )}
      style={containerStyle}
    >
      {children}
    </div>
  );
}

/**
 * 반응형 그리드 컨테이너
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: string;
  gap?: string;
}

export function ResponsiveGrid({ 
  children, 
  className,
  minItemWidth = '250px',
  gap = '1rem'
}: ResponsiveGridProps) {
  return (
    <div 
      className={cn(
        'grid',
        // 자동 반응형 그리드
        '@container',
        // 컨테이너 쿼리 기반 그리드
        'grid-cols-1',
        '@sm:grid-cols-2', 
        '@lg:grid-cols-3',
        '@xl:grid-cols-4',
        '@2xl:grid-cols-5',
        // 간격 조정
        'gap-3 @sm:gap-4 @md:gap-5 @lg:gap-6',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 반응형 카드 컴포넌트
 */
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
}

export function ResponsiveCard({ 
  children, 
  className, 
  hover = true,
  clickable = false 
}: ResponsiveCardProps) {
  return (
    <div 
      className={cn(
        // 기본 카드 스타일
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        // 반응형 패딩
        'p-3 sm:p-4 md:p-5 lg:p-6',
        // 반응형 그림자
        'shadow-sm hover:shadow-md @lg:hover:shadow-lg',
        // 터치 최적화
        clickable && 'touch-optimized cursor-pointer',
        // 호버 효과
        hover && 'transition-all duration-200 ease-in-out',
        hover && 'hover:scale-[1.02] @lg:hover:scale-[1.03]',
        // 포커스 표시
        clickable && 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        // 방문한 링크 스타일 (링크 카드인 경우)
        'visited:border-purple-300 dark:visited:border-purple-600',
        className
      )}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
    >
      {children}
    </div>
  );
}

/**
 * 반응형 텍스트 컴포넌트
 */
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
  responsive?: boolean;
}

export function ResponsiveText({ 
  children, 
  size = 'base', 
  className,
  responsive = true 
}: ResponsiveTextProps) {
  const responsiveClasses = responsive ? {
    'xs': 'text-xs @sm:text-sm @md:text-base',
    'sm': 'text-sm @sm:text-base @md:text-lg',
    'base': 'text-base @sm:text-lg @md:text-xl',
    'lg': 'text-lg @sm:text-xl @md:text-2xl',
    'xl': 'text-xl @sm:text-2xl @md:text-3xl',
    '2xl': 'text-2xl @sm:text-3xl @md:text-4xl',
    '3xl': 'text-3xl @sm:text-4xl @md:text-5xl',
    '4xl': 'text-4xl @sm:text-5xl @md:text-6xl',
    '5xl': 'text-5xl @sm:text-6xl @md:text-7xl',
  } : {
    'xs': 'text-xs',
    'sm': 'text-sm', 
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
  };

  return (
    <span className={cn(responsiveClasses[size], className)}>
      {children}
    </span>
  );
} 