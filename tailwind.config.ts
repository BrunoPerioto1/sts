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
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: '#E4E4E7',
                input: '#E4E4E7',
                ring: '#2563EB',
                background: '#FFFFFF',
                foreground: '#09090B',
                primary: {
                    DEFAULT: '#2563EB',
                    foreground: '#FFFFFF'
                },
                secondary: {
                    DEFAULT: '#F4F4F5',
                    foreground: '#18181B'
                },
                destructive: {
                    DEFAULT: '#EF4444',
                    foreground: '#FAFAFA'
                },
                muted: {
                    DEFAULT: '#F4F4F5',
                    foreground: '#71717A'
                },
                accent: {
                    DEFAULT: '#F4F4F5',
                    foreground: '#18181B'
                },
                popover: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#09090B'
                },
                card: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#09090B'
                },
                success: {
                    DEFAULT: '#16A34A',
                    foreground: '#FFFFFF'
                },
                chart: {
                    green: '#16A34A',
                    red: '#EF4444',
                    blue: '#2563EB'
                },
                sidebar: {
                    DEFAULT: '#070750',
                    border: '#090960',
                    'subtle-border': '#EAEAEA',
                    foreground: '#FFFFFF',
                    primary: '#FFFFFF',
                    'primary-foreground': '#070750',
                    accent: '#0A0A7A',
                    'accent-foreground': '#FFFFFF',
                    ring: '#FFFFFF'
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
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
    plugins: [require("tailwindcss-animate")],
} satisfies Config;