/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            colors: {
                background: '#0a0a0a',
                foreground: '#e4e4e7',
                muted: '#27272a',
                'muted-foreground': '#71717a',
                accent: '#22c55e',
                error: '#ef4444',
                border: '#27272a',
                card: '#18181b',
            },
            keyframes: {
                blink: {
                    '0%, 50%': { opacity: '1' },
                    '51%, 100%': { opacity: '0' },
                },
            },
            animation: {
                blink: 'blink 1s step-end infinite',
            },
        },
    },
    plugins: [],
};
