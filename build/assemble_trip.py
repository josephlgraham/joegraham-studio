"""Assemble a trip page from its source and map SVGs.

    python assemble_trip.py kauai

Reads build/<trip>-page.html, swaps in {{BASE_CSS}} (the shared journal CSS,
taken from the Yosemite reference page), {{MAP}} and {{MINI}}, and writes
journal/<trip>/index.html. Edit the -page.html source, not the output.
"""
import os, sys

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
trip = sys.argv[1]
src = open(os.path.join(here, f"{trip}-page.html"), encoding="utf-8").read()
yos = open(os.path.join(root, "journal", "yosemite", "index.html"), encoding="utf-8").read()
css = yos[yos.index("<style>") + 7:yos.index("</style>")]
css = css[:css.index("/* the zoom */")] + css[css.index("/* invitations to interact */"):]
css = css.replace(".mk-bridalveil text,.mk-yosemite text,.mk-glacier text,.mk-cathedral text,.m-elev{display:none}",
                  ".m-elev,.m-mark text{display:none}").strip("\n")
svg = lambda n: open(os.path.join(here, n), encoding="utf-8").read()
out = (src.replace("{{BASE_CSS}}", css)
          .replace("{{MAP}}", svg(f"{trip}-map.svg"))
          .replace("{{MINI}}", svg(f"{trip}-mini.svg")))
bad = [ch for ch in ("\u2014", "\u2013") if ch in out]
if bad:
    sys.exit("em/en dash found in copy: " + " ".join(bad))
open(os.path.join(root, "journal", trip, "index.html"), "w", encoding="utf-8").write(out)
print("wrote journal/%s/index.html (%d KB)" % (trip, len(out.encode()) // 1024))
