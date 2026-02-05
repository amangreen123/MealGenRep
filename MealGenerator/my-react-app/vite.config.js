import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            devOptions: {
                enabled: true
            },
            manifest: {
                name: 'Meal Forger',
                short_name: 'MealForger',
                description: 'AI-Powered Meal Generator & Pantry Manager',
                theme_color: '#ce7c1c',
                background_color: '#131415',
                display: 'standalone', // <--- THIS hides the browser URL bar on phones
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    {
                        src: '/Images/Meal_Forger.png', 
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/Images/Meal_Forger.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/Images/Meal_Forger.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable' 
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})