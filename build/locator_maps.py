"""Draw the small locator maps that sit in the "coming soon" journal tiles.

    python build/locator_maps.py

Writes journal/img/soon-<trip>.svg (3:2, no text; the tile carries the label).
Outlines come from build/locator-data/: US states (PublicaMundi us-states.json)
and Canada/Mexico (Natural Earth 1:50m admin 0). Public domain / open data.
Once a trip is built its tile gets a real photo and its entry here can go.
"""
import json, math, os
from shapely.geometry import shape, box
from shapely.ops import unary_union

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(HERE, "locator-data")
W, H = 600, 400

# trip: focus states, pin (lat, lon), optional shaded area (lon0, lat0, lon1, lat1), optional view bbox
TRIPS = {
    "palm-springs": {"focus": ["California"], "pin": (33.830, -116.545)},
    "san-francisco": {"focus": ["California"], "pin": (37.775, -122.419)},
    "los-angeles": {"focus": ["California"], "pin": (34.052, -118.244)},
    "alabama": {"focus": ["Alabama"], "pin": (33.519, -86.810)},
    "yellowstone": {"focus": ["Wyoming", "Montana", "Idaho"], "pin": (44.460, -110.828),
                    "area": (-111.155, 44.133, -109.828, 45.108),
                    "view": (-114.2, 42.2, -106.8, 46.9)},
}


def load():
    states = {f["properties"]["name"]: shape(f["geometry"])
              for f in json.load(open(os.path.join(DATA, "us-states.json"), encoding="utf-8"))["features"]}
    others = [shape(f["geometry"])
              for f in json.load(open(os.path.join(DATA, "neighbors.json"), encoding="utf-8"))["features"]]
    return states, others


def svg_for(cfg, states, others):
    if "view" in cfg:
        lon0, lat0, lon1, lat1 = cfg["view"]
    else:
        lon0, lat0, lon1, lat1 = unary_union([states[s] for s in cfg["focus"]]).bounds
    # pad, then grow one side so the view is exactly 3:2 on screen
    K = math.cos(math.radians((lat0 + lat1) / 2))
    cx, cy = (lon0 + lon1) / 2, (lat0 + lat1) / 2
    w, h = (lon1 - lon0) * K * 1.18, (lat1 - lat0) * 1.18
    if w / h < W / H:
        w = h * W / H
    else:
        h = w * H / W
    lon0, lon1 = cx - w / K / 2, cx + w / K / 2
    lat0, lat1 = cy - h / 2, cy + h / 2
    view = box(lon0, lat0, lon1, lat1)

    def P(lon, lat):
        return (lon - lon0) / (lon1 - lon0) * W, (lat1 - lat) / (lat1 - lat0) * H

    def d(geom, tol):
        g = geom.intersection(view.buffer(0.5)).simplify(tol)
        out = []
        for poly in getattr(g, "geoms", [g]):
            if poly.geom_type != "Polygon" or poly.is_empty:
                continue
            for ring in [poly.exterior] + list(poly.interiors):
                out.append("M" + " L".join("%.1f,%.1f" % P(x, y) for x, y in ring.coords) + "Z")
        return "".join(out)

    tol = (lon1 - lon0) / 900
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">' % (W, H),
             '<rect width="%d" height="%d" fill="#d9e7f1"/>' % (W, H)]
    # faint graticule, like a survey sheet
    grid = []
    for lo in range(math.ceil(lon0), math.floor(lon1) + 1):
        x = P(lo, 0)[0]; grid.append("M%.1f,0V%d" % (x, H))
    for la in range(math.ceil(lat0), math.floor(lat1) + 1):
        y = P(0, la)[1]; grid.append("M0,%.1fH%d" % (y, W))
    for g in others:
        s = d(g, tol)
        if s:
            parts.append('<path d="%s" fill="#f4f4ef" stroke="#cdd1c6" stroke-width="1"/>' % s)
    for name, g in states.items():
        if name in cfg["focus"] or not g.intersects(view):
            continue
        parts.append('<path d="%s" fill="#f4f4ef" stroke="#cdd1c6" stroke-width="1"/>' % d(g, tol))
    for name in cfg["focus"]:
        parts.append('<path d="%s" fill="#d2e0bb" stroke="#7b6546" stroke-width="1.8" stroke-linejoin="round"/>'
                     % d(states[name], tol))
    parts.append('<path d="%s" fill="none" stroke="#3d73a8" stroke-width=".6" opacity=".18"/>' % "".join(grid))
    if "area" in cfg:
        a0, b0, a1, b1 = cfg["area"]
        (x0, y0), (x1, y1) = P(a0, b1), P(a1, b0)
        parts.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="4" fill="#b9cba7" '
                     'stroke="#6f8f5a" stroke-width="1.4" stroke-dasharray="5 3"/>' % (x0, y0, x1 - x0, y1 - y0))
    x, y = P(cfg["pin"][1], cfg["pin"][0])
    parts.append('<circle cx="%.1f" cy="%.1f" r="17" fill="#ff6600" opacity=".18"/>' % (x, y))
    parts.append('<circle cx="%.1f" cy="%.1f" r="7.5" fill="#ff6600" stroke="#fff" stroke-width="2.5"/>' % (x, y))
    parts.append("</svg>")
    return "".join(parts)


def main():
    states, others = load()
    out_dir = os.path.join(ROOT, "journal", "img")
    for trip, cfg in TRIPS.items():
        p = os.path.join(out_dir, "soon-%s.svg" % trip)
        open(p, "w", encoding="utf-8").write(svg_for(cfg, states, others))
        print(p, os.path.getsize(p) // 1024, "KB")


if __name__ == "__main__":
    main()
