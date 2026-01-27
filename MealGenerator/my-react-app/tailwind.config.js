/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				machine: ['ITCMachine', 'sans-serif'],
				sans: ['Inter', 'system-ui', 'sans-serif'],
				terminal: ['Inter', 'system-ui', 'sans-serif'],
			},
			keyframes: {
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				}
			},
			animation: {
				shimmer: 'shimmer 2s linear infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}