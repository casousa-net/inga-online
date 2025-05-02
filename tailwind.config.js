/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: "#34d399", // emerald-400
            dark: "#059669",    // emerald-600
          },
          accent: "#a3e635",    // lime-400
          secondary: "#22c55e", // green-500
        },
      },
    },
    plugins: [],
  }