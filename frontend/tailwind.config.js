module.exports = {
  purge: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx,vue,svelte}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        orange: {
          500: "#ff3e00",
        },
      },
    },
  },
  variants: {
    backgroundColor: ["hover", "focus", "active"],
    textColor: ["hover", "focus", "active"],
    borderColor: ["hover", "focus", "active"],
    boxShadow: ["hover", "focus", "active"],
  },
  plugins: [],
  future: {
    removeDeprecatedGapUtilities: true,
  },
};
