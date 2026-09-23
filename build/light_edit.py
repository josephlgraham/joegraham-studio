"""Gentle levels and a midtone lift for dark or flat JPGs.

    python light_edit.py staged_photos/ edited_photos/

Writes edited copies; originals are never touched. Run it on the staged
full-size frames BEFORE prep_photos.py, then prep the edited folder.
Add slugs to SKIP for frames that are already well exposed or dark on purpose.
Always look at a before/after of every changed frame before publishing.
"""
import glob, os, sys
import numpy as np
from PIL import Image, ImageOps, ImageEnhance

SKIP = set()  # slugs to leave alone, e.g. {'muir-woods-canopy'}

def edit(im):
    a = np.asarray(im, dtype=np.float32) / 255
    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    small = lum[::8, ::8]
    lo, hi = np.percentile(small, [0.5, 99.5])
    hi = max(hi, 0.80)                    # never stretch a dim highlight all the way to white
    lo = min(lo, 0.06)                    # keep real blacks
    a = np.clip((a - lo) / (hi - lo), 0, 1)
    med = np.median(np.clip((small - lo) / (hi - lo), 0, 1))
    g = np.clip(np.log(0.46) / np.log(max(med, 1e-3)), 0.72, 1.0) if med < 0.46 else 1.0
    a = a ** g
    out = Image.fromarray((a * 255 + .5).astype(np.uint8))
    return ImageEnhance.Color(out).enhance(1.06), (lo, hi, g)

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for f in sorted(glob.glob(src + '/*.jpg')):
    n = os.path.basename(f)[:-4]
    im = Image.open(f); exif = im.info.get('exif')
    im = ImageOps.exif_transpose(im).convert('RGB')
    if n in SKIP:
        im.save(os.path.join(dst, n + '.jpg'), quality=95); print(n, 'unchanged'); continue
    out, (lo, hi, g) = edit(im)
    out.save(os.path.join(dst, n + '.jpg'), quality=95)
    print('%-20s black %.2f white %.2f gamma %.2f' % (n, lo, hi, g))
