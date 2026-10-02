# ARTOLA Chatbot

FAQ-Chatbot mit Claude. Läuft auf Vercel und lässt sich mit einer Zeile in jede Website einbauen.

```
api/chat.js      Server: fragt Claude (API-Schlüssel bleibt hier)
api/_bots.js     Wissen + Regeln pro Kunde
public/widget.js Chat-Fenster für die Kundenseite
public/index.html Demo-Seite (fiktiver Salon Lumen)
```

## 1. Online stellen

1. Ordner als neues GitHub-Repo hochladen (z. B. `artola-chatbot`).
2. Auf vercel.com → **Add New Project** → Repo wählen → **Deploy**.
3. Unter **Settings → Environment Variables**:
   - `ANTHROPIC_API_KEY` = dein Schlüssel von console.anthropic.com
   - optional `MODEL` (Standard: `claude-haiku-4-5`, schnell und günstig – aktuelle Modellnamen in der Anthropic-Doku prüfen)
4. **Redeploy**. Die Demo läuft dann unter `https://<projekt>.vercel.app`.
5. In der Anthropic Console ein **monatliches Ausgabenlimit** setzen.

## 2. Neuen Kunden hinzufügen

In `api/_bots.js` einen Eintrag ergänzen:

```js
'baeckerei-mueller': {
  origins: ['https://www.baeckerei-mueller.de'],   // nur diese Website darf den Bot nutzen
  prompt: rules('Bäckerei Müller') + `Öffnungszeiten: ... Preise: ... Kontakt: ...`
}
```

Pushen → Vercel aktualisiert automatisch.

## 3. Beim Kunden einbauen

Diese Zeile vor `</body>` in die Kundenseite (funktioniert auch bei WordPress, Wix, Jimdo usw. über „Eigener Code/HTML einfügen“):

```html
<script src="https://<projekt>.vercel.app/widget.js"
        data-bot="baeckerei-mueller"
        data-title="Bäckerei Müller"
        data-color="#8b4513"
        data-greeting="Hallo! Fragen Sie mich zu Öffnungszeiten und Bestellungen." defer></script>
```

## Eingebettet in eine Seite (Inline-Modus)

Statt des schwebenden Buttons erscheint das Chatfenster direkt in einem Abschnitt (so auf der ARTOLA-Seite):

```html
<div id="chat-demo"></div>
<script src="https://<projekt>.vercel.app/widget.js"
        data-bot="demo-friseur" data-mode="inline" data-target="#chat-demo"
        data-theme="dark" data-lang="en" data-height="540px" defer></script>
```

- `data-theme="dark"` = dunkles Design mit dezentem weißem Glow, `data-lang="en"` = englische Texte.
- Fragen von außen senden: `document.querySelector('#chat-demo').ask('Habt ihr samstags offen?')`.
- Die Domain der Seite, auf der das Widget eingebettet ist, muss bei dem Bot in `api/_bots.js` unter `origins` stehen.
- In `public/widget.js` oben `BRAND_URL` auf die ARTOLA-Seite setzen (Link „by ARTOLA" im schwebenden Modus).

## Rechtliches (Checkliste)

- Datenschutzerklärung des Kunden ergänzen: Chat-Eingaben werden an Anthropic (USA) übermittelt.
- Bot ist als KI gekennzeichnet (steht im Widget) – Transparenzpflicht EU AI Act.
- Auftragsverarbeitungsvertrag (AVV) mit dem Kunden und Anthropic-Bedingungen beachten.
- Keine Rechtsberatung – im Zweifel prüfen lassen.
