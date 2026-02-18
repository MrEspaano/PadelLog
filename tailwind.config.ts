import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        padel: {
          blue: "#0E4D92",
          "blue-soft": "#2F78C6",
          lime: "#D7F95B",
          court: "#F4F8FF",
          line: "#ADC4DE",
          slate: "#0F172A"
        },
        accent: {
          teal: "#2F78C6",
          purple: "#0E4D92"
        }
      },
      backgroundImage: {
        "soft-grid": "radial-gradient(circle at 1px 1px, rgba(14, 77, 146, 0.1) 1px, transparent 0)",
        "court-lines":
          "linear-gradient(to right, rgba(14,77,146,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,77,146,0.08) 1px, transparent 1px)",
        "mat-texture":
          "radial-gradient(circle at 0 0, rgba(255,255,255,0.35), transparent 50%), radial-gradient(circle at 100% 0, rgba(47,120,198,0.08), transparent 35%)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 40px -20px rgba(15, 23, 42, 0.26)",
        stadium: "0 20px 42px -26px rgba(14, 77, 146, 0.55)",
        "glow-blue": "0 0 0 1px rgba(14, 77, 146, 0.2), 0 14px 30px -18px rgba(14, 77, 146, 0.62)"
      }
    }
  },
  plugins: []
};

export default config;
