# Deployment
ORBIS is one Node process serving the API and the web app. Run it on any host with Node 22+, behind an HTTPS reverse proxy (Caddy, nginx). Set environment variables on the host, never in git. Health check: `GET /api/status`. GitHub stores the code only; it cannot host the server. Persistence, scheduled workers and backups are not implemented yet (see DEVELOPMENT_STATUS.md).
