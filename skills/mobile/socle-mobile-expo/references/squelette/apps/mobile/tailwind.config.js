// NativeWind v4 = Tailwind 3 : le mobile garde sa propre version de Tailwind,
// distincte de celle du client web. Les tokens ci-dessous sont les MÊMES que
// ceux de apps/web/src/app/globals.css — les tenir alignés à la main tant
// qu'aucun paquet de design tokens n'existe (ticket design system).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { 500: "#0f62fe", 600: "#0043ce" },
        neutral: { 50: "#f7f7f8", 900: "#16161d" },
        success: { 500: "#198038" },
        error: { 500: "#da1e28" },
      },
    },
  },
  plugins: [],
};
