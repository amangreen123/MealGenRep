/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			// ... (keep existing colors and radius)
			fontFamily: {
				machine: ['ITCMachine', 'sans-serif'],
				// CHANGE: Switch terminal to a clean sans-serif for readability
				sans: ['Inter', 'system-ui', 'sans-serif'],
				terminal: ['Inter', 'system-ui', 'sans-serif'], // Remapped to sans for easy migration
				
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}