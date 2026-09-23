"""Approximate terrain model + contour extraction for journal maps.

Two ways to get contours:
  1. contours_from_model(...)  builds a rough terrain surface out of valley
     lines and peaks you supply. Good enough to look like a topo map.
  2. contours_from_dem(path, ...) reads a real USGS 3DEP GeoTIFF if you have
     one (needs rasterio). Always prefer this when you can get the data.
"""
import math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter


def _meters(lat_c):
    return 111320 * math.cos(math.radians(lat_c)), 110540


def _seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    L = vx * vx + vy * vy or 1e-9
    t = np.clip(((px - ax) * vx + (py - ay) * vy) / L, 0, 1)
    return np.hypot(px - (ax + t * vx), py - (ay + t * vy)), t


def _smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def model_height(LON, LAT, valleys, peaks, lat_c):
    """valleys: list of polylines, each point (lat, lon, floor_ft, floor_halfwidth_m,
    wall_width_m, rim_ft). peaks: (lat, lon, elev_ft, radius_m)."""
    MX, MY = _meters(lat_c)
    X, Y = LON * MX, LAT * MY
    H = None
    for line in valleys:
        best = np.full(LON.shape, 1e9)
        vals = {k: np.zeros(LON.shape) for k in "ehwr"}
        for i in range(len(line) - 1):
            a, b = line[i], line[i + 1]
            d, t = _seg_dist(X, Y, a[1] * MX, a[0] * MY, b[1] * MX, b[0] * MY)
            m = d < best
            best = np.where(m, d, best)
            for k, j in zip("ehwr", (2, 3, 4, 5)):
                vals[k] = np.where(m, a[j] + (b[j] - a[j]) * t, vals[k])
        h = vals["e"] + (vals["r"] - vals["e"]) * _smooth((best - vals["h"]) / vals["w"])
        H = h if H is None else np.minimum(H, h)
    # keep climbing gently once you are well away from any valley
    first = valleys[0]
    best = np.full(LON.shape, 1e9)
    for i in range(len(first) - 1):
        a, b = first[i], first[i + 1]
        d, _ = _seg_dist(X, Y, a[1] * MX, a[0] * MY, b[1] * MX, b[0] * MY)
        best = np.minimum(best, d)
    H = H + np.clip(best - 2500, 0, None) * 0.25
    for la, lo, z, r in peaks:
        dd = np.hypot((LON - lo) * MX, (LAT - la) * MY)
        H = np.maximum(H, z - (dd / r) ** 2 * 900)
    return H


def _trace(Z, W, Hpx, levels):
    ny, nx = Z.shape
    cs = plt.contour(np.linspace(0, W, nx), np.linspace(0, Hpx, ny), Z, levels=levels)
    out = []
    for lev, segs in zip(cs.levels, cs.allsegs):
        for s in segs:
            if len(s) < 4:
                continue
            d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in s[::2])
            out.append((int(lev), d, s))
    plt.close("all")
    return out


def contours_from_model(bbox, W, Hpx, valleys, peaks, step=250, lo=0, hi=15000, grid=360):
    lon0, lon1, lat0, lat1 = bbox
    ny = int(grid * Hpx / W)
    LON, LAT = np.meshgrid(np.linspace(lon0, lon1, grid), np.linspace(lat1, lat0, ny))
    Z = gaussian_filter(model_height(LON, LAT, valleys, peaks, (lat0 + lat1) / 2), 1.2)
    return _trace(Z, W, Hpx, np.arange(lo, hi, step))


def contours_from_dem(path, bbox, W, Hpx, step=250, lo=0, hi=15000):
    """Real elevation data. Download a GeoTIFF from apps.nationalmap.gov/downloader
    (Elevation Products / 3DEP), then: pip install rasterio."""
    import rasterio
    from rasterio.warp import transform_bounds
    lon0, lon1, lat0, lat1 = bbox
    with rasterio.open(path) as src:
        win = src.window(*transform_bounds("EPSG:4326", src.crs, lon0, lat0, lon1, lat1))
        Z = src.read(1, window=win, out_shape=(int(360 * Hpx / W), 360), masked=True)
        Z = np.flipud(np.asarray(Z, dtype=float)) if src.transform.e > 0 else np.asarray(Z, dtype=float)
    if Z.max() < 3000:           # source is metres
        Z = Z * 3.28084
    Z = gaussian_filter(Z, 1.0)
    return _trace(Z, W, Hpx, np.arange(lo, hi, step))


def _grid_from_npz(path, bbox, W, Hpx):
    """Crop a terrarium.py DEM (feet, north-up lat/lon grid) to bbox."""
    d = np.load(path)
    Z, (b0, b1, a0, a1) = d["z"], d["bbox"]
    lon0, lon1, lat0, lat1 = bbox
    ny, nx = Z.shape
    c0, c1 = int((lon0 - b0) / (b1 - b0) * nx), int(round((lon1 - b0) / (b1 - b0) * nx))
    r0, r1 = int((a1 - lat1) / (a1 - a0) * ny), int(round((a1 - lat0) / (a1 - a0) * ny))
    Z = Z[max(r0, 0):r1, max(c0, 0):c1].astype(float)
    step = max(1, int(Z.shape[1] / 420))        # ~2px per sample is plenty for an 830px map
    return gaussian_filter(Z[::step, ::step], 1.2)


def contours_from_npz(path, bbox, W, Hpx, step=500, lo=0, hi=15000):
    Z = _grid_from_npz(path, bbox, W, Hpx)
    return [(lev, _compact(s), s) for lev, _, s in _trace(Z, W, Hpx, np.arange(max(lo, step), hi, step))]


def _compact(s, closed=False):
    """Whole-pixel coordinates, dropping points that don't move the line."""
    pts, last = [], None
    for x, y in s:
        p = (round(x), round(y))
        if p != last:
            pts.append(p); last = p
    return "M" + " ".join(f"{x},{y}" for x, y in pts) + ("Z" if closed else "")


def coast_from_npz(path, bbox, W, Hpx, simplify=1):
    """Land as filled SVG paths (elevation > 0), for islands and coastlines."""
    Z = _grid_from_npz(path, bbox, W, Hpx)
    Z = np.pad(Z, 1, constant_values=-10)       # close shapes at the map edge
    ny, nx = Z.shape
    xs = np.linspace(-W / (nx - 2), W + W / (nx - 2), nx)
    ys = np.linspace(-Hpx / (ny - 2), Hpx + Hpx / (ny - 2), ny)
    cs = plt.contour(xs, ys, Z, levels=[1.5])
    out = []
    for s in cs.allsegs[0]:
        if len(s) < 12:                         # skip sea stacks and noise
            continue
        out.append(_compact(s[::simplify], closed=True))
    plt.close("all")
    return out
