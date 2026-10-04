// ARTOLA Chat-Widget
//
// Schwebender Button (Kundenseiten), eine Zeile:
// <script src="https://DEINE-DOMAIN/widget.js" data-bot="demo-friseur" data-title="Salon Lumen" data-color="#7a1f2b" defer></script>
//
// Eingebettet in einen Abschnitt (z. B. auf der ARTOLA-Seite):
// <div id="chat-demo"></div>
// <script src="https://DEINE-DOMAIN/widget.js" data-bot="demo-friseur" data-mode="inline" data-target="#chat-demo"
//         data-theme="dark" data-lang="en" data-height="520px" defer></script>
// Fragen von außen abschicken: document.querySelector('#chat-demo').ask('Habt ihr samstags offen?')
(() => {
  const BRAND_URL = 'https://artola-digitalsolution.com'; // Adresse der ARTOLA-Website (oder per data-brand überschreiben)
  const s = document.currentScript;
  const API = new URL('/api/chat', s.src).href;
  const { bot, title = 'Assistent', color = '#111', greeting, mode, target, theme, lang, height = '520px',
    brand = BRAND_URL } = s.dataset;
  const inline = mode === 'inline';
  const dark = theme === 'dark';
  const en = lang === 'en';
  const T = en
    ? { open: 'Open chat', close: 'Close', sub: 'AI assistant · replies instantly', ph: 'Your question …', send: 'Send',
        typing: 'typing …', err: "That didn't work. Please try again later.", note: 'AI-generated answers, no guarantee',
        hi: 'Hello! How can I help you?' }
    : { open: 'Chat öffnen', close: 'Schließen', sub: 'KI-Assistent · antwortet sofort', ph: 'Ihre Frage …', send: 'Senden',
        typing: 'schreibt …', err: 'Das hat leider nicht geklappt. Bitte später erneut versuchen.',
        note: 'KI-generierte Antworten, ohne Gewähr', hi: 'Hallo! Wie kann ich Ihnen helfen?' };
  // Farben: hell (Kundenseiten) oder dunkel mit weißem Glow (ARTOLA-Seite)
  const C = dark
    ? { panel: '#0a0a0a', head: '#0a0a0a', headText: '#f4f4f2', msgs: '#0a0a0a', bot: '#1a1a1a', botText: '#f4f4f2',
        on: '#0a0a0a', input: '#141414', inputText: '#f4f4f2', line: 'rgba(255,255,255,.14)', note: '#8a8a8a',
        shadow: '0 0 0 1px rgba(255,255,255,.1), 0 0 60px rgba(255,255,255,.12)', font: "'Space Grotesk', system-ui, sans-serif" }
    : { panel: '#fff', head: color, headText: '#fff', msgs: '#f6f6f6', bot: '#fff', botText: '#222',
        on: '#fff', input: '#fff', inputText: '#222', line: '#ddd', note: '#999',
        shadow: '0 16px 48px rgba(0,0,0,.25)', font: 'system-ui, sans-serif' };
  const history = [];

  let host;
  if (inline) {
    host = document.querySelector(target);
    if (!host) return;
  } else {
    host = document.createElement('div');
    document.body.append(host);
  }
  const root = host.attachShadow({ mode: 'open' }); // eigenes CSS, kollidiert nicht mit der Seite
  root.innerHTML = `
<style>
  * { box-sizing: border-box; font-family: ${C.font}; }
  .fab { position: fixed; right: 20px; bottom: 20px; width: 60px; height: 60px; border: 0; border-radius: 50%;
    background: ${color}; color: ${C.on}; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.25); z-index: 99999;
    display: grid; place-items: center; transition: transform .2s; }
  .fab:hover { transform: scale(1.06); }
  .panel { position: fixed; right: 20px; bottom: 92px; width: 370px; height: 540px; max-height: calc(100vh - 110px);
    background: ${C.panel}; border-radius: 18px; box-shadow: ${C.shadow}; z-index: 99999;
    display: none; flex-direction: column; overflow: hidden; }
  .panel.open { display: flex; }
  .panel.inline { position: relative; right: auto; bottom: auto; width: 100%; height: ${height}; max-height: none; z-index: auto; }
  header { background: ${C.head}; color: ${C.headText}; padding: 14px 16px; display: flex; align-items: center; gap: 10px;
    ${dark ? `border-bottom: 1px solid ${C.line};` : ''} }
  header b { display: block; font-size: 15px; } header small { opacity: .8; font-size: 12px; }
  header button { margin-left: auto; background: none; border: 0; color: ${C.headText}; font-size: 22px; cursor: pointer; }
  .inline header button { display: none; }
  .msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: ${C.msgs}; }
  .m { max-width: 85%; padding: 10px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; }
  .bot { background: ${C.bot}; color: ${C.botText}; align-self: flex-start; border-bottom-left-radius: 4px; }
  .user { background: ${color}; color: ${C.on}; align-self: flex-end; border-bottom-right-radius: 4px; }
  .typing { opacity: .6; }
  form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid ${dark ? C.line : '#eee'}; background: ${C.panel}; }
  input { flex: 1; min-width: 0; border: 1px solid ${C.line}; border-radius: 10px; padding: 10px 12px; font-size: 14px;
    background: ${C.input}; color: ${C.inputText}; outline-color: ${color}; }
  form button { border: 0; border-radius: 10px; background: ${color}; color: ${C.on}; padding: 0 14px; cursor: pointer; }
  .note { text-align: center; font-size: 11px; color: ${C.note}; padding: 0 0 8px; background: ${C.panel}; }
  .note a { color: inherit; }
  @media (max-width: 480px) {
    input { font-size: 16px; } /* verhindert Zoomen auf dem iPhone */
    .panel:not(.inline) { right: 0; bottom: 0; width: 100%; height: 100%; max-height: none; border-radius: 0; }
  }
</style>
${inline ? '' : `<button class="fab" aria-label="${T.open}">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
</button>`}
<div class="panel${inline ? ' inline open' : ''}" role="${inline ? 'region' : 'dialog'}" aria-label="Chat">
  <header><div><b></b><small>${T.sub}</small></div><button aria-label="${T.close}">×</button></header>
  <div class="msgs" aria-live="polite"></div>
  <form><input placeholder="${T.ph}" maxlength="1000" aria-label="${T.ph}"><button>${T.send}</button></form>
  <div class="note">${T.note}${inline ? '' : ` · <a href="${brand}" target="_blank" rel="noopener">by ARTOLA</a>`}</div>
</div>`;

  const $ = q => root.querySelector(q);
  const panel = $('.panel'), msgs = $('.msgs'), input = $('input');
  $('header b').textContent = title;

  const add = (text, cls) => {
    const d = document.createElement('div');
    d.className = 'm ' + cls;
    d.textContent = text; // textContent statt innerHTML = kein Einschleusen von HTML
    msgs.append(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  };

  const toggle = () => {
    panel.classList.toggle('open');
    if (!msgs.childElementCount) add(greeting || T.hi, 'bot');
    if (panel.classList.contains('open')) input.focus();
  };

  let busy = false;
  const send = async text => {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true;
    add(text, 'user');
    history.push({ role: 'user', content: text });
    const t = add(T.typing, 'bot typing');
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot, messages: history })
      });
      const { reply } = await r.json();
      t.remove();
      if (!r.ok || !reply) throw new Error();
      add(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
    } catch {
      t.remove();
      add(T.err, 'bot');
      history.pop();
    }
    busy = false;
  };

  $('form').onsubmit = e => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    send(text);
  };

  if (inline) {
    add(greeting || T.hi, 'bot'); // sofort offen, ohne den Fokus der Seite zu stehlen
    host.ask = send;              // z. B. für Beispielfragen-Buttons auf der Seite
    host.dispatchEvent(new Event('artola-chat:ready'));
  } else {
    $('.fab').onclick = toggle;
    $('header button').onclick = toggle;
  }
})();
