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

## Design

### Current style: tobias-inspired (chosen — May 2026)

Inspired by [tobiasahlin.com](https://tobiasahlin.com/). Key characteristics:

- **Massive section headers** — 160px, weight 800, letter-spacing -0.02em. Each section introduced by a single bold word: "Go.", "Barbershop.", "Actuarial.", etc.
- **Colored grid cards** — each project card gets its own inline `background-color`, giving variety as you scroll. Cards are 2-column flex-wrap, full-width on mobile.
- **Hover lifts** — card titles lift up (translateY -6px), dividers stretch (scaleX 1), text slides down (translateY 8px), all with different cubic-bezier easing curves. Pure CSS, no JS needed for the hover itself.
- **Slide-down "View project" button** — hidden at top-right of each card, scaleY(0) → scaleY(1) on hover.
- **Hero entrance animation** — name and tagline rise into place on load (CSS keyframe + staggered animation-delay).
- **Staggered scroll reveal** — cards fade in as you scroll down, with 80ms stagger between cards in each grid. Powered by IntersectionObserver in `script.js`.
- **Warm page background** — #FEFBF5 with a fade-out overlay effect on scroll.
- **Font stack** — Inter (weight 800 for headers), falling back to system sans-serif.
- **Three files** — `index.html`, `style.css`, `script.js` (~75 lines, zero dependencies).

### Style auditioning workflow

Designs are tried on separate branches, then merged to `master` to preview at `https://mikekyle.github.io`:

| Branch | Style | Status |
|---|---|---|
| `master` (current) | tobias-inspired — bold grid, massive headers | **Chosen** |
| `style/kokorobot-inspired` | Dark journal — emoji stamps, serif headings, left-border cards | Auditioned, not chosen |
| `style/tobias-inspired` | Same as master | Reference branch |
| First commit (`2075e68`) | Minimal clean CSS — sparse white/grey cards | Original |

To try a new design:
```bash
git checkout master
git checkout -b style/something-new
# … make changes, commit …
git checkout master && git merge style/something-new && git push origin master
# view at https://mikekyle.github.io, decide
```

To revert to a previous style: merge its branch (or cherry-pick the commit).

## Excluded projects

- **chorus_mail** — deliberately excluded from the public homepage. Not listed in index.html.

### Private repos

For repos that are private, add `card-private` to the card's class list (alongside `card`). This adds a 🔒 badge, disables the link, and shows "Private repo" text. Example:

```html
<div class="card card-private" style="background-color: #4a3535">
  <span class="card-button">Private</span>
  <h3 class="card-title">Project Name</h3>
  <span class="card-divider"></span>
  <p class="card-text">Description text</p>
</div>
```

Use a `<div>` (not `<a>`) since there's no link target.

## Deploy

```bash
git add -A && git commit -m "..." && git push
```

No build step, no CI — GitHub Pages serves static files directly from the repo root. User pages repos must be public and deploy from the default branch.