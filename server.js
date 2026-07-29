/**
 * Entry point for cPanel's "Setup Node.js App" (Passenger) - it expects a plain
 * script that starts an HTTP server on process.env.PORT, not the `next start`
 * CLI. Local dev and `npm run build` are unaffected; this is only used in
 * production hosting. Requires `npm run build` to have been run first.
 */
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Portfolio server listening on port ${port}`);
  });
});
