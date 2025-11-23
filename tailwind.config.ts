import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1e40af',   // primary blue
          light: '#3b82f6',
          dark: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}

export default config
