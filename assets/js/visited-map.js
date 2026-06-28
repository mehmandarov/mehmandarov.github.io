/* visited-map.js
 * Renders the "places I've been" map on /talks/.
 * Tier A1 + A2: starts on world-110m, swaps to world-50m at zoom >= 4
 * and to world-10m at zoom >= 7. Tier A3: click a country to fit its
 * bounds. Pure vector layers, no tile server.
 *
 * Data: window.__VISITED_DATA__ (countries[], cities[]) is injected by
 * the Liquid include from _data/visited.json.
 *
 * Compress layout safety: every comment uses block syntax; no // anywhere
 * outside of strings.
 */
(function () {
    'use strict';

    var el = document.getElementById('visited-map');
    if (!el || typeof L === 'undefined' || !window.__VISITED_DATA__) return;
    /* L2: idempotency. If the include is rendered twice on the same page,
     * or the script is re-executed (dev reload, view-transitions, etc.),
     * Leaflet throws "Map container is already initialized". */
    if (el._leaflet_id) return;

    var DATA = window.__VISITED_DATA__;
    var BASE = el.getAttribute('data-base') || '';
    var GEO  = function (name) { return BASE + '/assets/data/' + name; };

    /* Visited set: union of explicit countries list and inferred from city pins. */
    var visited = new Set((DATA.countries || []).map(function (c) { return c.toUpperCase(); }));
    (DATA.cities || []).forEach(function (city) {
        if (city.country) visited.add(String(city.country).toUpperCase());
    });

    /* Theme: read CSS custom properties so light/dark inherits from prefers-color-scheme. */
    function cssVar(name, fallback) {
        var v = getComputedStyle(el).getPropertyValue(name);
        return (v && v.trim()) || fallback;
    }
    var visitedFill  = cssVar('--vm-visited-fill',  '#4a7fc4');
    var visitedEdge  = cssVar('--vm-visited-edge',  '#2c5fa3');
    var neutralFill  = cssVar('--vm-neutral-fill',  '#e8e8ed');
    var neutralEdge  = cssVar('--vm-neutral-edge',  '#b8b8c0');
    var oceanBg      = cssVar('--vm-ocean',         '#f4f4f7');
    el.style.background = oceanBg;

    /* ---- Marker style (fix: "markers drift on zoom") --------------------
     * Previously we used the classic teardrop pin icon. That had two
     * problems:
     *   (1) The icon's anchor is its bottom tip, but the eye reads the
     *       bulb as the "position" – so when the map zooms, the bulb
     *       appears to shift while the tip stays put (it doesn't move,
     *       but it looks like it does).
     *   (2) When the country-border tier swaps (110m -> 50m -> 10m), the
     *       coastline sharpens dramatically – NYC's coast at 110m is
     *       generalised onto the NJ mainland; at 10m Manhattan becomes
     *       its own island. The marker stays at -74.006, 40.7128 the
     *       whole time, but the *coast around it* moves, so the marker
     *       appears to "drift inland".
     * Switching to a circle marker fixes (1) entirely (no anchor offset)
     * and makes (2) visually obvious – the dot is precise, the border
     * is the approximation. */
    var markerStyle = {
        pane: 'vm-pins',
        radius: 7,
        weight: 2,
        color: '#ffffff',                        /* stroke: white outline so the dot pops against any background */
        fillColor: cssVar('--vm-marker-fill', '#e53935'),
        fillOpacity: 1,
        opacity: 1
    };
    /* Slightly larger style applied on hover so mouse/finger targets are
     * forgiving without making the resting dots visually heavy. */
    var markerHoverStyle = { radius: 10, weight: 2 };

    var map = L.map(el, {
        /* fix #4: start wider than a fixed zoom – fitBounds below frames
         * the "interesting" part of the globe (skips polar extremes).
         * worldCopyJump intentionally off – for a "visited" map it adds
         * no value and can cause overlay layers to render in an
         * unexpected world copy. */
        minZoom: 1,
        maxZoom: 8,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false  /* user enables via click – see toggle below */
    });
    map.fitBounds([[-58, -170], [78, 178]], { animate: false });

    /* Dedicated pane for city pins, stacked above the overlay pane (where
     * country GeoJSON renders) but below the tooltip + popup panes so
     * labels still appear on top of the dots.
     *
     * Leaflet's default pane z-indexes (for reference):
     *   tilePane     200
     *   overlayPane  400   <- country GeoJSON polygons
     *   shadowPane   500
     *   vm-pins      550   <- our city dots (between shadow and markers)
     *   markerPane   600
     *   tooltipPane  650   <- city + country labels
     *   popupPane    700
     */
    map.createPane('vm-pins');
    map.getPane('vm-pins').style.zIndex = 550;
    /* Also make sure the pane is interactive (default true, set explicitly
     * to defend against site-wide CSS that disables pointer-events). */
    map.getPane('vm-pins').style.pointerEvents = 'auto';
    map.attributionControl.setPrefix('').addAttribution('Borders: <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener">geoBoundaries</a> (CC-BY 4.0) | <a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>');

    /* Click-to-toggle scroll wheel zoom so the page is still scrollable on touch/desktop. */
    map.on('click', function () {
        if (!map.scrollWheelZoom.enabled()) map.scrollWheelZoom.enable();
    });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

    /* ---- Country layer with hot-swap on zoom (A2) ------------------------ */

    var currentTier = null;          /* '110m' | '50m' | '10m' */
    var loadingTier = null;
    var countryLayer = null;
    var loaded = {};                 /* tier -> parsed GeoJSON */

    function tierForZoom(z) {
        if (z >= 7) return '10m';
        if (z >= 4) return '50m';
        return '110m';
    }

    function isoOf(props) {
        /* Natural Earth uses ISO_A2; -99 for disputed (Kosovo, Norway in some versions).
         * Fall back to ISO_A2_EH then to ADMIN/NAME match. */
        var iso = (props.ISO_A2 && props.ISO_A2 !== '-99') ? props.ISO_A2
                : (props.ISO_A2_EH && props.ISO_A2_EH !== '-99') ? props.ISO_A2_EH
                : null;
        return iso ? iso.toUpperCase() : null;
    }
    function nameMatch(props) {
        var n = (props.ADMIN || props.NAME || '').toUpperCase();
        /* Hard-coded fallbacks for the handful of NE features with ISO_A2 = -99 we care about. */
        if (n === 'KOSOVO') return 'XK';
        if (n === 'NORWAY') return 'NO';
        if (n === 'FRANCE') return 'FR';
        return null;
    }
    function isVisited(props) {
        var code = isoOf(props) || nameMatch(props);
        return code !== null && visited.has(code);
    }
    function styleFeature(feature) {
        var v = isVisited(feature.properties);
        return {
            color:       v ? visitedEdge : neutralEdge,
            weight:      v ? 0.8 : 0.4,
            fillColor:   v ? visitedFill : neutralFill,
            fillOpacity: v ? 0.85 : 1.0
        };
    }
    /* ---- Click-to-zoom helper (fix #2) -----------------------------------
     * Many countries are MultiPolygons whose outliers span the antimeridian
     * (Russia, USA via Alaska/Aleutians) or are far from the mainland
     * (Norway+Svalbard+Jan Mayen, France+French Guiana, etc.). Using
     * `layer.getBounds()` on those returns a near-global box, and
     * `fitBounds` zooms back out to "world". Instead, find the largest
     * polygon in the feature's geometry by bbox area and fit to that. */
    function largestPolygonBounds(feature) {
        var g = feature && feature.geometry;
        if (!g) return null;
        var polys = g.type === 'MultiPolygon' ? g.coordinates
                  : g.type === 'Polygon'      ? [g.coordinates]
                  : null;
        if (!polys || polys.length === 0) return null;
        var best = null, bestArea = -1;
        polys.forEach(function (poly) {
            var ring = poly[0]; /* outer ring of this polygon */
            if (!ring || ring.length === 0) return;
            var minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
            for (var i = 0; i < ring.length; i++) {
                var lng = ring[i][0], lat = ring[i][1];
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            }
            var area = (maxLng - minLng) * (maxLat - minLat);
            if (area > bestArea) {
                bestArea = area;
                best = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
            }
        });
        return best;
    }

    function onEachFeature(feature, layer) {
        var name = feature.properties.ADMIN || feature.properties.NAME || 'Unknown';
        /* L15: Leaflet writes tooltip strings via innerHTML – escape even though
         * Natural Earth names are trusted-by-source, as defence-in-depth in case
         * the dataset is ever swapped for a community-edited one. */
        layer.bindTooltip(escHtml(name), { sticky: true, direction: 'top', opacity: 0.9 });
        layer.on('click', function (ev) {
            var bounds = largestPolygonBounds(feature) || layer.getBounds();
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 6 });
            L.DomEvent.stopPropagation(ev);
        });
    }

    function applyTier(tier, geo) {
        if (countryLayer) map.removeLayer(countryLayer);
        countryLayer = L.geoJSON(geo, { style: styleFeature, onEachFeature: onEachFeature });
        countryLayer.addTo(map);
        currentTier = tier;
    }

    function loadTier(tier) {
        if (currentTier === tier || loadingTier === tier) return;
        if (loaded[tier]) { applyTier(tier, loaded[tier]); return; }
        loadingTier = tier;
        var fname = tier === '110m' ? 'world-110m.geo.json'
                  : tier === '50m'  ? 'world-50m.geo.json'
                                    : 'world-10m.geo.json';
        /* Bound the request so a hung fetch can't permanently jam this
         * tier. Without this, loadingTier === tier forever and every future
         * zoomend that resolves to the same tier is silently ignored. */
        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
        fetch(GEO(fname), ctrl ? { signal: ctrl.signal } : undefined)
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function (geo) {
                clearTimeout(timer);
                loaded[tier] = geo;
                if (tierForZoom(map.getZoom()) === tier) applyTier(tier, geo);
                loadingTier = null;
            })
            .catch(function (err) {
                clearTimeout(timer);
                loadingTier = null;
                console.error('[visited-map] failed to load ' + fname + ':', err);
            });
    }

    map.on('zoomend', function () { loadTier(tierForZoom(map.getZoom())); });

    /* ---- City pins ------------------------------------------------------- */

    var pinLayer = L.layerGroup().addTo(map);

    function escHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /* Defence-in-depth: only permit http(s) URLs in popup links.
     * Returns the trimmed URL when safe, null otherwise. */
    function safeUrl(u) {
        var s = String(u == null ? '' : u).trim();
        return /^https?:\/\//i.test(s) ? s : null;
    }

    function popupHtml(city) {
        var lines = [];
        lines.push('<strong>' + escHtml(city.name) + '</strong>');
        if (city.country) lines.push('<span class="vm-country">' + escHtml(city.country) + '</span>');
        if (city.first_visited) lines.push('<div class="vm-since">since ' + escHtml(city.first_visited) + '</div>');
        if (Array.isArray(city.conferences) && city.conferences.length > 0) {
            lines.push('<div class="vm-conf-heading">Conferences:</div>');
            lines.push('<ul class="vm-conf-list">');
            city.conferences.forEach(function (conf) {
                if (!conf || !conf.name) return;
                var label = escHtml(conf.name) + (conf.year ? ' (' + escHtml(conf.year) + ')' : '');
                var safe = safeUrl(conf.url);
                var item = safe
                    ? '<a href="' + escHtml(safe) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>'
                    : label;
                lines.push('<li>' + item + '</li>');
            });
            lines.push('</ul>');
        }
        return lines.join('');
    }

    (DATA.cities || []).forEach(function (city) {
        if (typeof city.lat !== 'number' || typeof city.lng !== 'number') return;
        /* L8: skip cities without a label rather than render "undefined". */
        if (!city.name || typeof city.name !== 'string') return;

        var visible = L.circleMarker([city.lat, city.lng], markerStyle);
        /* Invisible larger circle on top of the visible one, used purely as
         * a forgiving hit target for mouse + touch (Leaflet's path hit
         * detection follows the path itself, so we widen it explicitly). */
        var hit = L.circleMarker([city.lat, city.lng], {
            pane: 'vm-pins',
            radius: 16, weight: 0, opacity: 0, fillOpacity: 0,
            interactive: true, bubblingMouseEvents: false
        });

        /* Escape tooltip text (Leaflet renders it via innerHTML). */
        hit.bindTooltip(escHtml(city.name), { direction: 'top', offset: [0, -8], opacity: 0.95 })
           .bindPopup(popupHtml(city), { maxWidth: 280 });

        hit.on('mouseover', function () { visible.setStyle(markerHoverStyle); });
        hit.on('mouseout',  function () { visible.setStyle({ radius: markerStyle.radius, weight: markerStyle.weight }); });

        visible.addTo(pinLayer);
        hit.addTo(pinLayer);
    });

    /* ---- Boot ------------------------------------------------------------ */
    loadTier('110m');

    /* A2 lookahead optimisation: pre-warm 50m a moment after first paint so
     * the first zoom into Europe is snappy. Comment out to keep first paint
     * absolutely minimal. */
    setTimeout(function () { loadTier('50m'); }, 1500);

    /* Only expose the map handle in dev contexts. In production this is
     * a free-for-all debug hook (anyone can call window.__visitedMap.remove(),
     * scrape data, etc.). Harmless but noisy; keep it for local work only. */
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '' || /[?&]debug\b/.test(location.search)) {
        window.__visitedMap = map;
    }
})();

