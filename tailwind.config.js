export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a'
        },
        emerald: {
          500: '#10b981',
          700: '#047857'
        }
      },
      borderRadius: {
        'lg': '8px'
      }
    }
  },
  plugins: []
}
