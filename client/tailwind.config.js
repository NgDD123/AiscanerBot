/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}", "./index.html"],
  theme: {
    extend: {
      colors: {
        "background-color": {
          DEFAULT: "#ffffff",
        },
        "text-style": "#7607a4",
        "major-text-style": "#7607a4",
        "minor-text-style": "#3f0055",
        "stroke-style": "#F1F1F1",
        "border-gray": "#808080",
        "background-inputs": "#F9FAFB",
        "sidebar-text": "#6A6E83",
        "gray-border": "#E5E5EA",
        "gray-input-text": "#",
        "gray-input-text": "#C7C7CC",
        "table-border": "#D1D1D6",
        "table-row-bg": "#F0F1F1",
        "dashboard-background": "#F9F9F9",
        "breadcrumb-gray": "#667085",
      },
    },
  },
  plugins: [],
};
