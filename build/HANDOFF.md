# Journal trip pages: build handoff

> **Read `VOICE.md` first.** It sets how every page sounds (happy sound, dark
> lyrics; power and control; find the others) and overrides anything below about
> tone, narration, interactives, or camera credits.

Everything needed to turn a folder of trip photos into a journal page like
`journal/yosemite/`. Written for whoever (or whatever) builds the next one.

The Yosemite page is the reference build. When in doubt, open
`journal/yosemite/index.html` and copy the pattern. Do not redesign it.

---

## 1. What a trip page is

One scrollable feed of posts, one photo per post, in the order the day happened.
Every post carries a numbered map pin, a short line or two in Joe's voice, and a
facts table with real, sourced background. One interactive feature per trip.
Styling matches joegraham.studio: navy top bar, blue module headers, white boxes
on light blue, Verdana body, Trebuchet headings.

Non-negotiables learned the hard way:

- **Informational first.** Background facts and links carry the page. Personal
  writing is one or two sentences per post, upbeat, never wistful.
- **No self-deprecation.** Never "photos that didn't make the portfolio," never
  "I've been twice and still haven't seen it all." He shares because it's fun.
- **No mood lines, no inset photos, no gear talk that reads like an ad.**
  Gear appears only when it explains something (the long lens, because it made
  the climbers visible).
- **History leads.** The intro is about the place, not about trip planning.
  No fees, no reservations, no "know before you go" section.
- **Multiple visits are one trip.** Never split a page into visit one and two.
- **Interactive features are announced.** A banner, a pulsing button, and a
  jump-list entry. People will not discover it on their own.
- **No em dashes anywhere in copy.**

## 2. Folder layout

```
journal/
  index.html            trip picker (this kit)
  img/<trip>.jpg        one cover shot per trip, 900px long edge
  yosemite/
    index.html          the page
    img/*.jpg           photos, 1500px long edge
  kauai/
  big-island/
build/
  prep_photos.py        resize + pull EXIF -> photos.json
  mapgen.py             map.json -> map.svg + mini.svg
  topo.py               contour lines (model or real DEM)
  find_crop.py          locate a telephoto frame inside a wide one
  <trip>-map.json       map config per trip
```

Page URL is `/journal/<trip>/`. Keep trip slugs lowercase with hyphens.

## 3. Build order

1. **Photos.** `python build/prep_photos.py ~/Photos/Kauai journal/kauai`
   Writes resized JPEGs and `photos.json` sorted by capture time. That sort
   order is the draft running order of the feed. Phone shots often carry GPS,
   which gives you pin coordinates for free (`has_gps` in the JSON, read the
   full GPS IFD if you want exact numbers).
1b. **Check and fix the photos.** `python build/check_photos.py <trip>` flags
   soft and badly exposed frames. Light-edit dark or flat frames with
   `build/light_edit.py` on the staged originals, then re-run prep. Nothing
   blurry by accident gets published (see `VOICE.md`, section 8).
2. **Read the photos.** Look at every frame. Group them into stops: arrival,
   viewpoints, details, food, the one weird thing. Write down what you can
   actually see. Do not describe what is not in the frame.
3. **Research each stop.** See section 6.
4. **Pick the interactive feature.** See section 5.
5. **Map.** Build `build/<trip>-map.json`, run
   `python build/mapgen.py build/kauai-map.json`, paste the two SVGs into the
   page (big map in the route module, mini in the sidebar).
6. **Write the page** from the Yosemite template: same CSS block, same module
   markup, same JS.
7. **Check it.** Section 8.
8. **Add the trip** to `journal/index.html`: cover photo, blurb, stop count, and
   a tag naming the interactive feature.

## 4. Page anatomy

In order:

- **Top bar**, copied from the site, with Journal marked active.
- **Sidebar** (desktop only): "You Are Here" mini map, then the Jump To list.
  On phones the sidebar collapses to a sticky horizontal strip of jump links.
- **Intro module**: `<h1>` is the place name alone. Two short paragraphs of
  history, then "Tap a numbered pin on the map to jump to that stop."
- **The Route**: the big map, with a caption explaining the contour interval and
  that pins are approximate.
- **History post**: a facts table of dates, oldest first.
- **Photo posts**: header with pin badge, place, and time of day. Photo on black.
  `<h2>`, one or two sentences, then a facts table. Footer shows the camera and
  lens from EXIF ("Fujifilm X-T30 II, XF18-55mm at 18mm, f/20") plus a
  "Link to this post" anchor.
- **Status post** (no photo) for anything odd: the bear count, a running joke.
- **Helpful links**: 6 to 10 outside links worth clicking.
- **Sources**: numbered list of everything the facts came from, with a
  "Details checked <month year>" line.

Reusable pieces already in the CSS: `.facts` (tables), `.note` (small boxed
aside), `.linkcard` (orange-ish outbound card), `.callout` (interactive
banner), `.hl` (helpful-links list), `.status` (text-only post).

Light and dark mode both matter. Every color is a CSS variable, and any
hardcoded background needs a hardcoded text color to match, or dark mode will
put white text on cream. That bug shipped once already.

## 5. The interactive feature

One per trip, tied to something only the photos can show.

Yosemite: a three-step zoom from the whole cliff to three climbers on a rope.
The geometry:

- Frames nest. Wide frame, then the telephoto frame as a box inside it, then the
  crop as a box inside that. Each box is stored as fractions of the wide frame,
  and every box shares the plate's aspect ratio (2:3), so one number `w` covers
  both width and height.
- Animate the view rectangle, not the image. Interpolate `w` in log space and
  place `x`,`y` from the fixed point between the two rectangles, then apply
  `translate(...) scale(1/w)` to the wrapper. Linear interpolation looks wrong.
- Cross-fade each sharper frame in once it is big enough (around 55% of the way
  through its leg). Keep the frames as nested absolutely positioned children so
  they scale together.
- Draw the target box outside the scaled wrapper so its outline stays 2px.
- Do not set `will-change: transform` on the wrapper. Chrome then rasterizes
  once and the zoom goes soft.
- `find_crop.py` gives you the box coordinates: it template-matches the tele
  frame inside the wide one using the focal length ratio as the starting scale,
  and writes a preview with the box drawn on it. Check the preview.

Ideas for the trips in the queue, pick one that the photos actually support:

- **Kauai**: a wet-side, dry-side slider (Waimea Canyon red rock against Hanalei
  green), or a "what is in this sea cliff" tap-to-label panorama.
- **Big Island**: a then-and-now on a lava flow, or a tap-through of the
  climate zones you drive past in an hour, or zoom into a lava field detail.
- **Palm Springs**: Joe already has one planned. Ask him before designing one.

Whatever it is: announce it with a `.callout` banner, put a pulsing button on
the photo, and name it in the Jump To list.

## 6. Research rules

- Prefer official and primary sources: NPS, USGS, state parks, museums,
  university pages, then Wikipedia, then reputable local press. Skip content
  farms and AI-written travel blogs.
- Facts must be checkable and specific: heights, dates, seasons, names, why a
  place is called what it is called. Skip anything you cannot source.
- Every page gets a Sources list with real links and a checked date.
- Find at least one photographer-specific hook per trip. Yosemite had Ansel
  Adams, Carleton Watkins, and Galen Rowell's first Firefall photo.
- Find at least one thing people search for every year (Yosemite: the February
  Firefall). That is the traffic magnet.
- Never publish copyrighted photos. Adams's work is still under copyright, so
  the page links to the museum instead. If a place bans photography inside, the
  photos stay off the site even if Joe took them.
- Quote sparingly, under 15 words, attributed.
- Hedge honestly: "most likely a bigleaf maple," "pins are approximate."

## 7. Map rules

- Build `<trip>-map.json`: bounding box, optional tighter `bbox_mini`, water
  lines, roads, flat areas, notes (road and river labels), landmarks, and
  numbered pins. Pull coordinates from any map source; they only need to be
  close enough to read.
- Contours: `terrain.dem` pointing at a USGS 3DEP GeoTIFF is the good path
  (apps.nationalmap.gov/downloader, then `pip install rasterio`). Without a DEM,
  describe the terrain with `valleys` and `peaks` and the model in `topo.py`
  fakes it well enough to read. Say so in the caption if the lines are modeled.
  Contour interval: 250 ft in mountains, bold every 1,000 ft. Flat coastal
  places want 100 ft or less; volcanoes want 500 ft or more.
- Pins are numbered west to east, or in trip order. Several posts can share a
  pin. Posts carry `data-pin="n"`.
- The mini map drops all labels and draws bigger pin circles, so it stays
  readable at 280px.
- Pins are navigation: clicking or pressing Enter on a pin scrolls to the first
  post with that number, and the pin turns orange as you scroll. That JS is in
  the Yosemite page, unchanged.
- Label collisions are the only real work. Each landmark and pin takes a side
  (`l`, `r`, `b`, `b2`, `t`). Some labels are hidden on phones with a
  `mk-<slug>` class.

## 8. Before publishing

- Page works at 390px and at 1920px, no sideways scrolling.
- Light mode and dark mode both readable, especially any tinted box.
- Zoom or other feature works by tap, by button, and by keyboard.
- Every photo has real alt text describing what is in it.
- Jump list, pin clicks, and permalinks all land where they should.
- Facts table numbers match the sources listed.
- No em dashes. No mood lines. Nothing that sounds like an apology.
- Photos are 1500px long edge, progressive JPEG, `loading="lazy"` on everything
  below the first screen.
- Page total under about 6 MB.

## 9. What Joe supplies per trip

- The photo folder.
- Which stop each ambiguous photo belongs to, if the EXIF has no GPS.
- Anything he remembers that is not in the frame: what it smelled like, what
  went wrong, who he talked to. One good detail per stop is plenty.
- A call on the interactive feature if the photos suggest more than one.

## 10. Cross-linking

Trip pages and portfolio entries have to point at each other, both directions.
See `SNIPPETS.md` for the markup.

- Each portfolio photo page that came from a trip gets a "From the trip" card in
  its side rail, linking to that stop's anchor on the trip page.
- Each trip post whose photo has a portfolio version gets an "In the portfolio"
  row in its facts table.
- Every post on a trip page has an `id`, so these links land on the stop, not
  the top of the page.
- Trip pages end with "More trips" pointing at `/journal/`.
- Add each new page to `sitemap.xml` and give it Open Graph tags so shared links
  show the cover photo.
