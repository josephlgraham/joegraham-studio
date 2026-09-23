"""Download real elevation for a map from the public AWS Terrain Tiles.

    python terrarium.py kauai-map.json

Reads the map's bbox, stitches Terrarium PNG tiles
(s3.amazonaws.com/elevation-tiles-prod, no API key) and saves
<trip>-dem.npz next to the config: elevation in feet on a regular lat/lon grid.
Point the map's "terrain": {"npz": "..."} at it. Use this for islands and
coasts, where the zero contour doubles as the shoreline.
"""
import io, json, math, os, sys, urllib.request
import numpy as np
from PIL import Image

URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"


def tile_xy(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def main(cfg_path, z=12):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    lon0, lon1, lat0, lat1 = cfg["bbox"]
    x0, y0 = tile_xy(lat1, lon0, z)
    x1, y1 = tile_xy(lat0, lon1, z)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    W, H = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
    mosaic = np.zeros((H, W), dtype=np.float32)
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            raw = urllib.request.urlopen(URL.format(z=z, x=tx, y=ty), timeout=30).read()
            a = np.asarray(Image.open(io.BytesIO(raw)).convert("RGB"), dtype=np.float32)
            e = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
            mosaic[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = e
    # resample the Web Mercator mosaic onto a regular lat/lon grid
    nx = 900
    ny = int(nx * (lat1 - lat0) / ((lon1 - lon0) * math.cos(math.radians((lat0 + lat1) / 2))))
    lons = np.linspace(lon0, lon1, nx)
    lats = np.linspace(lat1, lat0, ny)
    px = np.array([(tile_xy(lat1, lo, z)[0] - tx0) * 256 for lo in lons])
    py = np.array([(tile_xy(la, lon0, z)[1] - ty0) * 256 for la in lats])
    Z = mosaic[np.clip(py.astype(int), 0, H - 1)][:, np.clip(px.astype(int), 0, W - 1)]
    out = os.path.join(os.path.dirname(cfg_path) or ".", os.path.basename(cfg_path).replace("-map.json", "-dem.npz"))
    np.savez_compressed(out, z=(Z * 3.28084).astype(np.float32), bbox=np.array([lon0, lon1, lat0, lat1]))
    print("wrote", out, Z.shape, "max %.0f ft" % (Z.max() * 3.28084))


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 12)
