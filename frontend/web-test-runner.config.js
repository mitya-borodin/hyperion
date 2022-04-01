/* eslint-disable @typescript-eslint/no-var-requires */
const runner = require("@snowpack/web-test-runner-plugin");

process.env.NODE_ENV = "test";

module.exports = {
  plugins: [runner()],
};
