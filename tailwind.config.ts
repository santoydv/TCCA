import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6fafa',
          100: '#ccf5f5',
          200: '#99ebeb',
          300: '#66e0e0',
          400: '#33d6d6',
          500: '#00cccc',
          600: '#00a3a3',
          700: '#007a7a',
          800: '#005252',
          900: '#002929',
          950: '#001414',
        },
        secondary: {
          50: '#fff8e6',
          100: '#ffebb0',
          200: '#ffe08a',
          300: '#ffc855',
          400: '#ffb733',
          500: '#ffa500',
          600: '#cc8400',
          700: '#996300',
          800: '#664200',
          900: '#332100',
          950: '#1a1000',
        },
      },
    },
  },
  plugins: [],
}

export default config 