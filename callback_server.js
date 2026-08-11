const express = require('express');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logs = [];

app.post('/callback', (req, res) => {
    const xForwardedFor = req.headers['x-forwarded-for'] || null;

    const entry = {
        timestamp: new Date().toISOString(),

        remoteAddress: req.socket.remoteAddress,

        xForwardedFor: xForwardedFor,

        xForwardedForIps: xForwardedFor
            ? xForwardedFor.split(',').map(ip => ip.trim())
            : [],

        headers: req.headers,

        userAgent: req.headers['user-agent'] || null,
        contentType: req.headers['content-type'] || null,

        method: req.method,
        path: req.originalUrl,

        payload: req.body,
    };

    logs.push(entry);

    console.log(
        `[${entry.timestamp}] Callback received`
    );

    console.log(`  remoteAddress: ${entry.remoteAddress}`);
    console.log(`  xForwardedFor: ${entry.xForwardedFor || '-'}`);
    console.log(`  xForwardedForIps: ${JSON.stringify(entry.xForwardedForIps)}`);
    console.log(`  headers: ${JSON.stringify(entry.headers)}`);
    console.log(`  payload: ${JSON.stringify(entry.payload)}`);

    res.status(200).json({
        ok: true,
        received: entry
    });
});

app.get('/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    if (logs.length === 0) {
        return res.send('No log entries yet.\n');
    }

    const separator = '-'.repeat(100);
    const lines = [];

    lines.push(separator);
    lines.push(
        `  CALLBACK SERVER LOGS  —  ${logs.length} entr${logs.length === 1 ? 'y' : 'ies'}`
    );
    lines.push(separator);

    for (const entry of logs) {
        const payloadStr = JSON.stringify(entry.payload);

        lines.push(
            `${entry.remoteAddress || '-'} - - ` +
            `[${formatTomcatDate(entry.timestamp)}] ` +
            `"${entry.method} ${entry.path} HTTP/1.1"`
        );

        lines.push(`  remoteAddress: ${entry.remoteAddress || '-'}`);
        lines.push(`  x-forwarded-for: ${entry.xForwardedFor || '-'}`);
        lines.push(
            `  x-forwarded-for-ips: ${JSON.stringify(entry.xForwardedForIps)}`
        );

        lines.push(`  user-agent: ${entry.userAgent || '-'}`);
        lines.push(`  content-type: ${entry.contentType || '-'}`);

        lines.push('  headers:');
        lines.push(JSON.stringify(entry.headers, null, 4));

        lines.push(`  payload: ${payloadStr}`);
        lines.push('');
    }

    lines.push(separator);

    res.send(lines.join('\n'));
});

function formatTomcatDate(iso) {
    const d = new Date(iso);

    const pad = n => String(n).padStart(2, '0');

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const offset = -d.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';

    const hh = pad(Math.floor(Math.abs(offset) / 60));
    const mm = pad(Math.abs(offset) % 60);

    return `${pad(d.getDate())}/${months[d.getMonth()]}/${d.getFullYear()}:` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
        `${sign}${hh}${mm}`;
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`  POST http://localhost:${PORT}/callback`);
    console.log(`  GET  http://localhost:${PORT}/logs`);
});
