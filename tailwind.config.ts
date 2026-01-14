import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
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
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
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
  			}
  		},
  		backgroundImage: {
  			'gradient-primary': 'var(--gradient-primary)',
  			'gradient-hero': 'var(--gradient-hero)',
  			'gradient-accent': 'var(--gradient-accent)'
  		},
  		boxShadow: {
  			premium: 'var(--shadow-premium)',
  			card: 'var(--shadow-card)',
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		keyframes: {
			'accordion-down': {
				from: {
					height: '0',
					opacity: '0'
				},
				to: {
					height: 'var(--radix-accordion-content-height)',
					opacity: '1'
				}
			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)',
					opacity: '1'
				},
				to: {
					height: '0',
					opacity: '0'
				}
			},
			'fade-in': {
				'0%': {
					opacity: '0',
					transform: 'translateY(10px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0)'
				}
			},
			'fade-in-up': {
				'0%': {
					opacity: '0',
					transform: 'translateY(20px)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0)'
				}
			},
			'fade-out': {
				'0%': {
					opacity: '1',
					transform: 'translateY(0)'
				},
				'100%': {
					opacity: '0',
					transform: 'translateY(-10px)'
				}
			},
			'scale-in': {
				'0%': {
					transform: 'scale(0.95)',
					opacity: '0'
				},
				'100%': {
					transform: 'scale(1)',
					opacity: '1'
				}
			},
			'scale-out': {
				'0%': { 
					transform: 'scale(1)', 
					opacity: '1' 
				},
				'100%': { 
					transform: 'scale(0.95)', 
					opacity: '0' 
				}
			},
			'slide-in-right': {
				'0%': { 
					transform: 'translateX(100%)',
					opacity: '0'
				},
				'100%': { 
					transform: 'translateX(0)',
					opacity: '1'
				}
			},
			'slide-in-left': {
				'0%': { 
					transform: 'translateX(-100%)',
					opacity: '0'
				},
				'100%': { 
					transform: 'translateX(0)',
					opacity: '1'
				}
			},
			'slide-out-right': {
				'0%': { 
					transform: 'translateX(0)',
					opacity: '1'
				},
				'100%': { 
					transform: 'translateX(100%)',
					opacity: '0'
				}
			},
			'slide-up': {
				'0%': { 
					transform: 'translateY(20px)',
					opacity: '0'
				},
				'100%': { 
					transform: 'translateY(0)',
					opacity: '1'
				}
			},
			'shimmer': {
				'0%': {
					backgroundPosition: '-1000px 0'
				},
				'100%': {
					backgroundPosition: '1000px 0'
				}
			},
			'float': {
				'0%, 100%': {
					transform: 'translateY(0)'
				},
				'50%': {
					transform: 'translateY(-10px)'
				}
			},
			'glow': {
				'0%, 100%': {
					opacity: '1',
					filter: 'brightness(1)'
				},
				'50%': {
					opacity: '0.8',
					filter: 'brightness(1.2)'
				}
			},
			'bounce-subtle': {
				'0%, 100%': {
					transform: 'translateY(0)'
				},
				'50%': {
					transform: 'translateY(-5px)'
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'accordion-up': 'accordion-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'fade-in': 'fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
			'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
			'fade-out': 'fade-out 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'scale-in': 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'scale-out': 'scale-out 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
			'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
			'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
			'slide-out-right': 'slide-out-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'slide-up': 'slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
			'shimmer': 'shimmer 2s linear infinite',
			'float': 'float 3s ease-in-out infinite',
			'glow': 'glow 2s ease-in-out infinite',
			'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
			'enter': 'fade-in 0.3s ease-out, scale-in 0.2s ease-out',
			'exit': 'fade-out 0.3s ease-out, scale-out 0.2s ease-out'
		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Lora',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Space Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
