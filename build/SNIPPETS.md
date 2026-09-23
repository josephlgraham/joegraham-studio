# Drop-in snippets

## 1. Portfolio photo page -> trip journal page

Paste into the `side-rail` of a `photos/*.html` page, above the existing
"Learn more" card. It reuses the classes already on those pages, so no CSS
changes are needed.

```html
<section class="info-card">
  <h3>From the trip</h3>
  <div class="card-body">
    <ul class="resource-list">
      <li><a href="/journal/yosemite/#tunnel-view">
        <strong>Yosemite trip journal</strong>
        <span>Where this frame sits on the trip: the map, the other stops, and the story of the place.</span>
      </a></li>
    </ul>
  </div>
</section>
```

Change the anchor to the matching stop on the trip page. Current pairs:

| Portfolio page | Trip page anchor |
| --- | --- |
| `photos/tunnel-view.html` (Cathedral of the High Sierra) | `/journal/yosemite/#tunnel-view` |
| `photos/yosemite.html` (Mirror of the Merced) | `/journal/yosemite/#valley-view` |

Every post on a trip page has an `id`, so any portfolio entry can point at the
exact stop rather than the top of the page.

## 2. Trip page -> portfolio entry

Add a row to that stop's facts table, so the link sits with the other
information instead of reading like a plug:

```html
<tr><th>In the portfolio</th><td>My favorite frame from this overlook,
<a href="https://joegraham.studio/photos/tunnel-view.html"><i>Cathedral of the High Sierra</i></a>.</td></tr>
```

## 3. Journal index page -> trip pages

`journal.html` lists the individual photo entries. Each entry that came from a
trip should link to its stop on the trip page, and the page should link to
`/journal/` so people find the trip picker.

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
