// Serverless-Funktion (Vercel): nimmt Chat-Nachrichten entgegen und fragt Claude.
// Der API-Schlüssel bleibt hier auf dem Server – niemals ins Frontend!
import bots from './_bots.js';

const MODEL = process.env.MODEL || 'claude-haiku-4-5';
const allowed = Object.values(bots).flatMap(b => b.origins);

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const bot = bots[req.body?.bot];
  if (!bot) return res.status(404).json({ error: 'Unbekannter Bot' });
  const sameSite = origin === `https://${req.headers.host}`; // Demo-Seite auf derselben Domain
  if (origin && !sameSite && !bot.origins.includes(origin)) return res.status(403).json({ error: 'Nicht erlaubt' });

  // Nur die letzten 10 Nachrichten, max. 1000 Zeichen – schützt vor Missbrauch und Kosten
  const messages = (req.body.messages || []).slice(-10)
    .filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
  if (messages[0]?.role === 'assistant') messages.shift();
  if (!messages.length) return res.status(400).json({ error: 'Keine Nachricht' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: bot.prompt, messages })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || r.status);
    res.json({ reply: data.content.find(c => c.type === 'text')?.text || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ reply: 'Entschuldigung, gerade gibt es ein technisches Problem. Bitte versuchen Sie es später erneut.' });
  }
}
