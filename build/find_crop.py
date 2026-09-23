"""Line up a telephoto frame inside a wide frame, for a zoom feature.

    python find_crop.py wide.jpg tele.jpg

Prints the rectangle (as fractions of the wide frame) that the tele shot
occupies, ready to paste into the zoom widget, plus a match score. Anything
above about 0.5 is a real match; check the preview it writes.
"""
import sys
import cv2, numpy as np
from PIL import Image, ImageOps, ImageDraw


def load(p):
    return np.array(ImageOps.exif_transpose(Image.open(p)).convert("L"))


def main(wide_path, tele_path):
    big, small = load(wide_path), load(tele_path)
    # start from the focal length ratio when both files have it, else scan wide
    fw, ft = focal(wide_path), focal(tele_path)
    guesses = [fw / ft] if fw and ft else [1 / s for s in (4, 6, 8, 10, 12, 14, 18)]
    best = None
    for g in guesses:
        for k in (0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15):
            t = cv2.resize(small, None, fx=g * k, fy=g * k, interpolation=cv2.INTER_AREA)
            if t.shape[0] >= big.shape[0] or t.shape[1] >= big.shape[1]:
                continue
            r = cv2.matchTemplate(big, t, cv2.TM_CCOEFF_NORMED)
            _, mv, _, ml = cv2.minMaxLoc(r)
            if best is None or mv > best[0]:
                best = (mv, ml, t.shape)
    score, (x, y), (h, w) = best
    H, W = big.shape
    print(f"score {score:.2f}")
    print(f'x: {x/W:.5f}  y: {y/H:.5f}  w: {w/W:.5f}  h: {h/H:.5f}')
    im = ImageOps.exif_transpose(Image.open(wide_path)).convert("RGB")
    d = ImageDraw.Draw(im)
    d.rectangle((x / W * im.width, y / H * im.height,
                 (x + w) / W * im.width, (y + h) / H * im.height), outline="red", width=8)
    im.thumbnail((1000, 1000))
    im.save("crop_preview.jpg")
    print("preview -> crop_preview.jpg")


def focal(p):
    try:
        return float(Image.open(p).getexif().get_ifd(0x8769).get(37386))
    except Exception:
        return None


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
