# Journal rebuild: status and how to pick it up

Last updated September 23, 2026. Read this first in a new session, then
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
| Boston | not started | Tea Party: taxation without a vote |
| Yellowstone | not started | First national park, made "empty" by removal |

The trip picker is `journal/index.html` (tile grid with Small/Medium/Large).
Add a tile for each finished trip; placeholders exist for unfinished ones.

## Open questions for Joe

1. **Big Island lava lake photo** (`journal/big-island/img/lava-lake-wide.jpg`)
   is soft: a phone at full zoom through fume at dusk. It is the only photo of
   the glowing lava lake. Options: keep it as a record shot, swap in the sharp
   `halemaumau.jpg` from the same evening, or drop the then-and-now.
2. **Light-edit pass on other trips?** `check_photos.py` flags darker frames on
   Kauaʻi, the Big Island, and Yosemite. Some are dark on purpose (cave, dusk);
   Yosemite's Tunnel View and Valley View may be Joe's finished edits. Ask
   before touching.
3. **Nine portfolio pages** still list "Samsung Galaxy S23 Ultra" in hidden
   metadata. Joe doesn't want phones named. Ask before stripping site-wide.

## Before anything is published (the switchover)

- `/journal/` replaces `journal.html`. The old page and the links to it in
  `index.html`, `portfolio.html`, `contact.html`, `legal.html`, `sitemap.xml`,
  and `llms.txt` need updating, and `journal.html` needs a redirect so old links
  still work.
- Journal pages use site-relative links (`/journal/`, `/photos/...`), which
  work locally and on GitHub Pages with the custom domain.
- Add each trip page to `sitemap.xml`.
- Portfolio pages that came from a trip get a "From the trip" card (see
  `SNIPPETS.md`). Done so far: `photos/plumeria.html`.
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
8. Add the tile to `journal/index.html`.

Python needs Pillow, numpy, scipy, and matplotlib (`pip install --user`).

## Where Joe's photos are

- Fuji originals: `C:\Users\josep\Fotos\` (partly organized, JPG + RAF).
- Trip zips Joe exported: `Fotos\hawaii_kuai.zip`, `Fotos\hawaii_bigisland.zip`,
  `Fotos\cali_coast.zip`, `Downloads\lava.zip`, `Downloads\journal-kit.zip`.
- Phone shots carry GPS; Fuji shots almost never do.
