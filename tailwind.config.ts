import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'var(--color-divider)',
                input: 'var(--color-divider)',
                ring: 'var(--color-accent)',
                background: 'var(--color-bg)',
                foreground: 'var(--color-text)',
                primary: {
                    DEFAULT: 'var(--color-accent)',
                    foreground: 'var(--color-bg)'
                },
                secondary: {
                    DEFAULT: 'var(--color-surface)',
                    foreground: 'var(--color-text)'
                },
                destructive: {
                    DEFAULT: '#f0797e',
                    foreground: 'var(--color-text)'
                },
                muted: {
                    DEFAULT: 'var(--color-surface)',
                    foreground: 'color-mix(in srgb, var(--color-text) 55%, transparent)'
                },
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    foreground: 'var(--color-bg)',
                    2: 'var(--color-accent-2)',
                    100: 'var(--color-accent-100)',
                    200: 'var(--color-accent-200)',
                    300: 'var(--color-accent-300)',
                    400: 'var(--color-accent-400)',
                    500: 'var(--color-accent-500)',
                    600: 'var(--color-accent-600)',
                    700: 'var(--color-accent-700)',
                    800: 'var(--color-accent-800)',
                    900: 'var(--color-accent-900)'
                },
                popover: {
                    DEFAULT: 'var(--color-surface)',
                    foreground: 'var(--color-text)'
                },
                card: {
                    DEFAULT: 'var(--color-surface)',
                    foreground: 'var(--color-text)'
                },
                success: {
                    DEFAULT: '#4ade9e',
                    foreground: 'var(--color-bg)'
                },
                positive: '#4ade9e',
                negative: '#f0797e',
                neutral: {
                    100: 'var(--color-neutral-100)',
                    200: 'var(--color-neutral-200)',
                    300: 'var(--color-neutral-300)',
                    400: 'var(--color-neutral-400)',
                    500: 'var(--color-neutral-500)',
                    600: 'var(--color-neutral-600)',
                    700: 'var(--color-neutral-700)',
                    800: 'var(--color-neutral-800)',
                    900: 'var(--color-neutral-900)'
                },
                chart: {
                    green: '#4ade9e',
                    red: '#f0797e',
                    blue: 'var(--color-accent)'
                },
                sidebar: {
                    DEFAULT: 'var(--color-surface)',
                    border: 'var(--color-divider)',
                    'subtle-border': 'var(--color-divider)',
                    foreground: 'var(--color-text)',
                    primary: 'var(--color-accent)',
                    'primary-foreground': 'var(--color-bg)',
                    accent: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    'accent-foreground': 'var(--color-accent)',
                    ring: 'var(--color-accent)'
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                lg: 'var(--radius-lg)',
                md: 'var(--radius-md)',
                sm: 'var(--radius-sm)'
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                DEFAULT: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)'
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [tailwindcssAnimate],
} satisfies Config;