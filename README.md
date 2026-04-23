# mehmandarov.com [![Deploy Jekyll site to Pages](https://github.com/mehmandarov/mehmandarov.github.io/actions/workflows/jekyll.yml/badge.svg)](https://github.com/mehmandarov/mehmandarov.github.io/actions/workflows/jekyll.yml)

Source code for mehmandarov.com. Based on [Indigo](https://github.com/sergiokopplin/indigo) theme.

## Local development with Docker

You don't need Ruby, Bundler or Jekyll installed locally — just Docker. The
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

## Bugs and Issues

Have a bug or an issue with this site? [Open a new issue](https://github.com/mehmandarov/mehmandarov.github.io/issues) here on GitHub.

## Author

* [Rustam Mehmandarov](https://mehmandarov.com)

## Copyright and License

Copyright 2016-2026 Rustam Mehmandarov. 

* Code is released under the [Apache 2.0][1] license. 
* Blog/text contents are owned by Rustam Mehmandarov and cannot be reproduced without a prior agreement.


[1]: https://mehmandarov.github.io/LICENSE
