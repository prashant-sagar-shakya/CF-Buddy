
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "cf-legendary": "#FF0000",
        "cf-red": "#FF0000",
        "cf-orange": "#FF8C00",
        "cf-violet": "#AA00AA",
        "cf-blue": "#0000FF",
        "cf-cyan": "#03A89E",
        "cf-green": "#008000",
        "cf-gray": "#808080",
        "cf-legendary-dark": "#FF4D4D",
        "cf-red-dark": "#FF4D4D",
        "cf-orange-dark": "#FFA500",
        "cf-violet-dark": "#D500D5",
        "cf-blue-dark": "#5C5CFF",
        "cf-cyan-dark": "#2DBFAF",
        "cf-green-dark": "#30B030",
        "cf-gray-dark": "#AAAAAA",
        "code-bg": "#1e1e2e",
        "code-text": "#f8f8f2",
        "code-blue": "#6272a4",
        "code-green": "#50fa7b",
        "code-yellow": "#f1fa8c",
        "code-orange": "#ffb86c",
        "code-purple": "#bd93f9",
        "code-pink": "#ff79c6",
        "code-red": "#ff5555",
        "dark-bg": "#121212",
        "dark-text": "#e4e4e4",
        "dark-blue": "#7891d0",
        "dark-green": "#70fa9b",
        "dark-yellow": "#ffffac",
        "dark-orange": "#ffca8c",
        "dark-purple": "#d1b3ff",
        "dark-pink": "#ff99e6",
        "dark-red": "#ff7575",
        "dark-border": "#2d2d2d",
        "dark-card": "#1a1a1a",
      },
      fontFamily: {
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      scale: {
        "102": "1.02",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "text-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "text-blink": "text-blink 1s ease-in-out infinite",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
} satisfies Config;
