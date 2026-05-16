import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mint: "#dff5ea",
        teal: "#24756b",
        coral: "#d56f5a",
        gold: "#e0ad42"
      }
    }
  },
  plugins: []
};

export default config;

