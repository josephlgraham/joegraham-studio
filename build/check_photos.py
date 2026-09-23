"""Flag soft or badly exposed photos before a trip page is published.

    python check_photos.py            # every journal/*/img folder
    python check_photos.py kauai      # one trip

Sharpness is the variance of the Laplacian on a 1000px copy. Low scores mean
a frame is probably blurry. Look at every flagged frame: some softness is on
purpose (shallow depth of field, motion). Anything soft by accident does not
get published. Exposure flags point at frames that could use light_edit.py.
"""
import glob, os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import laplace

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'journal')
SOFT = 60        # below this, check the frame by eye
VERY_SOFT = 25   # almost certainly blurry

trips = sys.argv[1:] or sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d, 'img')))
for trip in trips:
    rows = []
    for f in sorted(glob.glob(os.path.join(ROOT, trip, 'img', '*.jpg'))):
        im = Image.open(f).convert('L'); im.thumbnail((1000, 1000))
        a = np.asarray(im, dtype=np.float32)
        sharp = laplace(a).var()
        lum = a / 255
        flags = []
        if sharp < VERY_SOFT: flags.append('VERY SOFT')
        elif sharp < SOFT: flags.append('soft?')
        if np.median(lum) < 0.30: flags.append('dark')
        if np.percentile(lum, 95) < 0.60: flags.append('flat')
        rows.append((sharp, os.path.basename(f), flags))
    print('\n== %s ==' % trip)
    for sharp, name, flags in sorted(rows):
        if flags:
            print('  %-28s sharpness %6.0f  %s' % (name, sharp, ', '.join(flags)))
    print('  %d photos, %d flagged' % (len(rows), sum(1 for r in rows if r[2])))
