/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F2F0EB',
        ink: '#141414',
        mist: '#E4E1D9',
        slate: {
          soft: '#6B6A66',
        },
        signal: {
          DEFAULT: '#0D7377',
          deep: '#095457',
          soft: '#D7EEEE',
        },
        gain: '#1B6B4A',
        loss: '#B42318',
        warn: '#9A6700',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        lift: '0 1px 0 rgba(20,20,20,0.06), 0 12px 32px -16px rgba(20,20,20,0.28)',
      },
      backgroundImage: {
        grain:
          'radial-gradient(ellipse at 20% 0%, rgba(13,115,119,0.08), transparent 45%), radial-gradient(ellipse at 90% 10%, rgba(20,20,20,0.05), transparent 40%)',
      },
    },
  },
  plugins: [],
}
