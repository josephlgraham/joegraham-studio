"""Resize trip photos for the web and pull their camera data.

    python prep_photos.py ~/Pictures/Kauai out/kauai

Writes out/kauai/img/<slug>.jpg (long edge 1500, progressive JPEG) and
out/kauai/photos.json with size, capture time and exposure for each one. Camera
and lens names are left out on purpose: no camera model appears on the site.
The saved JPEGs carry no EXIF at all. Sort the JSON by DateTimeOriginal to get the order of the day.
"""
import json, os, sys
from PIL import Image, ImageOps

LONG_EDGE = 1500
QUALITY = int(os.environ.get("JPEG_QUALITY", 82))  # phone shots are busy; 72 keeps a page under budget
EXIF_TAGS = {306: "taken"}
SUB_TAGS = {37386: "focal_mm", 33437: "aperture", 33434: "shutter",
            34855: "iso", 36867: "taken", 41989: "focal_35mm"}


def main(src, dst):
    os.makedirs(os.path.join(dst, "img"), exist_ok=True)
    rows = []
    for name in sorted(os.listdir(src)):
        if not name.lower().endswith((".jpg", ".jpeg", ".png", ".heic", ".tif", ".tiff")):
            continue
        p = os.path.join(src, name)
        im = Image.open(p)
        ex, sub = im.getexif(), {}
        try:
            sub = ex.get_ifd(0x8769)
        except Exception:
            pass
        row = {"file": name, "slug": os.path.splitext(name)[0].lower().replace("_", "-")}
        for tag, key in EXIF_TAGS.items():
            if ex.get(tag):
                row[key] = str(ex.get(tag)).strip()
        for tag, key in SUB_TAGS.items():
            if sub.get(tag) is not None:
                row[key] = float(sub[tag]) if key in ("focal_mm", "aperture", "shutter") else str(sub[tag])
        if sub.get(34853) or ex.get(34853):
            row["has_gps"] = True
        im = ImageOps.exif_transpose(im).convert("RGB")
        row["orig_size"] = list(im.size)
        im.thumbnail((LONG_EDGE, LONG_EDGE), Image.LANCZOS)
        out = os.path.join(dst, "img", row["slug"] + ".jpg")
        im.save(out, quality=QUALITY, optimize=True, progressive=True)
        row["web"] = "img/" + row["slug"] + ".jpg"
        row["size"] = list(im.size)
        row["portrait"] = im.height > im.width
        rows.append(row)
        print(row["slug"], row["size"], row.get("focal_mm"), row.get("taken"))
    rows.sort(key=lambda r: r.get("taken", ""))
    json.dump(rows, open(os.path.join(dst, "photos.json"), "w"), indent=1)
    print(f"\n{len(rows)} photos -> {dst}/photos.json")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
