/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FCFAF2",
        surface: "#FFFFFF",
        "surface-warm": "#FBF1DA",
        "surface-muted": "#F4EDE1",
        "surface-sunken": "#EFE6CF",
        border: {
          DEFAULT: "#DCD3BE",
          soft: "#E8DFC8",
          strong: "#C6BB9F",
        },
        ink: {
          DEFAULT: "#575279",
          2: "#3F3B5B",
          muted: "#67617F",
          soft: "#6D6786",
          deeper: "#2F2B47",
          onDark: "#FFFAF3",
        },
        amber: {
          DEFAULT: "#C58216",
          display: "#9A640F",
          deep: "#7A5012",
          lite: "#B07522",
          soft: "#FBEFD1",
          border: "#EAD9A4",
          text: "#7A5012",
        },
        pass: {
          fg: "#2F6D52",
          bg: "#DCEADE",
          bd: "#BAD3C2",
          mid: "#3F8A66",
        },
        denial: {
          fg: "#8B3E50",
          bg: "#F5D5D5",
          bd: "#E8B6B6",
          mid: "#A0445C",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
