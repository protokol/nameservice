// Serves the OpenAPI spec (openapi/nameservice-api.yaml) with Swagger UI.
//
// Usage:
//   pnpm api:docs            # http://localhost:9000
//   PORT=8080 node openapi/serve.mjs
//
// Requires a running core node (default http://localhost:4003/api/nameservice).
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const SPEC_FILE = join(ROOT, "nameservice-api.yaml");
const PORT = Number(process.env.PORT || 9000);
const API_URL = process.env.API_URL || "http://localhost:4003/api/nameservice";

if (!existsSync(SPEC_FILE)) {
    console.error(`Spec not found: ${SPEC_FILE}`);
    process.exit(1);
}

const spec = readFileSync(SPEC_FILE, "utf8");

const contentTypes = {
    ".yaml": "text/yaml",
    ".yml": "text/yaml",
    ".json": "application/json",
};

const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Protokol Nameservice API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          deepLinking: true,
          tryItOutEnabled: true,
        });
      };
    </script>
  </body>
</html>
`;

const server = createServer((req, res) => {
    let path = new URL(req.url, "http://localhost").pathname;

    if (path === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(indexHtml);
        return;
    }

    if (path === "/openapi.yaml") {
        res.writeHead(200, { "Content-Type": "text/yaml" });
        res.end(spec);
        return;
    }

    // Serve any other file in openapi/ (e.g. json export) for convenience
    const file = join(ROOT, decodeURIComponent(path.replace(/^\/+/, "")));
    if (file.startsWith(ROOT) && existsSync(file) && statSync(file).isFile()) {
        res.writeHead(200, { "Content-Type": contentTypes[extname(file)] || "text/plain" });
        createReadStream(file).pipe(res);
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Nameservice API docs: http://localhost:${PORT}`);
    console.log(`OpenAPI spec:          http://localhost:${PORT}/openapi.yaml`);
    console.log(`Live API (server url): ${API_URL}`);
    console.log("Press Ctrl+C to stop.");
});
