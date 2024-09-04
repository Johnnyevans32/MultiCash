/** @type {import('tailwindcss').Config} */

const generateColorClass = (variable) => {
  return ({ opacityValue }) =>
    opacityValue
      ? `rgba(var(--${variable}), ${opacityValue})`
      : `rgb(var(--${variable}))`;
};

const textColor = {
  base: generateColorClass("text-base"),
  lightbase: generateColorClass("text-lightbase"),
};

const backgroundColor = {
  bgbase: generateColorClass("bg-bgbase"),
  base: generateColorClass("bg-base"),
  lightbase: generateColorClass("bg-lightbase"),
  hoverlightbase: generateColorClass("bg-hoverlightbase"),
};

const borderColor = {
  base: generateColorClass("border-base"),
  lightbase: generateColorClass("border-lightbase"),
};

module.exports = {
  darkMode: "class",
  content: [
    "./assets/**/*.css",
    "./components/*.{vue,js}",
    "./components/**/*.{vue,js}",
    "./pages/*.vue",
    "./pages/**/*.vue",
    "./layouts/*.vue",
    "./layouts/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./composables/**/*.vue",
    "./store/**/*.{js,ts}",
    "./*.{vue,js,ts}",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      boxShadow: {
        custom: "0 5px 5px 0 #f9ca24",
      },
      textColor,
      backgroundColor,
      borderColor,
    },
    fontSize: {
      tiny: ".6rem",
      xs: ".75rem",
      sm: ".875rem",
      tbase: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "4rem",
      "7xl": "5rem",
    },
  },
  plugins: [],
};
