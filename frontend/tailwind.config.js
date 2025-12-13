/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#2ecc70",
                "primary-dim": "rgba(46, 204, 112, 0.1)",
                "primary-glow": "rgba(46, 204, 112, 0.4)",
                "deep-bg": "#010804",
                "surface-dark": "#05110a",
                "surface-highlight": "#0b1f15",
                "border-green": "#132e21",
                "rabbit-white": "#f1f5f9",
                "accent": "#0ea5e9"
            },
            fontFamily: {
                display: ["Inter", "sans-serif"],
                mono: ["Fira Code", "monospace"],
                sans: ["Inter", "sans-serif"],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'green-mist': 'linear-gradient(to bottom, transparent, #05110a)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'dash': 'dash 15s linear infinite',
                'shimmer': 'shimmer 2s infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '50%': {
                        transform: 'translateY(-10px)'
                    },
                },
                fadeInUp: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(20px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                },
                dash: {
                    '0%': {
                        strokeDashoffset: '1000'
                    },
                    '100%': {
                        strokeDashoffset: '0'
                    },
                },
                shimmer: {
                    '0%': {
                        transform: 'translateX(-100%)'
                    },
                    '100%': {
                        transform: 'translateX(200%)'
                    },
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}