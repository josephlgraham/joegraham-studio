# Drop-in snippets

## 1. Portfolio photo -> trip journal stop

The old per-photo pages (`photos/*.html`) are gone (September 30). A portfolio
photo now links to its trip stop from three places. Update all three when a
trip is finished:

- `index.html`: the homepage tile's `href` (otherwise `/portfolio.html#<slug>`).
- `portfolio.html`: `data-trip="/journal/<trip>/#<stop>" data-trip-name="<Trip>"`
  on the photo's `.masonry-link`. The viewer then shows "From the <Trip> trip".
- `about.html`: the `tripLinks` object (feeds the Top 8 and its viewer).

`<slug>` is the image name with dashes (`tunnel_view.png` -> `tunnel-view`).
`portfolio.html#<slug>` opens that photo in the portfolio viewer.

Current pairs:

| Portfolio photo | Trip page anchor |
| --- | --- |
| tunnel-view (Cathedral of the High Sierra) | `/journal/yosemite/#tunnel-view` |
| yosemite (Mirror of the Merced) | `/journal/yosemite/#valley-view` |
| plumeria | `/journal/kauai/#plumeria` |
| hawaii-resort | `/journal/big-island/#fairmont` |
| hilo-farmers-market | `/journal/big-island/#hilo-market-2024` |
| duncans-landing, goat-rock-beach | `/journal/north-coast/#goat-rock` |
| petrified-forest | `/journal/north-coast/#the-queen` |

Waiting on unbuilt trips:
Palm Springs (coachella-valley, joshua-tree, joshua-tree-rock, p51-mustang),
San Francisco (eclipse-embarcadero), Los Angeles (santa-monica-pier),
Alabama (blue-heron, cahaba-river, droplets, eggshell,
junkyard, little-bambino, milkweed, pole-beans, tracks-sunset).

## 2. Trip page -> portfolio entry

Add a row to that stop's facts table, so the link sits with the other
information instead of reading like a plug:

```html
<tr><th>In the portfolio</th><td>My favorite frame from this overlook,
<a href="/portfolio.html#tunnel-view"><i>Cathedral of the High Sierra</i></a>.</td></tr>
```

## 4. Link previews for sharing

Add to the `<head>` of every trip page, with the cover photo at an absolute URL:

```html
<meta property="og:title" content="Yosemite | Joe Graham Photography">
<meta property="og:description" content="A trip through Yosemite Valley: maps, history, and the photos from every stop.">
<meta property="og:image" content="https://joegraham.studio/journal/img/yosemite.jpg">
<meta property="og:url" content="https://joegraham.studio/journal/yosemite/">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
```
