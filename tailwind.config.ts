// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blue: {
          600: "#2563eb",
        },
      },
    },
  },
  plugins: [],
};