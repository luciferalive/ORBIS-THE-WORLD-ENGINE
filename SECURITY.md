# Security
- API keys are read from the server environment and never sent to the browser. `.env` is git-ignored.
- Admin actions (test connection, register provider) require `ORBIS_ADMIN_TOKEN` and are rate limited. If the token is unset they are disabled.
- Admin-supplied URLs: https only, port 443, no embedded credentials, DNS-resolved addresses must be public, no redirects, GET only, 200 KB cap. Provider responses are treated as untrusted text and never executed.
- Custom providers reference secrets by environment variable name; secrets are never entered or stored through the UI.
- The UI builds DOM with text nodes only (no innerHTML from data, except chart tooltips built from numbers); CSP restricts scripts to same origin.
- Not implemented: user accounts, roles, audit log, HTTPS termination (put a reverse proxy in front), database backups (no database yet). Do not expose the admin token or run this publicly without those.
