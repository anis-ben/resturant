import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#FACC15',
          500: '#D4AF37',
          600: '#B8860B',
          700: '#996515',
        },
        emerald: {
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
        dark: {
          800: '#1F2937',
          900: '#111827',
          950: '#0B0F17',
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
