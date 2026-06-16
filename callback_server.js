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
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (logs.length === 0) {
    return res.send('No log entries yet.\n');
  }

  const separator = '-'.repeat(100);
  const lines = [];

  lines.push(separator);
  lines.push(`  CALLBACK SERVER LOGS  —  ${logs.length} entr${logs.length === 1 ? 'y' : 'ies'}`);
  lines.push(separator);

  for (const entry of logs) {
    // Tomcat-style combined log line
    const payloadStr = JSON.stringify(entry.payload);
    lines.push(
      `${entry.ip} - - [${formatTomcatDate(entry.timestamp)}] ` +
      `"${entry.method} ${entry.path} HTTP/1.1" ` +
      `UA:"${entry.userAgent || '-'}" ` +
      `CT:"${entry.contentType || '-'}"`
    );
    lines.push(`  payload: ${payloadStr}`);
    lines.push('');
  }

  lines.push(separator);
  res.send(lines.join('\n'));
});

function formatTomcatDate(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hh = pad(Math.floor(Math.abs(offset) / 60));
  const mm = pad(Math.abs(offset) % 60);
  return `${pad(d.getDate())}/${months[d.getMonth()]}/${d.getFullYear()}:` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${sign}${hh}${mm}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`  POST http://localhost:${PORT}/callback`);
  console.log(`  GET  http://localhost:${PORT}/logs`);
});