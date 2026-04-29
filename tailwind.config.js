/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#faf8f5",
          100: "#f1ebe3",
          200: "#e4dcd3",
          300: "#c8bdb2",
          400: "#a89890",
          500: "#978b82",
          600: "#6a5a52",
          700: "#574d44",
          800: "#2e2018",
          900: "#1e1612"
        }
      }
    }
  },
  plugins: []
};
