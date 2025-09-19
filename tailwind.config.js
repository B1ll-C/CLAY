/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8FB996", // Sage Green
          dark: "#557C55", // Olive Green
          light: "#E6F4EA", // Mint Cream
        },
        accent: {
          peach: "#F7C8A0",
          mustard: "#E6C368",
        },
        neutral: {
          white: "#FFFFFF",
          light: "#F1F1F1",
          gray: "#9CA3AF",
          dark: "#374151",
        },
      },
    },
  },
  plugins: [],
};
