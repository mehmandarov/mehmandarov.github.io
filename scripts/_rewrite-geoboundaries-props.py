#!/usr/bin/env python3
"""
_rewrite-geoboundaries-props.py
-------------------------------
Post-processor for refresh-world-borders.sh. Reads the three tier files
mapshaper produced from geoBoundaries CGAZ ADM0 and rewrites each feature's
properties so visited-map.js can continue to match on ISO_A2 without change.

CGAZ properties: shapeGroup (ISO3), shapeName, shapeType.
Our output:      ISO_A2, ISO_A3, NAME, ADMIN.

Usage:
    python3 _rewrite-geoboundaries-props.py <tmp_dir> <out_dir>
"""
from __future__ import annotations
import json
import os
import sys

# ISO 3166-1 alpha-3 -> alpha-2. geoBoundaries CGAZ stores ISO3 in
# `shapeGroup`; our _data/visited.json uses ISO2, so we materialise both
# into the output GeoJSON to keep visited-map.js unchanged.
ISO3_TO_ISO2: dict[str, str] = {
    "AFG": "AF", "ALA": "AX", "ALB": "AL", "DZA": "DZ", "ASM": "AS",
    "AND": "AD", "AGO": "AO", "AIA": "AI", "ATA": "AQ", "ATG": "AG",
    "ARG": "AR", "ARM": "AM", "ABW": "AW", "AUS": "AU", "AUT": "AT",
    "AZE": "AZ", "BHS": "BS", "BHR": "BH", "BGD": "BD", "BRB": "BB",
    "BLR": "BY", "BEL": "BE", "BLZ": "BZ", "BEN": "BJ", "BMU": "BM",
    "BTN": "BT", "BOL": "BO", "BES": "BQ", "BIH": "BA", "BWA": "BW",
    "BVT": "BV", "BRA": "BR", "IOT": "IO", "BRN": "BN", "BGR": "BG",
    "BFA": "BF", "BDI": "BI", "CPV": "CV", "KHM": "KH", "CMR": "CM",
    "CAN": "CA", "CYM": "KY", "CAF": "CF", "TCD": "TD", "CHL": "CL",
    "CHN": "CN", "CXR": "CX", "CCK": "CC", "COL": "CO", "COM": "KM",
    "COG": "CG", "COD": "CD", "COK": "CK", "CRI": "CR", "CIV": "CI",
    "HRV": "HR", "CUB": "CU", "CUW": "CW", "CYP": "CY", "CZE": "CZ",
    "DNK": "DK", "DJI": "DJ", "DMA": "DM", "DOM": "DO", "ECU": "EC",
    "EGY": "EG", "SLV": "SV", "GNQ": "GQ", "ERI": "ER", "EST": "EE",
    "SWZ": "SZ", "ETH": "ET", "FLK": "FK", "FRO": "FO", "FJI": "FJ",
    "FIN": "FI", "FRA": "FR", "GUF": "GF", "PYF": "PF", "ATF": "TF",
    "GAB": "GA", "GMB": "GM", "GEO": "GE", "DEU": "DE", "GHA": "GH",
    "GIB": "GI", "GRC": "GR", "GRL": "GL", "GRD": "GD", "GLP": "GP",
    "GUM": "GU", "GTM": "GT", "GGY": "GG", "GIN": "GN", "GNB": "GW",
    "GUY": "GY", "HTI": "HT", "HMD": "HM", "VAT": "VA", "HND": "HN",
    "HKG": "HK", "HUN": "HU", "ISL": "IS", "IND": "IN", "IDN": "ID",
    "IRN": "IR", "IRQ": "IQ", "IRL": "IE", "IMN": "IM", "ISR": "IL",
    "ITA": "IT", "JAM": "JM", "JPN": "JP", "JEY": "JE", "JOR": "JO",
    "KAZ": "KZ", "KEN": "KE", "KIR": "KI", "PRK": "KP", "KOR": "KR",
    "KWT": "KW", "KGZ": "KG", "LAO": "LA", "LVA": "LV", "LBN": "LB",
    "LSO": "LS", "LBR": "LR", "LBY": "LY", "LIE": "LI", "LTU": "LT",
    "LUX": "LU", "MAC": "MO", "MKD": "MK", "MDG": "MG", "MWI": "MW",
    "MYS": "MY", "MDV": "MV", "MLI": "ML", "MLT": "MT", "MHL": "MH",
    "MTQ": "MQ", "MRT": "MR", "MUS": "MU", "MYT": "YT", "MEX": "MX",
    "FSM": "FM", "MDA": "MD", "MCO": "MC", "MNG": "MN", "MNE": "ME",
    "MSR": "MS", "MAR": "MA", "MOZ": "MZ", "MMR": "MM", "NAM": "NA",
    "NRU": "NR", "NPL": "NP", "NLD": "NL", "NCL": "NC", "NZL": "NZ",
    "NIC": "NI", "NER": "NE", "NGA": "NG", "NIU": "NU", "NFK": "NF",
    "MNP": "MP", "NOR": "NO", "OMN": "OM", "PAK": "PK", "PLW": "PW",
    "PSE": "PS", "PAN": "PA", "PNG": "PG", "PRY": "PY", "PER": "PE",
    "PHL": "PH", "PCN": "PN", "POL": "PL", "PRT": "PT", "PRI": "PR",
    "QAT": "QA", "REU": "RE", "ROU": "RO", "RUS": "RU", "RWA": "RW",
    "BLM": "BL", "SHN": "SH", "KNA": "KN", "LCA": "LC", "MAF": "MF",
    "SPM": "PM", "VCT": "VC", "WSM": "WS", "SMR": "SM", "STP": "ST",
    "SAU": "SA", "SEN": "SN", "SRB": "RS", "SYC": "SC", "SLE": "SL",
    "SGP": "SG", "SXM": "SX", "SVK": "SK", "SVN": "SI", "SLB": "SB",
    "SOM": "SO", "ZAF": "ZA", "SGS": "GS", "SSD": "SS", "ESP": "ES",
    "LKA": "LK", "SDN": "SD", "SUR": "SR", "SJM": "SJ", "SWE": "SE",
    "CHE": "CH", "SYR": "SY", "TWN": "TW", "TJK": "TJ", "TZA": "TZ",
    "THA": "TH", "TLS": "TL", "TGO": "TG", "TKL": "TK", "TON": "TO",
    "TTO": "TT", "TUN": "TN", "TUR": "TR", "TKM": "TM", "TCA": "TC",
    "TUV": "TV", "UGA": "UG", "UKR": "UA", "ARE": "AE", "GBR": "GB",
    "USA": "US", "UMI": "UM", "URY": "UY", "UZB": "UZ", "VUT": "VU",
    "VEN": "VE", "VNM": "VN", "VGB": "VG", "VIR": "VI", "WLF": "WF",
    "ESH": "EH", "YEM": "YE", "ZMB": "ZM", "ZWE": "ZW",
    # User-assigned / commonly used non-standard codes in geoBoundaries:
    "XKX": "XK",  # Kosovo (de-facto code; not in ISO 3166-1 yet)
}


def main(tmp_dir: str, out_dir: str) -> None:
    missing: set[str] = set()
    for tier in ("110m", "50m", "10m"):
        src = os.path.join(tmp_dir, f"world-{tier}.simplified.geo.json")
        dst = os.path.join(out_dir, f"world-{tier}.geo.json")
        with open(src) as fh:
            data = json.load(fh)
        for feat in data.get("features", []):
            p = feat.get("properties") or {}
            iso3 = (p.get("shapeGroup") or "").upper() or None
            iso2 = ISO3_TO_ISO2.get(iso3) if iso3 else None
            name = p.get("shapeName") or "Unknown"
            # Only warn for unmapped *real* ISO3 codes (three letters).
            # geoBoundaries assigns numeric pseudo-codes like "111", "112"
            # to disputed territories (Abyei, Aksai Chin, Gaza Strip, etc.)
            # which intentionally have no ISO_A2 and are not worth warning about.
            if iso3 and not iso2 and len(iso3) == 3 and iso3.isalpha():
                missing.add(iso3)
            feat["properties"] = {
                "ISO_A2": iso2,
                "ISO_A3": iso3,
                "NAME":   name,
                "ADMIN":  name,  # kept for visited-map.js fallback paths
            }
        with open(dst, "w") as fh:
            json.dump(data, fh, separators=(",", ":"))
        size_kb = os.path.getsize(dst) // 1024
        print(f"    wrote {dst}  ({size_kb} KB, {len(data['features'])} features)")

    if missing:
        print(
            f"    NOTE: no ISO_A2 mapping for {sorted(missing)} - extend the "
            f"ISO3_TO_ISO2 table if you have visited any of these.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("usage: _rewrite-geoboundaries-props.py <tmp_dir> <out_dir>")
    main(sys.argv[1], sys.argv[2])

