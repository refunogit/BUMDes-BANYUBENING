# API BUMDes

Prefix: /api/v1

- Auth: POST /auth/login, POST /auth/refresh, POST /auth/verify-pin, GET /auth/me
- Identity: GET /, PUT / (auth + upload logo/favicon)
- Articles: GET /public, GET /slug/:slug, CRUD auth
- Products: GET /public, GET /featured, GET /categories, CRUD
- Finance CoA: GET /tree, CRUD
- Finance Journals: CRUD + PATCH /:id/status
- Finance Ledger: GET /?coaId=&startDate=&endDate=
- Reports: GET /laba-rugi?format=pdf|excel, /neraca, /arus-kas, /perubahan-modal, /public/summary
- WhatsApp: GET/PUT /config, POST /send, /bulk, GET /logs, POST /webhook
- Search: GET /?q=, /suggestions
- Backup: GET /, POST /, POST /restore

Semua butuh JWT kecuali public. PIN via X-PIN header untuk operasi sensitif.
