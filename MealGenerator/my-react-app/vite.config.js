import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
  },
  build:{
    sourcemap: true,
    assetsDir: 'image'
  },
    server: {
    proxy: {
        '/api': {
            target:'https://localhost:5261',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, ''),
        },
    },
  },
  
})
