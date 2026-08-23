# Demo

Phone-oriented wrapper around the vendored BesoGo editor.

```bash
./scripts/serve.sh
# http://127.0.0.1:8080/demo/
```

**On your phone:** https://mikekyle.github.io/goban/demo/ (published from `master` via `scripts/deploy-github-pages.sh`).

Must be served from the **repo root** so `../vendor/besogo/` resolves. Opening `demo/index.html` as a file:// URL will fail to load scripts.

After one online visit, the demo installs as a PWA (`manifest.json` + `sw.js`): Add to Home Screen on Chrome/Android, then the board works offline for local play/edit.

This is the bake-off baseline: stock BesoGo feel, stock missclick-creates-variation behaviour. Tether and delete-last issues change `vendor/besogo/js/` and then this page.
