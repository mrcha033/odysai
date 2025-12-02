/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f4f8',
                    100: '#dae4ed',
                    200: '#b8cee0',
                    300: '#8fb0cd',
                    400: '#7093bd',
                    500: '#5B7BA5', // Main logo blue
                    600: '#4a6a8f',
                    700: '#3d5776',
                    800: '#334862',
                    900: '#2d3d53',
                    950: '#1e2838',
                },
                accent: {
                    50: '#fff8ed',
                    100: '#ffeed4',
                    200: '#ffdaa8',
                    300: '#ffc071',
                    400: '#ff9d38',
                    500: '#FFB84D', // Logo orange accent
                    600: '#f09000',
                    700: '#c77102',
                    800: '#9e5908',
                    900: '#7f4a09',
                    950: '#452505',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
