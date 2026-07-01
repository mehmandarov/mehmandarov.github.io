# `_data/visited.json` – schema spec

> **Purpose.** This file is consumed by `assets/js/visited-map.js` on the
> `/talks/` page of `mehmandarov.com` to render a Leaflet map of all
> countries and cities where Rustam has spoken. It must be valid JSON;
> Jekyll loads any file under `_data/` and exposes it as
> `site.data.<basename>`, so `_data/visited.json` is available as
> `site.data.visited` at build time and emitted as JSON into the
> rendered HTML.
>
> The file must conform strictly to the schema below. The top-level keys
> are exactly `countries`, `country_flags`, and `cities`.

---

## 1. Top-level shape

```json
{
  "countries":     ["..."],
  "country_flags": ["..."],
  "country_names": ["..."],
  "cities":        [ { } ],
  "stats":         { }
}
```

`countries`, `country_flags`, `country_names`, and `cities` are required
(even if `cities` is empty: `"cities": []`). `stats` is **optional**;
see §5. No other top-level keys are permitted.

---

## 2. `countries`

A flat array of **ISO-3166 alpha-2 country codes**, uppercase, two letters.
One entry per country, no duplicates.

```json
"countries": ["DK", "NO", "SE"]
```

### Rules

- **Uppercase ASCII**, exactly two letters. JSON strings are always
  quoted, so unlike the old YAML version there is no Norway-bug risk.
- **Use `XK` for Kosovo** (de-facto ISO alpha-2). The renderer falls
  back to matching by `ADMIN`/`NAME` if a feature lacks `XK`, so `XK`
  is still the correct entry to use here.
- **United Kingdom is `GB`** (not `UK`).
- **United States is `US`**, **Russia is `RU`**, **Türkiye is `TR`**, etc.
- **Sort alphabetically** by ISO code (stable diffs, easy review).
- No duplicates. The list is treated as a set.

### Effect

Every country whose code is present is **filled in the brand colour** on
the choropleth layer. Every other country is rendered in the neutral
background colour. Countries that contain pinned cities (see §3) are
automatically considered visited even if not listed; including them
explicitly is still recommended for completeness (some visited countries
may have no city-level pin).

---

## 3. `cities`

An array of objects. Each object describes one city visited at least once.

```json
{
  "name": "Oslo",
  "country": "NO",
  "lat": 59.9139,
  "lng": 10.7522,
  "first_visited": 2010,
  "conferences": [
    { "name": "JavaZone", "year": 2015, "url": "https://2015.javazone.no/" },
    { "name": "NDC Oslo", "year": 2019 },
    { "name": "Booster Conference" }
  ]
}
```

### Required fields

| Field | Type | Notes |
|---|---|---|
| `name` | string | City name in **English**, sentence case (`São Paulo`, not `SAO PAULO`). UTF-8 OK. |
| `country` | string | ISO-3166 alpha-2 code. Must also appear in the top-level `countries` array. |
| `lat` | number | Latitude in decimal degrees, WGS-84. 4 decimal places is plenty (~11 m). Negative for southern hemisphere. |
| `lng` | number | Longitude in decimal degrees, WGS-84. 4 decimal places. Negative for western hemisphere. |

### Optional fields

| Field | Type | Notes |
|---|---|---|
| `first_visited` | int (year) | Earliest year of any visit. Used in the popup as "since YYYY". Omit if unknown. |
| `conferences` | array of objects | See §3.1. **If absent or empty, no conferences section is shown in the popup.** |
| `aliases` | array of strings | Alternative spellings/transliterations (e.g. `["Kiev"]` for `Kyiv`), purely for human search/de-dupe; not rendered. |

### 3.1. `conferences` entry shape

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | **yes** | Conference name. Don't include the year in the name – use the `year` field. |
| `year`  | int    | no | 4-digit year. Omit if the talk is recurring / undated. |
| `url`   | string | no | Permalink. Prefer the event page over the conference homepage. **Must be `http://` or `https://`** – other schemes (`javascript:`, `data:`, etc.) are rejected by the renderer's `safeUrl()` filter and the entry is rendered without a link. |

If `conferences` is **omitted** or set to `[]`, the popup shows only
city, country, and (if present) `first_visited`. No "Conferences:"
heading.

### City rules

- **Sort cities alphabetically by `name`** (stable diffs).
- **No duplicate cities.** Multiple conferences in the same city go in
  one `conferences` array.
- **Coordinates** should point at the **city centre or main station**,
  not a specific venue. Precision: 4 decimal places.
- **Use the modern English name** where one exists (`Kyiv`, not `Kiev`).
  For places with no widely-used English exonym, the local form with
  diacritics is preferred (`Köln`, `Düsseldorf`, `Århus`, `São Paulo`,
  `Iași`, `Wrocław`).
- When in doubt about coordinates, use **OpenStreetMap Nominatim** as
  the source of truth (one-time lookup, not from the renderer).

---

## 4. `country_flags`

An array of standard Unicode country-flag emojis, one per visited
country, in the same alphabetical order as `countries`. There is a
helper in the codebase that returns the matching emoji from an ISO-2
code if you'd rather generate this list than hand-curate it.

---

## 5. `stats` (optional)

Free-form running totals shown on `talks.md`. **Not used by the map
renderer.** Omit the whole block if you don't want to surface these
numbers; if present, all three keys are required.

```json
"stats": {
  "total_events":    230,
  "total_countries": 33,
  "total_cities":    60
}
```

| Field | Type | Notes |
|---|---|---|
| `total_events`    | int | Cumulative count of talks / events / PC appearances. Updated by hand. |
| `total_countries` | int | Should match `countries.length`; kept explicit because the displayed number is a curated "spoken in" tally, not necessarily the same as every ISO code in the file. |
| `total_cities`    | int | Round/approximate number for display ("~60"); doesn't have to equal `cities.length`. |

---

## 6. Full minimal example

```json
{
  "countries": ["DK", "NO", "SE"],
  "country_flags": ["🇩🇰", "🇳🇴", "🇸🇪"],
  "cities": [
    {
      "name": "Copenhagen",
      "country": "DK",
      "lat": 55.6761,
      "lng": 12.5683,
      "first_visited": 2018,
      "conferences": [
        { "name": "JDays Copenhagen", "year": 2018 }
      ]
    },
    {
      "name": "Oslo",
      "country": "NO",
      "lat": 59.9139,
      "lng": 10.7522,
      "first_visited": 2013,
      "conferences": [
        { "name": "JavaZone", "year": 2015 },
        { "name": "NDC Oslo", "year": 2019, "url": "https://ndcoslo.com/" },
        { "name": "Booster Conference" }
      ]
    },
    {
      "name": "Stockholm",
      "country": "SE",
      "lat": 59.3293,
      "lng": 18.0686
    }
  ],
  "stats": {
    "total_events":    12,
    "total_countries": 3,
    "total_cities":    3
  }
}
```

---

## 7. Validation checklist

Before committing the file:

- [ ] Valid JSON: `python3 -m json.tool _data/visited.json > /dev/null`
- [ ] Top-level keys are a subset of `countries`, `country_flags`, `cities`, `stats`; the first three are required.
- [ ] All `countries` entries are 2 uppercase letters, no duplicates, sorted.
- [ ] `country_flags` is the same length as `countries`.
- [ ] All `cities[].country` values appear in `countries`.
- [ ] All `cities[].lat` are in `[-90, 90]`; `cities[].lng` are in `[-180, 180]`.
- [ ] No duplicate `(name, country)` pairs in `cities`.
- [ ] `cities` is sorted alphabetically by `name`.
- [ ] Every `conferences[].name` is non-empty.
- [ ] Every `conferences[].url` starts with `http://` or `https://`.
- [ ] If `stats` is present, it has exactly `total_events`, `total_countries`, `total_cities`, all non-negative integers.

One-shot all-in-one validator (run from repo root):

```bash
python3 - <<'PY'
import json
d = json.load(open("_data/visited.json"))
allowed = {"countries", "country_flags", "country_names", "cities", "stats"}
required = {"countries", "country_flags", "country_names", "cities"}
assert set(d) <= allowed and required <= set(d), "bad top-level keys"
c = d["countries"]
assert c == sorted(c) and len(c) == len(set(c)), "countries not sorted/unique"
assert all(len(x) == 2 and x.isupper() for x in c), "bad country codes"
assert len(d["country_flags"]) == len(c), "flags length mismatch"
assert len(d["country_names"]) == len(c), "names length mismatch"
known, seen = set(c), set()
for city in d["cities"]:
    for k in ("name", "country", "lat", "lng"):
        assert k in city, f"missing {k} in {city.get('name')}"
    assert city["country"] in known, f"{city['name']}: country not in countries[]"
    assert -90 <= city["lat"] <= 90, f"{city['name']}: bad lat"
    assert -180 <= city["lng"] <= 180, f"{city['name']}: bad lng"
    key = (city["name"], city["country"])
    assert key not in seen, f"duplicate {key}"
    seen.add(key)
    for conf in city.get("conferences", []):
        assert conf.get("name"), f"{city['name']}: conference missing name"
        if "url" in conf:
            assert conf["url"].startswith(("http://", "https://")), \
                f"{city['name']}: bad url scheme {conf['url']!r}"
if "stats" in d:
    s = d["stats"]
    assert set(s) == {"total_events", "total_countries", "total_cities"}, "bad stats keys"
    assert all(isinstance(s[k], int) and s[k] >= 0 for k in s), "stats must be non-negative ints"
print("ok")
PY
```

---

## 8. Reference source list (snapshot from `talks.md`, May 2026)

A snapshot at the time this spec was written:
**33 countries / ~60 cities / 230+ events**. Useful as a reference when
(re)populating the data file from scratch.

### Countries (33)

```
Belarus (BY), Belgium (BE), Bosnia and Herzegovina (BA), Brazil (BR),
Bulgaria (BG), Canada (CA), Czechia (CZ), Denmark (DK), Estonia (EE),
Germany (DE), Greece (GR), Ireland (IE), Italy (IT), Kosovo (XK),
Latvia (LV), Lithuania (LT), Morocco (MA), Netherlands (NL), Norway (NO),
Peru (PE), Poland (PL), Portugal (PT), Romania (RO), Russia (RU),
Serbia (RS), Slovenia (SI), Spain (ES), Sweden (SE), Switzerland (CH),
Türkiye (TR), Ukraine (UA), United Kingdom (GB), United States (US)
```

### Cities (de-duplicated alphabetical)

```
Agadir, Antwerp, Athens, Atlanta, Århus, Barcelona, Belgrade, Bergen,
Berlin, Bern, Broomfield, Brno, Brühl, Bucharest, Bydgoszcz, Chicago,
Cluj-Napoca, Coimbra, Copenhagen, Dublin, Düsseldorf, Ede, Gothenburg,
Grimstad, Hamburg, Iași, Istanbul, Kansas City, Kraków, Kyiv, Las Vegas,
Lima, Lublin, Ludwigsburg, Madison, Madrid, Minsk, Moscow, New York,
Oslo, Pittsburgh, Portorož, Prague, Prishtina, Riga, San Francisco,
Saint Petersburg, Sofia, Southampton, Stavanger, Stockholm, São Paulo,
Tallinn, Toronto, Trondheim, Tucson, Vilnius, Wrocław
```

