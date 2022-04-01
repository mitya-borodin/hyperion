/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), {
    encoding: "utf-8",
  }),
);

const browsers = pkg.browsersList || ">0.75%, not ie 11, not UCAndroid >0, not OperaMini all";

module.exports = {
  plugins: [
    // Transfer @import rule by inlining content, e.g. @import 'normalize.css'
    // https://github.com/postcss/postcss-import
    require("postcss-import"),

    // https://tailwindcss.com/docs/using-with-preprocessors
    require("tailwindcss/nesting")(require("postcss-nesting")),
    require("tailwindcss"),

    // https://github.com/csstools/postcss-preset-env
    require("postcss-preset-env")({
      stage: 3,
      features: {
        ["nesting-rules"]: false,
      },
      browsers,
      autoprefixer: {
        flexbox: "no-2009",
        overridebrowsersList: browsers,
      },
    }),

    ...(process.env.NODE_ENV === "production" ? [require("cssnano")] : []),
  ],
};
