# Mike Kyle — Personal Homepage

## What this is

Static homepage at `https://mikekyle.github.io` linking to all my projects, organized by interest area.

## Source of truth

- `projects.md` at `C:\Users\mikek\Documents\py\py_projects\projects.md` — canonical list of all projects and their status
- GitHub repos under `mikekyle` — live state of each project
- `ideas.md` at `C:\Users\mikek\Documents\py\py_projects\ideas.md` — future project ideas

## Adding or changing a project

1. Update `index.html` — add/remove the link in the appropriate section card
2. Commit and push to `master` — GitHub Pages auto-deploys the root of the default branch
3. Live at `https://mikekyle.github.io` within ~60 seconds

## Design notes

- Single static HTML page + one CSS file — no framework, no build step
- Cards per interest area; sections with no web content get a placeholder card
- Card states: live Page links, GitHub repo links, and "coming soon" text
- **Styling is not final** — the current minimal CSS is a starting point. When styling is decided, update `style.css` and note the design direction here.

## Deploy

```bash
git add -A && git commit -m "..." && git push
```

No build step, no CI — GitHub Pages serves static files directly from the repo root.