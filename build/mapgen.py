"""Draw a journal trip map (inline SVG, no tiles, no API keys).

    python mapgen.py map.json

The JSON holds the bounding box, the water and road lines, the numbered stops,
the unnumbered landmarks, and the terrain description. It writes two SVG
fragments: the big labelled map and the small sidebar map.
See yosemite-map.json for a filled-in example.
"""
import json, math, sys
import topo


def shore_paths(geojson, bbox, P, tol=0.00004):
    """Land polygons from a GeoJSON file, clipped to the bbox, as SVG path data.
    Used for city maps where the shoreline itself is the story (Boston)."""
    from shapely.geometry import shape, box
    from shapely.validation import make_valid
    lon0, lon1, lat0, lat1 = bbox
    pad = (lon1 - lon0) * 0.02
    g = make_valid(shape(json.load(open(geojson, encoding="utf-8"))["features"][0]["geometry"]))
    g = g.intersection(box(lon0 - pad, lat0 - pad, lon1 + pad, lat1 + pad)).simplify(tol)
    polys = [x for x in getattr(g, "geoms", [g]) if x.geom_type == "Polygon" and x.area > tol * tol * 20]
    out = []
    for poly in polys:
        rings = [poly.exterior] + list(poly.interiors)
        out.append("".join("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in (P(b, a) for a, b in r.coords)) + "Z"
                           for r in rings))
    return out

def build(cfg, mini=False):
    lon0, lon1, lat0, lat1 = cfg["bbox_mini" if mini and "bbox_mini" in cfg else "bbox"]
    W = cfg.get("width", 830)
    K = math.cos(math.radians((lat0 + lat1) / 2))
    H = round(W * (lat1 - lat0) / ((lon1 - lon0) * K))

    def P(lat, lon):
        return ((lon - lon0) / (lon1 - lon0) * W, (lat1 - lat) / (lat1 - lat0) * H)

    def path(pts, close=False):
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in (P(a, b) for a, b in pts))
        return d + ("Z" if close else "")

    uid = "mini" if mini else "map"
    out = [f'<svg class="map" viewBox="0 0 {W} {H}" role="img" aria-labelledby="t-{uid}">'
           f'<title id="t-{uid}">{cfg["alt"]}</title>',
           f'<rect width="{W}" height="{H}" class="{"m-sea" if cfg.get("terrain",{}).get("npz") or cfg.get("shores") else "m-land"}"/>']

    for sh in cfg.get("shores", []):            # historic or modern land outlines
        if mini and not sh.get("mini", True):
            continue
        box_ = cfg["bbox_mini" if mini and "bbox_mini" in cfg else "bbox"]
        out.append(f'<g class="{sh["class"]}">' + "".join(
            f'<path d="{d}" fill-rule="evenodd"/>' for d in shore_paths(sh["geojson"], box_, P)) + "</g>")

    t = cfg.get("terrain")
    C = []
    if t and t.get("npz"):                      # real DEM with a coastline (islands)
        npz = t["npz"]
        out.append("".join(f'<path d="{d}" class="m-land m-coast"/>'
                           for d in topo.coast_from_npz(npz, (lon0, lon1, lat0, lat1), W, H)))
        C = topo.contours_from_npz(npz, (lon0, lon1, lat0, lat1), W, H,
                                   step=t.get("step", 500), lo=t.get("lo", 0), hi=t.get("hi", 15000))
        if mini:
            C = [c for c in C if c[0] % t.get("index", 1000) == 0]
        out.append("".join(f'<path d="{d}" class="m-topo{" m-idx" if lev % t.get("index",1000)==0 else ""}"/>'
                           for lev, d, _ in C))
    elif t:
        if t.get("dem"):
            C = topo.contours_from_dem(t["dem"], (lon0, lon1, lat0, lat1), W, H,
                                       step=t.get("step", 250), lo=t.get("lo", 0), hi=t.get("hi", 15000))
        else:
            C = topo.contours_from_model((lon0, lon1, lat0, lat1), W, H,
                                         t["valleys"], t.get("peaks", []),
                                         step=t.get("step", 250), lo=t.get("lo", 0), hi=t.get("hi", 15000))
        out.append("".join(f'<path d="{d}" class="m-topo{" m-idx" if lev % t.get("index",1000)==0 else ""}"/>'
                           for lev, d, _ in C))
    for poly in cfg.get("flats", []):          # valley floor, lava field, lagoon, etc
        out.append(f'<path d="{path(poly, True)}" class="m-floor"/>')
    for w in cfg.get("water", []):
        out.append(f'<path d="{path(w)}" class="m-river"/>')
    for r in cfg.get("roads", []):
        out.append(f'<path d="{path(r)}" class="m-road"/>')

    if not mini:                                # elevation numbers on index lines
        placed = []
        for lev, d, s in C:
            if lev % t.get("index", 1000) or len(s) < 40:
                continue
            x, y = s[len(s) // 2]
            if x < 30 or x > W - 60 or y < 20 or y > H - 20:
                continue
            if any(abs(x - a) < 90 and abs(y - b) < 40 for a, b in placed):
                continue
            placed.append((x, y))
            out.append(f'<text x="{x:.0f}" y="{y+3:.0f}" class="m-elev" text-anchor="middle">{lev:,}</text>')

    for lab in cfg.get("notes", []):            # road names, river names
        x, y = P(lab["lat"], lab["lon"])
        rot = f' transform="rotate({lab["rotate"]} {x:.0f} {y:.0f})"' if lab.get("rotate") else ""
        out.append(f'<text x="{x:.0f}" y="{y:.0f}" class="m-{lab.get("kind","note")}"{rot}>{lab["text"]}</text>')

    for lm in cfg.get("landmarks", []):
        x, y = P(lm["lat"], lm["lon"])
        side = lm.get("side", "r")
        tx, ty, an = {"r": (x + 9, y + 4, "start"), "l": (x - 9, y + 4, "end"),
                      "b": (x, y + 18, "middle"), "b2": (x + 8, y + 16, "start"),
                      "t": (x, y - 11, "middle")}[side]
        slug = lm["name"].split()[0].lower()
        out.append(f'<g class="m-mark mk-{slug}"><path d="M{x:.1f},{y-6:.1f} l6,10 h-12z"/>'
                   f'<text x="{tx:.1f}" y="{ty:.1f}" text-anchor="{an}">{lm["name"]}</text></g>')

    R, F = (20, 20) if mini else (10, 11)
    for pin in cfg["pins"]:
        x, y = P(pin["lat"], pin["lon"])
        n, side = pin["n"], pin.get("side", "r")
        dx, dy, an = {"r": (14, 5, "start"), "l": (-14, 5, "end"),
                      "b": (0, 26, "middle"), "t": (0, -16, "middle")}[side]
        out.append(f'<g class="m-pin" data-pin="{n}" tabindex="0" role="link" '
                   f'aria-label="Go to stop {n}, {pin["name"]}">'
                   f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{R}"/>'
                   f'<text x="{x:.1f}" y="{y+F*0.36:.1f}" class="m-num" style="font-size:{F}px">{n}</text>'
                   f'<text x="{x+dx:.1f}" y="{y+dy:.1f}" text-anchor="{an}" class="m-lab">{pin["name"]}</text></g>')

    if not mini:                                 # scale bar, one mile
        x, y = W - 120, H - 20
        miles = cfg.get("scale_miles", 1)
        out.append(f'<g class="m-scale"><path d="M{x},{y} h{miles*W/((lon1-lon0)*K*69.0):.1f}"/>'
                   f'<text x="{x}" y="{y-6}">{miles} mile{"s" if miles != 1 else ""}</text></g>')
        out.append(f'<text x="{W-14}" y="26" text-anchor="end" class="m-n">N &#8593;</text>')
    out.append("</svg>")
    return "".join(out)


if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    open(cfg.get("out", "map.svg"), "w", encoding="utf-8").write(build(cfg, False))
    open(cfg.get("out_mini", "mini.svg"), "w", encoding="utf-8").write(build(cfg, True))
    print("wrote", cfg.get("out", "map.svg"), "and", cfg.get("out_mini", "mini.svg"))
