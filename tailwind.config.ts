import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

// Cor que vem pronta numa var (não em canais RGB) e ainda aceita opacidade
// (`bg-success/10`): success/danger seguem a cor que o usuário escolheu em
// Preferências, e essa escolha é um `var(--dashboard-*)`, não três números.
const mixed = (cssVar: string) => `color-mix(in srgb, var(${cssVar}) calc(<alpha-value> * 100%), transparent)`;

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
                // Canais RGB (ver index.css): e o que faz `bg-foreground/[0.07]`
                // gerar CSS. Com 'var(--color-text)' a opacidade era ignorada.
                background: 'rgb(var(--rgb-bg) / <alpha-value>)',
                foreground: 'rgb(var(--rgb-text) / <alpha-value>)',
                zinc: Object.fromEntries(
                    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, `rgb(var(--zinc-${n}) / <alpha-value>)`])
                ),
                // Tokens semânticos — ver index.css. `accent` (alias `primary`)
                // é ação e seleção; success/danger, ganho e perda; pending,
                // pendente; warning, atenção; muted, neutro (anulada, zero).
                primary: {
                    DEFAULT: 'rgb(var(--rgb-accent) / <alpha-value>)',
                    foreground: 'var(--color-bg)'
                },
                success: {
                    DEFAULT: mixed('--color-success'),
                    foreground: 'var(--color-bg)',
                    // Fundo de botão cheio com rótulo branco.
                    solid: 'rgb(var(--rgb-success-solid) / <alpha-value>)'
                },
                danger: {
                    DEFAULT: mixed('--color-danger'),
                    foreground: 'var(--color-text)',
                    solid: 'rgb(var(--rgb-danger-solid) / <alpha-value>)'
                },
                pending: 'rgb(var(--rgb-pending) / <alpha-value>)',
                warning: 'rgb(var(--rgb-warning) / <alpha-value>)',
                cashout: 'rgb(var(--rgb-cashout) / <alpha-value>)',
                secondary: {
                    DEFAULT: 'var(--color-surface)',
                    foreground: 'var(--color-text)'
                },
                muted: {
                    DEFAULT: 'rgb(var(--rgb-muted) / <alpha-value>)',
                    // Placeholder do shadcn (Input/Select): segue como estava.
                    foreground: 'color-mix(in srgb, var(--color-text) 55%, transparent)'
                },
                accent: {
                    // Canais RGB: com 'var(--color-accent)' (hex) os ~48
                    // `bg-accent/15`, `border-accent/25` etc. não geravam CSS.
                    DEFAULT: 'rgb(var(--rgb-accent) / <alpha-value>)',
                    foreground: 'var(--color-bg)',
                    // Par de leitura do accent: o DEFAULT e superficie (texto
                    // branco por cima) e este e texto/link sobre fundo escuro.
                    text: 'rgb(var(--rgb-accent-text) / <alpha-value>)',
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
                    DEFAULT: 'rgb(var(--rgb-surface) / <alpha-value>)',
                    foreground: 'var(--color-text)'
                },
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
                },
                // Destaque do valor que acabou de mudar (lucro ao liquidar).
                'value-pop': {
                    '0%': { transform: 'scale(1)', filter: 'brightness(1)' },
                    '35%': { transform: 'scale(1.08)', filter: 'brightness(1.35)' },
                    '100%': { transform: 'scale(1)', filter: 'brightness(1)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'value-pop': 'value-pop 0.65s ease-out'
            }
        }
    },
    plugins: [tailwindcssAnimate],
} satisfies Config;