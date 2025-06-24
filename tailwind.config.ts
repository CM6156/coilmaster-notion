
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem',
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px'
			}
		},
		screens: {
			'xs': '475px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
			'3xl': '1920px',
			// 모바일 우선 미디어 쿼리
			'mobile': {'max': '767px'},
			'tablet': {'min': '768px', 'max': '1023px'},
			'desktop': {'min': '1024px'},
			// 터치 디바이스
			'touch': {'raw': '(hover: none) and (pointer: coarse)'},
			// 고해상도 디스플레이
			'retina': {'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'},
		},
		extend: {
			// 컨테이너 쿼리 설정
			containers: {
				'xs': '20rem',
				'sm': '24rem', 
				'md': '28rem',
				'lg': '32rem',
				'xl': '36rem',
				'2xl': '42rem',
				'3xl': '48rem',
				'4xl': '56rem',
				'5xl': '64rem',
				'6xl': '72rem',
				'7xl': '80rem',
			},
			// 반응형 간격
			spacing: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			// 반응형 폰트 크기
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1rem' }],
				'sm': ['0.875rem', { lineHeight: '1.25rem' }],
				'base': ['1rem', { lineHeight: '1.5rem' }],
				'lg': ['1.125rem', { lineHeight: '1.75rem' }],
				'xl': ['1.25rem', { lineHeight: '1.75rem' }],
				'2xl': ['1.5rem', { lineHeight: '2rem' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
				'5xl': ['3rem', { lineHeight: '1' }],
				'6xl': ['3.75rem', { lineHeight: '1' }],
				'7xl': ['4.5rem', { lineHeight: '1' }],
				'8xl': ['6rem', { lineHeight: '1' }],
				'9xl': ['8rem', { lineHeight: '1' }],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				department: {
					sales: '#3b82f6',     // blue-500
					development: '#10b981', // emerald-500
					manufacturing: '#f59e0b', // amber-500
					quality: '#8b5cf6'    // violet-500
				},
				editor: {
					highlight: 'rgba(59, 130, 246, 0.1)',  // Light blue highlight
					selection: 'rgba(79, 70, 229, 0.2)'    // Light indigo selection
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					from: {
						opacity: '0'
					},
					to: {
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out'
			},
			scale: {
				'101': '1.01',
				'102': '1.02',
				'103': '1.03',
				'104': '1.04',
				'105': '1.05',
				'98': '0.98',
				'97': '0.97',
				'96': '0.96',
				'95': '0.95'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require('@tailwindcss/container-queries'),
		require('@tailwindcss/typography'),
		// 커스텀 유틸리티 추가
		function({ addUtilities, theme }) {
			const newUtilities = {
				// 안전 영역 패딩 (iOS Safari 등)
				'.safe-top': {
					paddingTop: 'env(safe-area-inset-top)'
				},
				'.safe-bottom': {
					paddingBottom: 'env(safe-area-inset-bottom)'
				},
				'.safe-left': {
					paddingLeft: 'env(safe-area-inset-left)'
				},
				'.safe-right': {
					paddingRight: 'env(safe-area-inset-right)'
				},
				'.safe-x': {
					paddingLeft: 'env(safe-area-inset-left)',
					paddingRight: 'env(safe-area-inset-right)'
				},
				'.safe-y': {
					paddingTop: 'env(safe-area-inset-top)',
					paddingBottom: 'env(safe-area-inset-bottom)'
				},
				'.safe-all': {
					padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'
				},
				// 터치 최적화
				'.touch-optimized': {
					minHeight: '44px',
					minWidth: '44px',
					touchAction: 'manipulation',
					WebkitTapHighlightColor: 'transparent'
				},
				// 스크롤 스냅
				'.scroll-snap-x': {
					scrollSnapType: 'x mandatory'
				},
				'.scroll-snap-y': {
					scrollSnapType: 'y mandatory'
				},
				'.scroll-snap-start': {
					scrollSnapAlign: 'start'
				},
				'.scroll-snap-center': {
					scrollSnapAlign: 'center'
				},
				'.scroll-snap-end': {
					scrollSnapAlign: 'end'
				}
			}
			addUtilities(newUtilities, ['responsive', 'hover'])
		}
	],
} satisfies Config;
