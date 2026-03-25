import { heroui } from '@heroui/theme';

export default heroui({
  defaultTheme: 'light',
  themes: {
    light: {
      colors: {
        background: '#ffffff',
        foreground: '#171717',
        primary: {
          50: '#e6e8fa',
          100: '#c3c8f3',
          200: '#9ea6ed',
          300: '#7883e6',
          400: '#5b67e0',
          500: '#343dcb',
          600: '#2f37b7',
          700: '#282f9f',
          800: '#222888',
          900: '#1b2070',
          DEFAULT: '#343DCB',
        },
      },
    },
  },
});
