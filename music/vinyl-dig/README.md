# Vinyl dig (phone page)

Self-contained static page for the horses-face ≥4★ vinyl shortlist.

- `index.html` — mobile-first dark UI (search, expandable rows, alt listings)
- `art/` — cached Discogs thumbs for the 30 cheapest enriched albums

Rebuild from repo root:

```bash
.venv/bin/python enrich_shortlist.py   # top 30 + alts + art → shortlist_enriched.json
.venv/bin/python build_site.py         # → site/index.html
```

Filters: vinyl only · media ≥ VG · postage ≤ £15 GBP · all master vinyl pressings.
