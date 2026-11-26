import { listen } from "./api.js";
import { config } from "./config.js";
await listen(config.port);
console.log(`ORBIS running at http://localhost:${config.port}${config.offline ? "  (OFFLINE mode: demo data only)" : ""}`);
import * as scheduler from "./core/scheduler.js";
console.log(scheduler.start() ? "[orbis] scheduler started (SQLite recording on)" : "[orbis] scheduler off (offline mode or ORBIS_SCHEDULER=0)");
