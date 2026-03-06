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
          50: "#fff7f8",
          100: "#ffeef1",
          200: "#ffd9df",
          300: "#ffb8c4",
          400: "#ff8fa5",
          500: "#ff6285",
          600: "#eb3d68",
          700: "#c72850",
          800: "#a62144",
          900: "#8b1f3b"
        }
      }
    }
  },
  plugins: []
};
