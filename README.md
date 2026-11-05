# Game server
See ../DEPLOY_AR.md. Quick start: `node server.js` (Node 18+, no npm install). Game files are served from `./public`.
Endpoints: `GET /health`, `GET /api/stats/<32hex>`, `POST /api/kills`, WebSocket `/ws`.
