/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],

  theme: {
    screens: {
      sm: "800px",
      md: "1204px",
      lg: "1204px",
      xl: "1536px",
      "2xl": "1920px",
    },
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      colors: {
        // Simple & Elegant Color Palette
        primary: "#000080", // Navy blue
        secondary: "#f0e8d0", // Cream/beige
        tertiary: "#00bfa6", // Teal - futuristic accent
        accent: "#00bfa6", // Teal - futuristic accent
        neutral: {
          50: "#f0e8d0", // Cream light
          100: "#e5dcc4", // Cream darker
          900: "#000080", // Navy blue
        },
        // Gray scale
        gray: {
          DEFAULT: "#9ca3af", // Default gray for text (same as gray-400)
        },
        // Beige color
        // Psychological state colors
        focused: "#00bfa6", // Teal - positive state
        overtrading: "#dc2626", // Red - warning state
        hesitant: "#8b5cf6", // Purple - cautious state
        aggressive: "#f97316", // Orange - aggressive state
        stable: "#00bfa6", // Teal - balanced state
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slower": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "float-slowest": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-neural": {
          "0%, 100%": {
            opacity: "0.4",
            transform: "scale(1)",
            filter: "blur(0px)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.1)",
            filter: "blur(1px)",
          },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(0, 0, 128, 0.3)",
            filter: "brightness(1)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(0, 0, 128, 0.6)",
            filter: "brightness(1.2)",
          },
        },
        "neural-flow": {
          "0%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateX(100%)",
            opacity: "0",
          },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        "blob-reverse": {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(-30px, 50px) scale(0.9)",
          },
          "66%": {
            transform: "translate(20px, -20px) scale(1.1)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
      animation: {
        "float-slow": "float-slow 8s ease-in-out infinite",
        "float-slower": "float-slower 10s ease-in-out infinite",
        "float-slowest": "float-slowest 12s ease-in-out infinite",
        "pulse-neural": "pulse-neural 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "neural-flow": "neural-flow 4s linear infinite",
        blob: "blob 7s infinite",
        "blob-reverse": "blob-reverse 7s infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
      fontFamily: {
        inter: ["var(--font-inter)"],
        figtree: ["var(--font-figtree)"],
      },
      fontSize: {
        "10xl": "12rem",
      },
      typography: {
        button: {
          DEFAULT: {
            fontFamily: "var(--font-figtree)",
            fontSize: "1rem",
            fontWeight: "500",
            lineHeight: "1.5",
            letterSpacing: "0.025em",
          },
          sm: {
            fontSize: "0.875rem",
            lineHeight: "1.25",
          },
          lg: {
            fontSize: "1.125rem",
            lineHeight: "1.75",
          },
        },
      },
    },
  },
};
