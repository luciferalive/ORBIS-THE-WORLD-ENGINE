# Installation
1. Install Node 22+ (`node -v`).
2. `cp .env.example .env` and add any keys you have.
3. `node server/index.js`, open http://localhost:8090.
4. Check the **API Center** page: providers should become OPERATIONAL after their module is opened. Anything else shows the exact reason.
Troubleshooting: a firewall or proxy blocking outbound HTTPS makes every provider DISCONNECTED; set `ORBIS_OFFLINE=1` to run on labelled demo data.
