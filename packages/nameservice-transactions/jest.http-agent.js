const http = require("http");
const https = require("https");

// got@11 (pinned by @arkecosystem/core-test-framework) predates Node 19's
// keep-alive-enabled global agents and cannot cope with a server closing a
// reused idle socket mid-run ("socket hang up" / ECONNRESET in toBeAccepted).
// Restore pre-Node-19 behavior so every broadcast uses a fresh connection.
http.globalAgent = new http.Agent({ keepAlive: false });
https.globalAgent = new https.Agent({ keepAlive: false });
