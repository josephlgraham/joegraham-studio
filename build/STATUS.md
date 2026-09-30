# Journal rebuild: status and how to pick it up

Last updated September 30, 2026. Read this first in a new session, then
`VOICE.md` (how pages sound) and `HANDOFF.md` (how pages are built).

Everything so far lives on the local branch `journal-rework`. It has **not been
pushed**. Joe wants every trip built locally before anything goes live.

---

## Where things stand

| Trip | Page | Status |
|---|---|---|
| Yosemite | `journal/yosemite/index.html` (edited directly, no source file) | Done, new voice |
| Kauaʻi | `build/kauai-page.html` → `journal/kauai/` | Done, new voice |
| The Big Island | `build/big-island-page.html` → `journal/big-island/` | Done, new voice. One open question (below) |
| The North Coast | `build/north-coast-page.html` → `journal/north-coast/` | Done, new voice, photos light-edited |
| Palm Springs (with Joshua Tree) | not started | Joe has an interactive idea; ask before designing |
| San Francisco | not started | |
| Los Angeles | not started | |
| Alabama (whole state, one page) | not started | Use Encyclopedia of Alabama; "lift all boats" |
| Georgia | not started | Stage Kitchen cocktail shot goes here |
| Boston | `build/boston-page.html` → `journal/boston/` | Done, new voice. 1795 shoreline map toggle + Gardner empty-frame reveal |
| Yellowstone | not started | First national park, made "empty" by removal |

The trip picker is `journal.html` (tile grid with Small/Medium/Large).
Add a tile for each finished trip; placeholders exist for unfinished ones.

## Open questions for Joe

1. ~~Big Island lava lake photo~~ Done September 30: Joe sent the full Jaggar
   overlook set (`Downloads\lavalava.zip`, 13 frames, January 10, 2018). The soft
   zoomed crop was replaced with a sharp frame from 5:59 pm
   (`MVIMG_20180110_175925.jpg`), cropped to the crater. Original note:
   **Big Island lava lake photo** (`journal/big-island/img/lava-lake-wide.jpg`)
   is soft: a phone at full zoom through fume at dusk. It is the only photo of
   the glowing lava lake. Options: keep it as a record shot, swap in the sharp
   `halemaumau.jpg` from the same evening, or drop the then-and-now.
2. ~~Light-edit pass~~ Done September 30. Joe's real complaint was highlights
   that never reach white (straight Fuji JPEGs topping out near 70%), not dark
   shadows. Fix is a white-point move only, blacks untouched, no clipping:
   Tunnel View (all copies site-wide, same curve), the El Capitan zoom set (one
   identical move on all three so the zoom stays seamless), Kauaʻi Glass Beach
   sunset. Left alone on purpose: cave, dusk, deep shade, backlit oaks, cold
   morning haze, and the North Coast fog (straight from camera; Joe likes fog).
   Original note: **Light-edit pass on other trips?** `check_photos.py` flags darker frames on
   Kauaʻi, the Big Island, and Yosemite. Some are dark on purpose (cave, dusk);
   Yosemite's Tunnel View and Valley View may be Joe's finished edits. Ask
   before touching.
3. ~~Camera models in metadata~~ Done September 24: Joe wants **no camera
   model anywhere** (phones or Fujifilm) until the gear section exists. Stripped
   from all portfolio tags/JSON-LD, trip-page footers, and `photos.json`;
   `prep_photos.py` no longer records make/model/lens. `contact.html` and
   `llms.txt` still say "Fujifilm" as a brand (not a model); left alone.

## Boston notes

- Map is a city map, not contours: `mapgen.py` now takes a `shores` list of
  GeoJSON land polygons (needs `pip install --user shapely`). Data in
  `build/boston-data/` from the public "Boston Historic Shoreline" ArcGIS layer
  (years 1630 to 1995). That layer counts salt marsh as land and stops at
  lon -71.1 (Brookline line), which is why the map's west edge is there.
- The Rembrandt in `journal/boston/img/rembrandt-storm.jpg` is the public
  domain Wikimedia Commons file, credited on the image. Joe approved it.
- Unused Boston frame: the carved medallion on brick arch at the Gardner.

## Site changes, September 30

- **New homepage** (`index.html`): sidebar with signature wordmark and nav, bento
  grid of the 24 portfolio photos (portfolio only, never journal photos). Tiles
  use `photos/web/*.jpg` (840px, q84, about 3.6 MB total) instead of the PNGs.
  Hover on desktop: caption at once, then after about 1 second a frame draws
  itself and the edges light up. The tile order packs 11 full rows; the comment
  above the grid explains how to swap tiles.
- **About** (`about.html`): the old MySpace homepage, cleaned up September 30.
  Kept: profile card (click the portrait to cycle `profile_pic/joe*.jpg`, 600px
  copies of the PNGs), Joe's Blurbs, Latest Journal Entries (add a line when a
  trip goes live), and the Top 8. Cut: fake ad, status, music, Online Now,
  Favorites/Block jokes, sparkle effects.
- **Nav on every page**: Portfolio, Journal, Gear, About, Contact. "Profile" is gone.
- **The journal lives at `journal.html`** (Joe's call: reuse the old URL). The old
  single-photo journal is gone. `journal.html` is the trip picker (the old
  `journal/index.html` content, with site-absolute paths), and `journal/index.html`
  only forwards to it. Trip pages stay at `/journal/<trip>/`. Edit the picker in
  `journal.html` from now on.
- **Journal tiles are instant-film prints** (Caveat handwriting on the white strip).
  Unfinished trips show a locator map and "coming soon":
  `python build/locator_maps.py` writes `journal/img/soon-*.svg`. When a trip is
  done, swap its tile for a photo tile and drop it from `TRIPS` in that script.
- **Gear** (`/gear/`, `gear/gear.css`): index plus camera, lens, bag, small
  stuff. In the nav. **No phones**: Joe doesn't want to say when a photo was
  taken on a phone. Placeholders are orange `.todo` blocks and dashed photo
  slots. Pages stay `noindex` and out of the sitemap until they're filled in.
- **The old photo pages (`photos/*.html`) are now forwarding stubs** (noindex,
  canonical, instant redirect) to the trip stop or `portfolio.html#<slug>`, so
  old links and search results still land somewhere. They were the old
  journal. The images in `photos/` stay (portfolio, About, homepage). Homepage tiles, the About Top 8, and trip
  pages' "In the portfolio" links now go to the trip stop when there is one, or
  to `portfolio.html#<slug>`, which opens that photo in the portfolio viewer.
  The viewer shows "From the <trip> trip" when a photo has one. The trip map is
  `data-trip` on each `.masonry-link` in `portfolio.html`, plus `tripLinks` in
  `about.html` and the tile hrefs in `index.html`. Update all three when a trip
  is finished (`SNIPPETS.md` section 1). In `sitemap.xml` the photos are now
  image entries under `portfolio.html`.
- **Mastheads match everywhere**: 50px bar, 36px logo, 14px nav gap. The gear
  and journal pages were off.
- `sitemap.xml` and `llms.txt` updated (about, `/journal/`, the five trips).

## Before anything is published (the switchover)

- Journal switchover done September 30 (`journal.html` is the trip picker).
- Journal pages use site-relative links (`/journal/...`, `/portfolio.html#...`), which
  work locally and on GitHub Pages with the custom domain.
- Add each trip page to `sitemap.xml`.
- Portfolio photos from a finished trip link to their stop (see
  `SNIPPETS.md` section 1). Done for all five finished trips.
- Run `python build/check_photos.py` and look at every flag.
- Site size is fine for GitHub Pages (about 50 MB now; 1 GB limit).

## How to build the next trip (short version)

1. Unzip Joe's photos into a scratch folder. Read EXIF (dates, GPS). Make
   contact sheets and look at every frame.
2. Ask Joe only what the photos can't tell you: names he remembers, where
   an ungeotagged frame was, one lived-in detail per stop.
3. Research each stop, including the power story (who took the land, water,
   labor, name; who pushed back). Source every fact.
4. Stage the chosen frames with slug names, run `light_edit.py` on them if any
   are dark or flat, then:
   `JPEG_QUALITY=72 python build/prep_photos.py <staged> journal/<trip>`
   (resizes to 1500px and strips GPS). Keep a trip under about 6 MB.
5. Map: write `build/<trip>-map.json`, then
   `python build/terrarium.py build/<trip>-map.json 10` (real elevation, needs
   internet) and `python build/mapgen.py build/<trip>-map.json`.
6. Copy `build/north-coast-page.html` as a starting template (it has the map,
   lyric, gallery, and slider CSS/JS). Write the page, then
   `python build/assemble_trip.py <trip>`, which fails if it finds an em dash.
7. Preview: `.claude/launch.json` has a `static` server on port 4322. Check
   desktop and phone width, dark mode, pins, jump list, and the interactives.
8. Swap the trip's "coming soon" tile in `journal.html` for a photo tile, and add
   "From the trip" cards to any matching portfolio pages (`SNIPPETS.md`).

Python needs Pillow, numpy, scipy, and matplotlib (`pip install --user`).

## Where Joe's photos are

- Fuji originals: `C:\Users\josep\Fotos\` (partly organized, JPG + RAF).
- Trip zips Joe exported: `Fotos\hawaii_kuai.zip`, `Fotos\hawaii_bigisland.zip`,
  `Fotos\cali_coast.zip`, `Downloads\lava.zip`, `Downloads\journal-kit.zip`.
- Phone shots carry GPS; Fuji shots almost never do.
