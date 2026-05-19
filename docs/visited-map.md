# Visited-places map (`/talks/`)

The map on **`/talks/`** is rendered by [Leaflet] from three layers:

1. **Visited countries** — your `_data/visited.json` (`countries` array) →
   filled in the accent colour on top of a public-domain world borders
   layer.
2. **City pins** — your `_data/visited.json` (`cities` array) → Leaflet
   markers with optional popup content (year, conferences).
3. **World borders** — three resolutions derived from [geoBoundaries]
   CGAZ ADM0 (CC-BY 4.0, attribution shown in the map control), vendored
   under `assets/data/`.

All assets are self-hosted. No tiles, no API keys, no third-party CDN.

## Files in the repo

| Path | Purpose | Edit when… |
|---|---|---|
| `_data/visited.json` | Source of truth: which countries + which city pins | You visit a new place |
| `docs/visited-data-spec.md` | Full JSON schema for `_data/visited.json` (fields, validation, gotchas) | You need to (re)populate the data file from scratch |
| `_includes/visited-map.html` | Drops `<div id="visited-map">` + script/style tags into the page | You want to change page-level wiring (e.g. change `data-base`, add a caption) |
| `assets/js/visited-map.js` | Renderer: tier swap, colours, popups, click-to-zoom | You want different behaviour (zoom thresholds, popup contents, etc.) |
| `assets/styles/visited-map.css` | Map container + popup styles, light + dark | Theme tweaks |
| `assets/vendor/leaflet/` | Vendored Leaflet 1.9.4 + marker images | You upgrade Leaflet (see below) |
| `assets/data/world-110m.geo.json` | Country borders, low detail (~100 KB) — initial paint | Refresh borders (see below) |
| `assets/data/world-50m.geo.json` | Country borders, medium detail (~1.8 MB) — loads at zoom ≥ 4 | Refresh borders |
| `assets/data/world-10m.geo.json` | Country borders, high detail (~8.6 MB) — loads at zoom ≥ 7 | Refresh borders |
| `scripts/refresh-world-borders.sh` | Downloads geoBoundaries CGAZ + simplifies into the three tiers | Used by the refresh procedure |
| `scripts/_rewrite-geoboundaries-props.py` | Post-processor: rewrites `shapeGroup`/`shapeName` → `ISO_A2`/`ISO_A3`/`NAME` so `visited-map.js` keeps working unchanged | Edit only if geoBoundaries renames properties or you find a country missing from the ISO3→ISO2 map |

Pages can opt into the map with `{% raw %}{% include visited-map.html %}{% endraw %}`.
Currently used on **`talks.md`** only.

## Updating the visited data

This is the common case — you visited a new city or country.

1. Open `_data/visited.json`.
2. Add the ISO-3166 alpha-2 code (uppercase) to the `countries` array.
   JSON strings are always quoted, so the YAML 1.1 "Norway bug"
   (`NO` → `false`) doesn't apply here.
3. Add a `cities` entry with `name`, `country`, `lat`, `lng`. Optionally
   add `first_visited` (year) and a `conferences` array — if `conferences`
   is absent or empty, the popup just shows the city name.
4. Commit + push. No build-step changes; Jekyll picks the file up from
   `site.data.visited` and the renderer injects it into the page.

Full schema lives at **[`docs/visited-data-spec.md`](visited-data-spec.md)**.
Quick sanity check that the JSON parses and Norway is present:

```bash
python3 -c 'import json;d=json.load(open("_data/visited.json"));assert "NO" in d["countries"];print("ok")'
# must print: ok
```

## Refreshing the world borders

The border GeoJSON files only need to change when:

- geoBoundaries ships a new CGAZ release that fixes a border you care
  about (they update quarterly), or
- You want to tweak how aggressively coords are simplified / rounded
  (edit the `TIERS=( … )` array in the refresh script).

```bash
./scripts/refresh-world-borders.sh
```

The script:

1. Downloads [geoBoundaries CGAZ ADM0][geoBoundaries-cgaz] (one ~380 MB
   file, **cached** at `$TMPDIR/refresh-world-borders-cache/` so iterating
   on simplification params doesn't re-download). Delete the cache to
   force a refresh.
2. Runs [mapshaper] three times with weighted Visvalingam simplification
   and grid-snapped coordinate precision — topology-preserving, so
   neighbouring countries never develop gaps along shared borders. Tiers:

   | Tier  | Retain | Precision (°) | Approx. resolution |
   |---|---|---|---|
   | 110 m | 0.2 % | 0.1            | ~10 km |
   | 50 m  | 1.5 % | 0.02           | ~2 km |
   | 10 m  | 7 %   | 0.005          | ~500 m |

3. Post-processes with `scripts/_rewrite-geoboundaries-props.py`:
   - renames `shapeGroup` (ISO-3166 alpha-3) → `ISO_A3`
   - derives `ISO_A2` from an inline ISO-3166 table (so
     `_data/visited.json`'s alpha-2 codes still match without changing the
     renderer)
   - renames `shapeName` → `NAME` and `ADMIN` (for the renderer's
     fallback paths)
   - drops everything else
   - writes compact JSON (no whitespace) to `assets/data/world-*.geo.json`

End result, as of the last refresh:

| Tier | Features | After simplify |
|---|---|---|
| 110m | 218 | **~100 KB** |
| 50m  | 218 | **~1.8 MB** |
| 10m  | 218 | **~8.6 MB** |

Eyeball the result, then commit only the files that actually changed.

### A note on disputed territories

geoBoundaries CGAZ ships 19 "disputed" polygons (Abyei, Aksai Chin,
Gaza Strip, West Bank, Western Sahara variants, Spratly/Paracel Is.,
Senkaku/Liancourt rocks, etc.) that have no ISO-3166 code; geoBoundaries
assigns them numeric pseudo-codes like `"111"`. The rewrite script
deliberately writes `ISO_A2: null` for these and the renderer treats them
as "not visited" (neutral fill), while the tooltip still shows the name.
This is correct behaviour for a personal-visits map: these features are
politically loaded and you wouldn't want one auto-filled in your "yes
I've been there" colour by mistake.

### Why three tiers instead of one

110m is enough for the world view but looks blocky once you zoom into
Europe. 10m looks great everywhere but is ~10 MB on first paint. The
renderer (`assets/js/visited-map.js`) listens for `zoomend` and swaps
the layer when the zoom level crosses one of these thresholds:

| Zoom | Tier |
|---|---|
| 0–3 | `world-110m.geo.json` |
| 4–6 | `world-50m.geo.json` |
| 7–8 | `world-10m.geo.json` |

The 50 m tier is also pre-warmed 1.5 s after first paint so the first
zoom into Europe is snappy. The 10 m tier is only fetched on demand.

To turn off pre-warming, comment out the `setTimeout(...) loadTier('50m')`
line near the bottom of `assets/js/visited-map.js`.

### Why we don't use TopoJSON

It would shave another 50–70 % off each file but adds a runtime dep
([`topojson-client`][tjc]). For this map's size budget the raw GeoJSON
files are already small enough; the extra dep buys us nothing.

## Upgrading Leaflet

```bash
cd assets/vendor/leaflet
curl -sSLO https://unpkg.com/leaflet@<VERSION>/dist/leaflet.css
curl -sSLO https://unpkg.com/leaflet@<VERSION>/dist/leaflet.js
cd images
for f in marker-icon.png marker-icon-2x.png marker-shadow.png layers.png layers-2x.png; do
    curl -sSLO "https://unpkg.com/leaflet@<VERSION>/dist/images/$f"
done
```

Then load `/talks/`, click around, check the browser console.

## Caveats

- The `compress` layout strips linefeeds, so any inline JavaScript on
  the page must use `/* ... */` block comments — never `//`. The renderer
  itself lives in a separate `.js` file (not subject to compression),
  but the include's inline `<script>window.__VISITED_DATA__ = ...</script>`
  is one line by design.
- **Disputed territories never auto-fill.** geoBoundaries assigns
  numeric pseudo-codes (e.g. `"111"`, `"112"`) to features without an
  ISO-3166 code; the rewrite script writes `ISO_A2: null` for those, and
  the renderer treats them as neutral. The tooltip still shows the
  feature's name. See the "disputed territories" section above.
- Scroll-wheel zoom is disabled by default and activates only after a
  click on the map. Otherwise the map traps the page scroll, which is
  hostile on mobile.
- **City pins are `L.circleMarker`s, not the classic teardrop icons.**
  Two reasons: (a) the teardrop's anchor is its bottom tip while the eye
  reads the bulb as the position, so when the map zooms the bulb appears
  to drift even though it doesn't; (b) the border-tier swap dramatically
  changes coastline detail (Manhattan is *part of* the NJ mainland at
  110 m, becomes a distinct island at 10 m), so a pin "near the coast"
  at low zoom can look "inland" after the swap. A centred dot makes it
  obvious that the marker is precise and the coast is the approximation.
  If you ever want pins back, the marker images are still vendored under
  `assets/vendor/leaflet/images/` — restore the `L.icon` block that the
  git history shows around the late-May-2026 changes.

[Leaflet]: https://leafletjs.com/
[geoBoundaries]: https://www.geoboundaries.org/
[geoBoundaries-cgaz]: https://github.com/wmgeolab/geoBoundaries/tree/main/releaseData/CGAZ
[mapshaper]: https://github.com/mbloch/mapshaper
[tjc]: https://github.com/topojson/topojson-client
