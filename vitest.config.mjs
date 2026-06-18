/**
 * @file vitest.config.mjs
 * @description Vitest configuration for server-side and renderer unit tests.
 *
 * Uses the Node.js environment so tests can import CommonJS modules from src/
 * and ESM modules from public/js/renderers/ without a browser runtime.
 *
 * Named .mjs so that Vitest reads it as ESM regardless of the package.json
 * "type": "commonjs" setting used by the server.
 */

export default {
  test: {
    environment: "node",
    include: ["test/**/*.test.{js,mjs}"],
  },
};
