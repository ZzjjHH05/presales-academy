import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b4fd",
          400: "#608af9",
          500: "#3b63f5",
          600: "#2544ea",
          700: "#1d34d7",
          800: "#1e2dae",
          900: "#1e2c89",
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
