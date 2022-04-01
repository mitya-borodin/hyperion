/** @type {import("snowpack").SnowpackUserConfig } */
import { config } from "dotenv";
import proxy from "http2-proxy";

config();

export default {
  mount: {
    public: { url: "/", static: true },
    src: { url: "/dist" },
  },
  plugins: [
    "@snowpack/plugin-dotenv",
    "@snowpack/plugin-svelte",
    "@snowpack/plugin-postcss",
    [
      "@snowpack/plugin-typescript",
      {
        /* Yarn PnP workaround: see https://www.npmjs.com/package/@snowpack/plugin-typescript */
        ...(process.versions.pnp ? { tsc: "yarn pnpify tsc" } : {}),
      },
    ],
  ],
  routes: [
    /* Enable an SPA Fallback in development: */
    { match: "routes", src: ".*", dest: "/index.html" },
    {
      src: "/api/.*",
      dest: (req, res) => {
        return proxy.web(req, res, {
          hostname: process.env.SERVER_HOST,
          port: process.env.SERVER_PORT,
        });
      },
    },
    {
      src: "/ws",
      upgrade: (req, socket, head) => {
        proxy.ws(
          req,
          socket,
          head,
          {
            hostname: process.env.WS_HOST,
            port: process.env.WS_PORT,
          },
          (err, req, socket) => {
            if (err) {
              if (err.code === "EPIPE" || err.code === "ECONNRESET") {
                // ! Эти типы ошибок случались при перезагрузки бразуера,
                // ! но они не влияют на работоспособность, по этому они
                // ! выключены.
                socket.destroy();

                return;
              }

              console.error(err);
              socket.destroy();
            }
          },
        );
      },
    },
  ],
  optimize: {
    /* Example: Bundle your final build: */
    // "bundle": true,
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    tailwindConfig: "./tailwind.config.js",
    open: "chrome",
  },
  buildOptions: {
    sourcemap: true,
  },
};
