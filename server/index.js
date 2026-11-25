import { listen } from "./api.js";
import { config } from "./config.js";
await listen(config.port);
console.log(`ORBIS running at http://localhost:${config.port}${config.offline ? "  (OFFLINE mode: demo data only)" : ""}`);
