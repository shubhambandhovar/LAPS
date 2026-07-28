var config = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#EBF1FA',
                    500: '#142858',
                    700: '#0C1B3E',
                    DEFAULT: '#142858',
                },
                accent: {
                    400: '#FBBF24',
                    500: '#F59E0B',
                    600: '#D97706',
                    DEFAULT: '#F59E0B',
                },
                surface: {
                    bg: '#F8FAFC',
                    card: '#FFFFFF',
                    border: '#E2E8F0',
                },
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                info: '#0EA5E9',
            },
            fontFamily: {
                heading: ['Outfit', 'sans-serif'],
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
