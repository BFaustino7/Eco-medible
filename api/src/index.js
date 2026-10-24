// FuegoEvidencia API
const express = require('express');
const app = express();
app.get('/health', (_, res) => res.json({ ok: true }));
app.listen(3001, () => console.log('API en :3001'));
