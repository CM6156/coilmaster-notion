import { useState, useEffect } from 'react';

interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
  isHighDPI: boolean;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  large: 1536,
} as const;

export function useResponsive(): ResponsiveBreakpoints {
  const [responsive, setResponsive] = useState<ResponsiveBreakpoints>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLarge: false,
        screenWidth: 1200,
        screenHeight: 800,
        orientation: 'landscape',
        isTouchDevice: false,
        isHighDPI: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.large,
      isLarge: width >= BREAKPOINTS.large,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isHighDPI: window.devicePixelRatio > 1.5,
    };
  });

  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setResponsive({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.large,
        isLarge: width >= BREAKPOINTS.large,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isHighDPI: window.devicePixelRatio > 1.5,
      });
    };

    window.addEventListener('resize', updateResponsive);
    window.addEventListener('orientationchange', updateResponsive);
    
    // 초기 실행
    updateResponsive();

    return () => {
      window.removeEventListener('resize', updateResponsive);
      window.removeEventListener('orientationchange', updateResponsive);
    };
  }, []);

  return responsive;
}

// 특정 디바이스 타입만 필요한 경우 사용할 수 있는 개별 훅들
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useResponsive();
  return isTablet;
}

export function useIsDesktop(): boolean {
  const { isDesktop, isLarge } = useResponsive();
  return isDesktop || isLarge;
}

export function useIsTouchDevice(): boolean {
  const { isTouchDevice } = useResponsive();
  return isTouchDevice;
} 