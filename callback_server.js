const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logs = [];

app.post('/callback', (req, res) => {
  const entry = {
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] || null,
    contentType: req.headers['content-type'] || null,
    method: req.method,
    path: req.originalUrl,
    payload: req.body,
  };

  logs.push(entry);
  console.log(`[${entry.timestamp}] Callback received from ${entry.ip}`);

  res.status(200).json({ ok: true, received: entry });
});

app.get('/logs', (req, res) => {
  res.status(200).json({
    count: logs.length,
    logs,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`  POST http://localhost:${PORT}/callback`);
  console.log(`  GET  http://localhost:${PORT}/logs`);
});