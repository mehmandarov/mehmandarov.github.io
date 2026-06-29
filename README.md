# mehmandarov.com [![Deploy Jekyll site to Pages](https://github.com/mehmandarov/mehmandarov.github.io/actions/workflows/jekyll.yml/badge.svg)](https://github.com/mehmandarov/mehmandarov.github.io/actions/workflows/jekyll.yml)

Source code for mehmandarov.com. Based on [Indigo][3] theme (forked and modified).

## Local development with Docker

You don't need Ruby, Bundler or Jekyll installed locally – just Docker. The
provided `Dockerfile` builds an image with all the right gems and runs
`jekyll serve` with live reload, watching the mounted source so the site
rebuilds automatically whenever you edit a file.

Build the image once (re-run only when `Gemfile` / `Gemfile.lock` change):

```bash
docker build -t mehmandarov-site .
```

Then start the dev server from the project root:

```bash
docker run --rm -it \
    -p 4000:4000 -p 35729:35729 \
    -v "$PWD":/site \
    mehmandarov-site
```

- Site: <http://localhost:4000>
- Edit any file locally → Jekyll rebuilds inside the container → the
  browser auto-refreshes via LiveReload (port `35729`).
- Stop with `Ctrl+C`; the `--rm` flag cleans up the container.

To run a one-off production build into `_site/` instead of the dev server:

```bash
docker run --rm -v "$PWD":/site mehmandarov-site \
    bundle exec jekyll build
```

## Search (Pagefind)

The site uses [Pagefind](https://pagefind.app/) for fully client-side, multilingual full-text search – no third-party service, no API key. The search index is built **automatically on every deploy** by the `Build search index (Pagefind)` step in `.github/workflows/jekyll.yml`.

Current UI/behavior:

- A fixed top-right search icon opens a search panel on every page.
- A dedicated `/search/` page is also available.
- Both use Pagefind **Component UI** (`pagefind-component-ui.js/css`).
- Results are forced to sort by post date descending via `assets/js/pagefind-date-sort.js`.

Language indexing:

- English by default.
- Posts tagged `norwegian` are indexed as Norwegian Bokmål (`nb`).
- You can override per page with `lang:` in front matter.

To enable search **locally**, build the index after Jekyll finishes:

```bash
npm ci
docker run --rm -v "$PWD":/site mehmandarov-site sh -c \
    "bundle exec jekyll build"
npm run build:search
```

Then restart the dev container (or serve `_site/` statically). Pagefind output (`_site/pagefind/`) is regenerated on every build and should not be committed.

## Visited-places map (`/talks/`)

The interactive map on **`/talks/`** is rendered client-side by Leaflet
against three resolution tiers of geoBoundaries CGAZ ADM0 borders
(vendored in `assets/data/`) and your `_data/visited.json`. No tiles,
no API keys.

- **Update the data** (new city/country): edit `_data/visited.json`.
- **Refresh the borders**: run `./scripts/refresh-world-borders.sh`.
- Renderer / refresh / caveats: [`docs/visited-map.md`](docs/visited-map.md).
- Full data schema: [`docs/visited-data-spec.md`](docs/visited-data-spec.md).

## Writing posts

### Description / lead

Add a `description:` to a post's front matter. It is shown as the lead
paragraph under the title (and used for SEO / social cards and listing
cards), so write it to spark interest:

```yaml
---
title: "My post"
description: A one-sentence hook that makes readers want to click.
---
```

### Callouts

Write a normal Markdown blockquote, then add a kramdown class on the next
line to turn it into a coloured callout (icon + tint added automatically):

```markdown
> **Tip:** Keep DTOs lean and let your JSON provider ignore extra fields.
{:.tip}
```

Available types: `note` (blue), `tip` (green), `important` (purple),
`warning` (amber), `caution` (red). A plain blockquote without a class
keeps the centred pull-quote style. Styling lives in
`assets/css/custom.css`.

## Bugs and Issues

Have a bug or an issue with this site? [Open a new issue][2] here on GitHub.

## Author

* [Rustam Mehmandarov](https://mehmandarov.com)

## Copyright and License

Copyright 2016-2026 Rustam Mehmandarov. 

* Code is released under the [Apache 2.0][1] license. 
* Blog/text contents are owned by Rustam Mehmandarov and cannot be reproduced without a prior agreement.


[1]: https://mehmandarov.github.io/LICENSE
[2]: https://github.com/mehmandarov/mehmandarov.github.io/issues
[3]: https://github.com/sergiokopplin/indigo
