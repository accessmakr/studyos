import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://rbqekyzvmgmcgzbiuryy.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicWVreXp2bWdtY2d6Yml1cnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTcxNDIsImV4cCI6MjA5NjkzMzE0Mn0.vFr8IMUd9xBrujcB5XbXDDmkFIKmKYMpFDDZW9BjpPE'),
    'import.meta.env.VITE_GROQ_KEY': JSON.stringify('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'),
    'import.meta.env.VITE_CLOUDINARY_CLOUD': JSON.stringify('dtzcctvwy'),
    'import.meta.env.VITE_CLOUDINARY_KEY': JSON.stringify('513484351352148'),
    'import.meta.env.MODE': JSON.stringify(mode)
  },
  build: {
    outDir: mode === 'local' ? 'dist-local' : 'dist',
    rollupOptions: mode === 'local' ? {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    } : {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        pdf: ['pdfjs-dist', 'pdf-lib', 'jspdf'],
        charts: ['chart.js']
      }
    }
  },
  publicDir: 'public'
}))
