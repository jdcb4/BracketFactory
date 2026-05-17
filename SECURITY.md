# Security

BracketFactory is a client-only browser app. Do not add authentication, secrets, server-side state, or environment-specific credentials unless the user explicitly asks for that work and the decision is documented.

## Do not commit

- `.env` or `.env.*` files.
- Generated build output such as `dist/`.
- `node_modules/`.
- Downloaded package archives or local test exports.

## External input

Treat browser form values and imported model data as untrusted. Validate parameter objects with Zod or equivalent domain checks before generating geometry or exports.
