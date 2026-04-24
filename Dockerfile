# Dockerfile for local Jekyll development with live reload.
#
# Builds a self-contained image with Ruby + Jekyll + the site's gems,
# then runs `jekyll serve` watching the mounted source so any local
# change triggers an automatic rebuild.
#
# See README.md ("Local development with Docker") for usage.

FROM ruby:4.0-alpine

# Build deps for native gems (eventmachine, ffi, nokogiri, etc.) plus
# tzdata so Jekyll's date filters behave correctly.
RUN apk add --no-cache \
        build-base \
        gcc \
        git \
        tzdata \
        nodejs \
        npm

WORKDIR /site

# Install gems first so this layer is cached when only site content changes.
COPY Gemfile Gemfile.lock* ./
RUN bundle install

# The actual site is bind-mounted at runtime; nothing else to copy here.

EXPOSE 4000 35729

# --force_polling makes the watcher reliable on macOS / Windows bind mounts.
# --livereload auto-refreshes the browser on rebuilds.
CMD ["bundle", "exec", "jekyll", "serve", \
     "--host", "0.0.0.0", \
     "--port", "4000", \
     "--livereload", \
     "--livereload-port", "35729", \
     "--force_polling", \
     "--incremental"]

