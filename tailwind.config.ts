import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae7ff",
          200: "#bcd2ff",
          300: "#8fb3ff",
          400: "#5e8aff",
          500: "#3b65ff",
          600: "#1f3ef5",
          700: "#1a30dc",
          800: "#1c2bb1",
          900: "#1d2c8b",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
