/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode using class strategy
  theme: {
    extend: {
      colors: {
        // Custom colors for light/dark mode
        primary: {
          light: '#3b82f6', // blue-500
          dark: '#60a5fa', // blue-400
        },
        background: {
          light: '#f3f4f6', // gray-100
          dark: '#1f2937', // gray-800
        },
        surface: {
          light: '#ffffff', // white
          dark: '#111827', // gray-900
        },
        text: {
          light: '#1f2937', // gray-800
          dark: '#f9fafb', // gray-50
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}