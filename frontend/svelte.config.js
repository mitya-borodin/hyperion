/* eslint-disable @typescript-eslint/no-var-requires */

const preprocess = require("svelte-preprocess");

const postcss = require("./postcss.config.js");

module.exports = {
  preprocess: preprocess({
    postcss,
    sourceMap: true,
  }),
};
