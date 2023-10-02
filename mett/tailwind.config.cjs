/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css,html}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    extend: {
      // antd
      screens: {
        xs: '480px',
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
        xxl: '1600px',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    // require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
    require('prettier-plugin-tailwindcss'),
  ],
};
