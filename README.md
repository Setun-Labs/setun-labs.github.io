# Setun Labs — setunlabs.ai

The lab's public site. Plain HTML/CSS/JS, no build step, no dependencies,
no trackers. The hero constellation (Orion) is procedural canvas; the signup
lists post to a Google Form (see `theme.js`).

## Local preview

```sh
./serve.sh   # python3 -m http.server 8000
```

## Structure

- `index.html` — front door, the creed (the Three Stars)
- `apps.html` — Pocket AI Hub
- `models.html` — the Grimm Series (classes + specialists)
- `tools.html`, `docs.html`, `news.html`, `support.html`, `privacy.html`
- `styles.css`, `theme.js` — one design system, one script
