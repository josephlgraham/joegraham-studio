/* Graham land at Mount Olive: the map. All data comes from data.js (window.LANDMAP), made by build.py from the data folder.
   No network: Leaflet is local, tiles are local image files. */
(function () {
'use strict';
var D = window.LANDMAP, S = D.settings, Q = { NE: [.5, 1, .5, 1], NW: [0, .5, .5, 1], SW: [0, .5, 0, .5], SE: [.5, 1, 0, .5] };
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ---------- labels (how sure) ---------- */
var TAGCLS = { 'Documented': 'doc', 'Approximate': 'approx', 'Unresolved': 'unres', 'Family oral history': 'oral', 'Name match': 'match', 'Strongly supported': 'doc', 'General history': 'gen', 'Computed': 'gen', 'Plausible': 'match' };
function tag(t, prefix) { if (!t) return ''; var base = String(t).split(' (')[0]; return '<span class="tag ' + (TAGCLS[base] || 'gen') + '">' + esc((prefix ? prefix + ': ' : '') + t) + '</span>'; }

/* ---------- section geometry (today's grid) ---------- */
var SEC = D.sections.corners;
function bil(s, u, v) { var c = SEC[s], NE = c[0], NW = c[1], SW = c[2], SE = c[3];
  var t = [NW[0] + (NE[0] - NW[0]) * u, NW[1] + (NE[1] - NW[1]) * u], b = [SW[0] + (SE[0] - SW[0]) * u, SW[1] + (SE[1] - SW[1]) * u];
  return [b[1] + (t[1] - b[1]) * v, b[0] + (t[0] - b[0]) * v]; } /* returns [lat, lng] */
function rng(code) { var q = code.slice(-2), a = Q[q], s = code.slice(0, -2), mu = (a[0] + a[1]) / 2, mv = (a[2] + a[3]) / 2;
  if (!s) return a.slice();
  if (s[1] === '2') return { W: [a[0], mu, a[2], a[3]], E: [mu, a[1], a[2], a[3]], N: [a[0], a[1], mv, a[3]], S: [a[0], a[1], a[2], mv] }[s[0]];
  var b = Q[s]; return [a[0] + (a[1] - a[0]) * b[0], a[0] + (a[1] - a[0]) * b[1], a[2] + (a[3] - a[2]) * b[2], a[2] + (a[3] - a[2]) * b[3]]; }
function legal(code) { var q = code.slice(-2), s = code.slice(0, -2); if (!s) return q + '¼'; return s[1] === '2' ? s[0] + '½ ' + q + '¼' : s + '¼ ' + q + '¼'; }
function polyOf(s, code) { var r = rng(code); return [bil(s, r[0], r[2]), bil(s, r[1], r[2]), bil(s, r[1], r[3]), bil(s, r[0], r[3])]; }
function centerOf(s, code) { var r = rng(code); return bil(s, (r[0] + r[1]) / 2, (r[2] + r[3]) / 2); }
/* which section and forty a point falls in (inverse of bil, by Newton steps) */
function locate(lat, lng) {
  for (var k in SEC) { var u = .5, v = .5;
    for (var i = 0; i < 12; i++) { var p = bil(k, u, v), h = 1e-4, pu = bil(k, u + h, v), pv = bil(k, u, v + h);
      var a = (pu[1] - p[1]) / h, b = (pv[1] - p[1]) / h, c = (pu[0] - p[0]) / h, d = (pv[0] - p[0]) / h, det = a * d - b * c;
      var ex = lng - p[1], ey = lat - p[0]; u += (d * ex - b * ey) / det; v += (-c * ex + a * ey) / det; }
    if (u >= 0 && u <= 1 && v >= 0 && v <= 1) { var bigU = u < .5 ? 'W' : 'E', bigV = v < .5 ? 'S' : 'N', q = bigV + bigU;
      var lu = (u % .5) * 2, lv = (v % .5) * 2, sq = (lv < .5 ? 'S' : 'N') + (lu < .5 ? 'W' : 'E');
      return { sec: +k, code: sq + q, u: u, v: v }; } }
  return null; }

/* ---------- elevation from the 2024 lidar (about 19 m grid) ---------- */
var EL = window.LANDMAP_ELEV, EG = null;
if (EL) { var bin = atob(EL.b64), buf = new ArrayBuffer(bin.length), u8 = new Uint8Array(buf); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); EG = new Int16Array(buf); }
function elevFt(latlng) { if (!EG) return null; var p = L.CRS.EPSG3857.project(latlng);
  var c = (p.x - EL.x0) / EL.cell - .5, r = (EL.y0 - p.y) / EL.cell - .5; if (c < 0 || r < 0 || c > EL.nx - 1 || r > EL.ny - 1) return null;
  var c0 = Math.floor(c), r0 = Math.floor(r), c1 = Math.min(c0 + 1, EL.nx - 1), r1 = Math.min(r0 + 1, EL.ny - 1), fc = c - c0, fr = r - r0;
  function g(rr, cc) { return EG[rr * EL.nx + cc]; }
  var dm = g(r0, c0) * (1 - fc) * (1 - fr) + g(r0, c1) * fc * (1 - fr) + g(r1, c0) * (1 - fc) * fr + g(r1, c1) * fc * fr;
  return dm / 10 * 3.28084; }

/* ---------- the map ---------- */
var map, card = $('#card'), cardBody = $('#cardBody'), lastFocus = null;
function openCard(html, focus) { cardBody.innerHTML = html; card.hidden = false; if (focus !== false) { var h = $('h2', cardBody); if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: window.innerWidth > 900 }); } catch (e) {} } } wireCard(); }
function closeCard() { card.hidden = true; clearSel(); if (lastFocus && document.body.contains(lastFocus)) try { lastFocus.focus(); } catch (e) {} }

function init() {
  var TB = L.latLngBounds(D.tiles.bounds);
  map = L.map('map', { minZoom: 12, maxZoom: 19, zoomSnap: .5, keyboard: true, maxBounds: TB.pad(.25), attributionControl: true, zoomControl: true });
  map.attributionControl.setPrefix(false);
  map.setView(D.layers.home.center, D.layers.home.zoom);
  [['terrain', 200], ['contours', 250], ['old', 300], ['grid', 380], ['roads', 400], ['parcels', 420], ['labels', 430], ['hh', 440], ['survey', 450], ['places', 460]].forEach(function (p) { map.createPane(p[0]).style.zIndex = p[1]; });
  map.getPane('labels').style.pointerEvents = 'none';
  map.getPane('grid').style.pointerEvents = 'none';

  /* terrain tiles */
  var topt = { bounds: TB, minZoom: 12, maxZoom: 19, minNativeZoom: 12, maxNativeZoom: S.tileMaxZoom, pane: 'terrain', attribution: 'Lidar: USGS 2024 (11 County, AL)' };
  var T = { shade: L.tileLayer('tiles/shade/{z}/{x}/{y}.' + S.tileFormat, topt), relief: L.tileLayer('tiles/relief/{z}/{x}/{y}.' + S.tileFormat, topt) };
  var contours = L.tileLayer('tiles/contour/{z}/{x}/{y}.png', { bounds: TB, minZoom: 12, maxZoom: 19, minNativeZoom: 12, maxNativeZoom: S.tileMaxZoom, pane: 'contours' });

  /* grid */
  var gGrid = L.layerGroup(), gGridLbl = L.layerGroup();
  Object.keys(SEC).forEach(function (k) { var s = +k, ap = D.sections.approximate[k];
    [.25, .5, .75].forEach(function (u) { L.polyline([bil(s, u, 0), bil(s, u, 1)], { pane: 'grid', color: '#4d5d70', weight: u === .5 ? 1 : .7, opacity: .55, dashArray: ap ? '4 4' : null, interactive: false }).addTo(gGrid);
      L.polyline([bil(s, 0, u), bil(s, 1, u)], { pane: 'grid', color: '#4d5d70', weight: u === .5 ? 1 : .7, opacity: .55, dashArray: ap ? '4 4' : null, interactive: false }).addTo(gGrid); });
    L.polygon([bil(s, 1, 1), bil(s, 0, 1), bil(s, 0, 0), bil(s, 1, 0)], { pane: 'grid', color: '#22303f', weight: 2, fill: false, dashArray: ap ? '8 6' : null, interactive: false }).addTo(gGrid);
    L.marker(bil(s, .5, .5), { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'lbl-sec', html: s + (ap ? '<small>approximate</small>' : ''), iconSize: [110, 40], iconAnchor: [55, 20] }) }).addTo(gGridLbl); });

  /* roads and creeks */
  var gRoads = L.layerGroup();
  L.geoJSON(D.creeks, { pane: 'roads', interactive: false, style: { color: '#1f5f8b', weight: 2, opacity: .9 } }).addTo(gRoads);
  L.geoJSON(D.roads, { pane: 'roads', interactive: false, style: function (f) { var c = f.properties.cls; return { color: '#2b2f33', weight: c === 'main' ? 4 : (c === 'road' ? 2 : 1.3), opacity: c === 'main' ? .9 : .7 }; } }).addTo(gRoads);
  var gRoadLbl = L.layerGroup(), done = {};
  D.roads.features.forEach(function (f) { var n = f.properties.name; if (!n || done[n] || ['Mount Olive Road', 'Jett Mtn Road', 'Beasley Road', 'Barber Blvd', 'Church Street', 'Swann Road', 'McPherson Road', 'McConnell Lane'].indexOf(n) < 0) return; done[n] = 1;
    var c = f.geometry.coordinates, m = c[Math.floor(c.length / 2)];
    L.marker([m[1], m[0]], { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'lbl-road', html: esc(n), iconSize: null, iconAnchor: [0, -4] }) }).addTo(gRoadLbl); });
  [['Crooked Creek', [33.7135, -86.8618]], ['Cane Creek', [33.6985, -86.8878]]].forEach(function (c) { L.marker(c[1], { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'lbl-creek', html: c[0], iconSize: null }) }).addTo(gRoadLbl); });

  /* parcels */
  var gParcels = L.layerGroup(), gYr = L.layerGroup(), byId = {}, sel = [];
  D.parcels.parcels.forEach(function (p) { var col = D.parcels.colors[p.g]; p.polys = []; p.lbls = [];
    p.al.forEach(function (code) { var poly = L.polygon(polyOf(p.sec, code), { pane: 'parcels', color: col, weight: 2, fillColor: col, fillOpacity: .45 });
      poly.on('click', function (e) { L.DomEvent.stopPropagation(e); lastFocus = null; showParcel(p.id); });
      poly.on('add', function () { var el = poly.getElement(); if (!el) return; el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', p.who + ', ' + legal(code) + ' Section ' + p.sec + ', ' + p.yr);
        el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); lastFocus = el; showParcel(p.id); } }); });
      poly.addTo(gParcels); p.polys.push(poly);
      var lb = L.marker(centerOf(p.sec, code), { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'lbl-yr', html: String(p.yr), iconSize: [40, 16], iconAnchor: [20, 8] }) }); lb.addTo(gYr); p.lbls.push(lb); });
    byId[p.id] = p; });
  function clearSel() { sel.forEach(function (p) { p.polys.forEach(function (x) { x.setStyle({ weight: 2, color: D.parcels.colors[p.g] }); }); }); sel = []; }
  window.__clearSel = clearSel;
  function showParcel(id, fly) { var p = byId[id]; clearSel(); sel = [p]; p.polys.forEach(function (x) { x.setStyle({ weight: 5, color: '#17222e' }); x.bringToFront(); });
    if (fly) { var b = L.latLngBounds([]); p.polys.forEach(function (x) { b.extend(x.getBounds()); }); map.flyToBounds(b.pad(1.2), { maxZoom: 16, duration: .6 }); }
    if (yr < p.yr) setYear(p.yr);
    openCard('<h2>' + esc(p.who) + '</h2><p class="legal">' + p.al.map(legal).join(', ') + ' · Section ' + p.sec + ' · T15S R3W</p>' +
      '<div class="tags">' + tag(p.record, 'Record') + tag(p.position + ' (drawn on today\'s grid)', 'Outline') + '</div><dl>' +
      (p.rec ? '<dt>Written</dt><dd>"' + esc(p.rec) + '" on the record</dd>' : '') + (p.entry ? '<dt>Entered</dt><dd>' + esc(p.entry) + '</dd>' : '') +
      '<dt>Patent</dt><dd>' + esc(p.pat) + '</dd><dt>Acres</dt><dd>' + esc(p.ac) + '</dd><dt>How</dt><dd>' + esc(p.how) + '</dd><dt>Record</dt><dd>' + esc(p.doc) + '</dd></dl><p>' + esc(p.note) + '</p>' +
      '<p class="src">Source: patent index (159 patents) and tract book Vol. 427; where they disagree the patent is followed.</p>'); }

  /* places */
  var gPlaces = L.layerGroup();
  function icon(cls, size) { return L.divIcon({ className: '', html: '<div class="mk ' + cls + '" style="width:' + size + 'px;height:' + size + 'px"></div>', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }); }
  function placeCard(pl) { openCard('<h2>' + esc(pl.name) + '</h2><p class="legal">' + esc(pl.legal || '') + '</p><div class="tags">' + tag(pl.label, 'Fact') + tag(pl.position, 'Position') + '</div><ul>' + pl.facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul><p class="src">Source: ' + esc(pl.source) + '</p>'); }
  D.places.placed.forEach(function (pl) { var ll = [pl.lonlat[1], pl.lonlat[0]], m;
    if (pl.kind === 'oral') { m = L.circle(ll, { radius: pl.radius_m, pane: 'places', color: '#a3342f', weight: 2.5, dashArray: '7 6', fill: true, fillOpacity: .05 }); }
    else { var cls = { cemetery: 'mk-cem', church: 'mk-chapel', mill: 'mk-mill' }[pl.kind] || 'mk-cem';
      m = L.marker(ll, { pane: 'places', icon: icon(cls, pl.kind === 'cemetery' ? 18 : 16), title: pl.name, alt: pl.name, keyboard: true }); }
    var lbl = pl.name + (pl.position === 'Approximate' ? ' (approximate)' : '');
    m.bindTooltip(esc(lbl), { permanent: true, direction: 'right', offset: [10, 0], className: 'lm-tip' });
    m.on('click', function (e) { L.DomEvent.stopPropagation(e); placeCard(pl); });
    m.addTo(gPlaces); });

  /* households */
  var gHH = L.layerGroup(), hhYear = null, HHY = D.households.years, YEARS = Object.keys(HHY);
  function drawHH() { gHH.clearLayers(); if (!hhYear) return; var d = HHY[hhYear], seen = {};
    d.placed.forEach(function (h, hi) { h.land.forEach(function (row, li) { var key = row[0] + row[1], off = (seen[key] = (seen[key] || 0) + 1) - 1, c = centerOf(row[0], row[1]);
      var ll = [c[0] - off * .0004, c[1] + off * .0005];
      var m = L.marker(ll, { pane: 'hh', icon: icon('mk-hh' + (h.kin ? ' kin' : ''), 16), title: h.n + ', ' + hhYear, alt: h.n, keyboard: true });
      if (li === 0) m.bindTooltip(esc(h.n), { permanent: true, direction: 'right', offset: [10, 0], className: 'lm-tip' });
      m.on('click', function (e) { L.DomEvent.stopPropagation(e); showHH(hi); });
      m.addTo(gHH); }); }); }
  function showHH(i) { var d = HHY[hhYear], h = d.placed[i];
    openCard('<h2>' + esc(h.n) + '</h2><p class="legal">' + hhYear + ' census · ' + esc(h.ln) + ' · ' + esc(d.src) + '</p><div class="tags">' + tag('Documented', 'Census line') + tag('Name match', 'Link to the land') + tag('Approximate', 'Dot') + '</div>' +
      (h.w ? '<p>Written on the census: "' + esc(h.w) + '"</p>' : '') + '<p>' + esc(h.tie) + '</p><h3>Land in the same name, entered by ' + hhYear + '</h3><ul>' +
      h.land.map(function (r) { return '<li>' + legal(r[1]) + ' Sec. ' + r[0] + (r[2] ? ' · ' + esc(r[2]) : '') + '</li>'; }).join('') + '</ul><p class="src">The dot sits in the middle of the forty. Census order does not give a location.</p>'); }
  function hhList() { var d = HHY[hhYear]; openCard('<h2>Households, ' + hhYear + '</h2><p class="legal">' + esc(d.src) + '</p><div class="tags">' + tag('Name match', 'Placement') + '</div><p>Dots: households whose head held land in the same name in this township by ' + hhYear + '. Dashed dots: land in a late husband\'s name. Tap a dot for the census line.</p><h3>Not placed (census order only)</h3><ul>' + d.other.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>', false); }

  /* 1906 USGS sheet */
  var old1906 = L.imageOverlay(D.old1906.file, D.old1906.bounds, { pane: 'old', opacity: .85, alt: 'USGS Birmingham Coal District sheet, about 1906, fitted to the map' });

  /* 1821 survey */
  var gSV = L.layerGroup(), SV = D.survey;
  var LANDCOL = { hilly: '#8a5a2b', rolling: '#b8892e', level: '#3f8f5a', wavy: '#b8892e' };
  function svLineXY(ln, ch) { var f = Math.min(ch, 80) / 80, g = ln.geom, s = g[0], side = g[1]; return side === 'S' ? bil(s, 1 - f, 0) : side === 'N' ? bil(s, 1 - f, 1) : bil(s, 0, 1 - f); }
  function treeTable(ts) { return '<div class="tbl"><table><thead><tr><th>Tree as written</th><th>Bearing</th><th>Dist.</th><th>Label</th></tr></thead><tbody>' +
    ts.map(function (t) { return '<tr><td>' + esc(t.species_written) + (t.flag ? ' <em>[' + esc(t.flag) + ']</em>' : '') + '</td><td>' + esc(t.bearing) + '</td><td>' + esc(t.dist) + '</td><td>' + esc(t.label) + '<br><span class="src">' + esc(t.decoding) + '</span></td></tr>'; }).join('') + '</tbody></table></div>'; }
  var SVPERM = 'Alabama Secretary of State Land Records, original field notes for T15S R3W. Personal use only: written permission naming the publication is needed before any image or transcription goes in the book or on a public page.';
  function svPost(p) { openCard('<h2>' + esc(p.name) + '</h2><p class="legal">' + esc(p.page) + ' · ' + esc(p.kind) + ' · sections ' + p.sections.join(', ') + '</p><div class="tags">' + tag(p.status, 'Trees') + tag('Approximate', 'Position') + (p.needs_recheck ? tag('Unresolved', 'Needs recheck') : '') + '</div>' + treeTable(p.trees) + (p.note ? '<p>' + esc(p.note) + '</p>' : '') +
    '<p class="src">Trees are listed NE, SE, SW, NW as written. Distance is probably chains with decimals (Unresolved). "1/4 S" is not explained on the pages (Unresolved). Position: on today\'s section grid, not at the 1821 post.</p><p class="src">' + SVPERM + '</p>'); }
  function svX(ln, e) { openCard('<h2>' + (e.water && e.water.indexOf('creek') === 0 ? 'Creek' : 'Branch') + ' crossed at ' + e.chain.toFixed(2) + ' chains</h2><p class="legal">' + esc(ln.name) + ' · ' + esc(ln.page) + '</p><div class="tags">' + tag('Documented', 'As written') + tag('Approximate', 'Position') + '</div><dl><dt>As written</dt><dd>"' + esc(e.text) + '"</dd><dt>Width</dt><dd>' +
    (e.width_links != null ? e.width_links + ' links (about ' + (e.width_links * .66).toFixed(0) + ' ft if a link is 0.66 ft; Computed)' : esc(e.width_as_written || 'not read') + ' links') + '</dd><dt>Bearing</dt><dd>' + esc(e.bearing || '') + '</dd></dl>' + (e.note ? '<p>' + esc(e.note) + '</p>' : '') + (e.flag ? '<p><em>' + esc(e.flag) + '</em></p>' : '') +
    '<p class="src">Placed by chain count along ' + esc(ln.bounds) + ', 80 chains to a side, on today\'s grid. Not a position from the plat.</p><p class="src">' + SVPERM + '</p>'); }
  function svCard(sec) { var c = SV.cards[sec], posts = SV.posts.filter(function (p) { return p.sections.indexOf(+sec) >= 0; }), all = {}, n = 0;
    posts.forEach(function (p) { p.trees.forEach(function (t) { var k = t.species || 'species not read'; all[k] = (all[k] || 0) + 1; n++; }); });
    var fmt = Object.keys(all).sort(function (a, b) { return all[b] - all[a] || (a < b ? -1 : 1); }).map(function (k) { return k + ' ' + all[k]; }).join(', ');
    var lines = c.lines.map(function (id) { return SV.lines.filter(function (l) { return l.id === id; })[0]; }), feats = [], land = [];
    lines.forEach(function (l) { l.entries.forEach(function (e) { if (e.kind === 'crossing') feats.push('<li>' + esc(l.bounds) + ': ' + e.chain.toFixed(2) + ' chains, ' + esc(e.water) + ', ' + (e.width_links != null ? e.width_links : esc(e.width_as_written || '?')) + ' links (' + esc(l.page) + ')</li>');
      if (e.kind === 'land') land.push('<li>' + esc(l.bounds) + ', from ' + (e.chain || 0).toFixed(2) + ' chains: ' + esc(e.land) + (e.rate ? ', ' + esc(e.rate) + ' rate' : '') + (e.timber ? '; timber ' + esc(e.timber) : '') + ' (' + esc(l.page) + ')</li>'); }); });
    var b = L.latLngBounds([bil(+sec, 0, 0), bil(+sec, 1, 1)]); map.flyToBounds(b.pad(.1), { duration: .6 });
    openCard('<h2>Section ' + sec + ', 1821 survey</h2><p class="legal">Pages ' + esc(c.pages) + '</p><div class="tags">' + tag('Documented', 'As written') + tag('Approximate', 'Positions') + '</div><h3>Trees at the posts around the section (' + posts.length + ' posts, ' + n + ' trees)</h3><p>' + esc(fmt) + '</p><h3>Creeks and branches crossed</h3>' +
      (feats.length ? '<ul>' + feats.join('') + '</ul>' : '<p>None written on the lines in hand.</p>') + '<h3>Land as written</h3><ul>' + land.join('') + '</ul><h3>Not in hand</h3><ul>' + c.missing.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul><p class="src">Counts are of trees at posts only. ' + SVPERM + '</p>'); }
  var svDrawn = false;
  function svDraw() { if (svDrawn || !SV) return; svDrawn = true;
    SV.lines.forEach(function (ln) { var Ls = ln.entries.filter(function (e) { return e.kind === 'land'; });
      Ls.forEach(function (e, i) { var end = i + 1 < Ls.length ? Ls[i + 1].chain : 80;
        L.polyline([svLineXY(ln, e.chain || 0), svLineXY(ln, end)], { pane: 'survey', color: LANDCOL[e.land] || '#8a5a2b', weight: e.rate === '2nd' ? 9 : 6, opacity: .85, dashArray: e.rate ? null : '8 5', interactive: false }).addTo(gSV); });
      ln.entries.filter(function (e) { return e.kind === 'crossing'; }).forEach(function (e) { var isC = e.water.indexOf('creek') === 0;
        var m = L.marker(svLineXY(ln, e.chain), { pane: 'survey', icon: L.divIcon({ className: '', html: '<div class="mk-x' + (isC ? '' : ' br') + '" style="width:' + (isC ? 16 : 13) + 'px;height:' + (isC ? 16 : 13) + 'px"></div>', iconSize: [isC ? 16 : 13, isC ? 16 : 13] }), title: (isC ? 'Creek' : 'Branch') + ' crossing, 1821 (approximate)', alt: 'crossing', keyboard: true });
        m.on('click', function (ev) { L.DomEvent.stopPropagation(ev); svX(ln, e); }); m.addTo(gSV); }); });
    SV.posts.forEach(function (p) { var isS = p.kind === 'section corner', sz = isS ? 15 : 13;
      var m = L.marker(bil(p.pos[0], p.pos[1], p.pos[2]), { pane: 'survey', icon: L.divIcon({ className: '', html: '<div class="mk-post' + (isS ? '' : ' q') + '" style="width:' + sz + 'px;height:' + sz + 'px"></div>', iconSize: [sz, sz] }), title: p.name + ' (1821 post, position approximate)', alt: p.name, keyboard: true });
      m.on('click', function (ev) { L.DomEvent.stopPropagation(ev); svPost(p); }); m.addTo(gSV); }); }
  function svIntro() { openCard('<h2>The 1821 survey</h2><p class="legal">Original GLO field notes, T15S R3W · deputy surveyor "[H.?] Clements" · notes closed 22 Jun 1821 (p363)</p><div class="tags">' + tag('Documented', 'Trees and notes') + tag('Approximate', 'Every position') + '</div>' +
    '<p>Diamonds are posts with witness trees (solid: section corners; open: half mile or quarter posts). Blue circles are creek crossings; open circles are branches. Colored strokes along the lines are the land as written: brown hilly, gold rolling, green level; thick is 2nd rate, dashed is rate not restated.</p>' +
    '<p>Open a section card:</p><p>' + Object.keys(SV.cards).map(function (k) { return '<button type="button" class="btn small" data-svcard="' + k + '">Section ' + k + '</button>'; }).join(' ') + '</p>' +
    '<p class="src">The dates the lines were run: Unresolved. Not in hand: pp348-349, 352-353, 360-361. ' + SVPERM + '</p>', false); }

  /* ---------- layer switches ---------- */
  var on = {};
  var LAYER = {
    parcels: [gParcels, gYr], grid: [gGrid, gGridLbl], places: [gPlaces], roads: [gRoads, gRoadLbl],
    households: [gHH], survey: [gSV], usgs1906: [old1906], contours: [contours]
  };
  function setLayer(id, val) { on[id] = val;
    if (id === 'terrain') { T.shade.remove(); T.relief.remove(); if (val) T[val].addTo(map); }
    else if (id === 'households') { if (val) { hhYear = val; drawHH(); gHH.addTo(map); } else { gHH.remove(); hhYear = null; } }
    else if (id === 'survey') { if (val) { svDraw(); gSV.addTo(map); } else gSV.remove(); }
    else if (id === 'bookmap') { if (val) bookCard(); }
    else if (LAYER[id]) LAYER[id].forEach(function (l) { if (val) l.addTo(map); else l.remove(); });
    yrLabels(); legend(); }
  function yrLabels() { var z = map.getZoom(); if (on.parcels && z >= 15) gYr.addTo(map); else gYr.remove(); if (on.grid && z >= 13) gGridLbl.addTo(map); else gGridLbl.remove(); if (on.roads && z >= 15) gRoadLbl.addTo(map); else gRoadLbl.remove(); }
  map.on('zoomend', yrLabels);

  /* the panel */
  $$('[data-layer]').forEach(function (inp) { var id = inp.getAttribute('data-layer');
    inp.addEventListener('change', function () {
      if (id === 'households') { var y = inp.checked ? ($('input[name=hhy]:checked') || {}).value || '1860' : null; $('#hhYears').hidden = !inp.checked; setLayer(id, y); if (y) { map.flyToBounds([[33.690, -86.903], [33.743, -86.815]], { duration: .6 }); hhList(); } }
      else if (id === 'terrain') { var st = inp.checked ? ($('input[name=tstyle]:checked') || {}).value || 'shade' : null; $('#terrCtl').hidden = !inp.checked; setLayer('terrain', st); }
      else if (id === 'survey') { setLayer(id, inp.checked); if (inp.checked) { map.flyToBounds(L.latLngBounds(D.layers.township.bounds), { duration: .6 }); svIntro(); } }
      else if (id === 'bookmap') { setLayer(id, inp.checked); }
      else if (id === 'usgs1906') { setLayer(id, inp.checked); $('#oldCtl').hidden = !inp.checked; }
      else setLayer(id, inp.checked); });
    if (inp.checked) inp.dispatchEvent(new Event('change')); });
  $$('input[name=hhy]').forEach(function (r) { r.addEventListener('change', function () { if ($('[data-layer=households]').checked) { setLayer('households', r.value); hhList(); } }); });
  $$('input[name=tstyle]').forEach(function (r) { r.addEventListener('change', function () { if ($('[data-layer=terrain]').checked) setLayer('terrain', r.value); }); });
  $('#terrOp').addEventListener('input', function () { var v = this.value / 100; T.shade.setOpacity(v); T.relief.setOpacity(v); $('#terrOpOut').textContent = this.value + '%'; });
  $('#oldOp').addEventListener('input', function () { old1906.setOpacity(this.value / 100); $('#oldOpOut').textContent = this.value + '%'; });

  /* year slider */
  var yr = 1891;
  function setYear(y) { yr = y; $('#yr').value = y; $('#yrOut').textContent = y < 1826 ? 'none yet' : String(y);
    D.parcels.parcels.forEach(function (p) { var fut = p.yr > y; p.polys.forEach(function (x) { x.setStyle({ fillOpacity: fut ? 0 : fillFor(), opacity: fut ? .35 : 1, dashArray: fut ? '4 5' : null });
      var el = x.getElement(); if (el) { el.style.pointerEvents = fut ? 'none' : ''; if (fut) el.setAttribute('tabindex', '-1'); else el.setAttribute('tabindex', '0'); } });
      p.lbls.forEach(function (m) { m.setOpacity(fut ? 0 : 1); }); }); }
  function fillFor() { var z = map.getZoom(); return z >= 17 ? .12 : (z >= 16 ? .25 : .45); }
  map.on('zoomend', function () { setYear(yr); });
  $('#yr').addEventListener('input', function () { setYear(+this.value); });

  /* era picker */
  var ERA = D.eras;
  function chaptersFor(e) { return ERA.family_chapters.filter(function (c) { return c.from <= e.to && c.to >= e.from; }).map(function (c) { return c.name + ' (' + c.from + ' to ' + (c.to >= 2026 ? 'now' : c.to) + ')'; }); }
  function itemsFor(e) { return ERA.items.filter(function (it) { return it.from <= e.to && it.to >= e.from; }); }
  function eraCard(id) { var e = ERA.eras.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    var ps = D.parcels.parcels.filter(function (p) { return p.yr >= e.from && p.yr <= e.to; });
    var cens = YEARS.filter(function (y) { return +y >= e.from && +y <= e.to; });
    var onMap = [];
    if (ps.length) onMap.push(ps.length + ' Graham-name entries (' + ps.map(function (p) { return p.yr; }).sort().filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + ')');
    if (cens.length) onMap.push('Census households: ' + cens.join(', '));
    if (SV && e.from <= 1821 && e.to >= 1821) onMap.push('The 1821 survey');
    if (e.from <= 1906 && e.to >= 1904) onMap.push('The USGS sheet (about 1904 to 1906)');
    if (D.bookmap && e.from <= 1945 && e.to >= 1930) onMap.push('The family book\'s 1930s and 40s map (key only)');
    if (e.to >= 2024) onMap.push('The 2024 lidar terrain');
    var groups = { plants: 'Plants and the land', animals: 'Animals', sky: 'Sky and time' }, its = itemsFor(e), html = '';
    Object.keys(groups).forEach(function (g) { var list = its.filter(function (i) { return i.group === g; }); if (!list.length) return;
      html += '<h3>' + groups[g] + '</h3><ul>' + list.map(function (i) { return '<li><strong>' + esc(i.name) + '</strong> (' + esc(i.status) + '). ' + esc(i.text) + (i.joe ? ' <em>' + esc(i.joe) + '</em>' : '') + ' ' + tag(i.label) + '<br><span class="src">' + (i.url ? '<a href="' + esc(i.url) + '" target="_blank" rel="noopener">' + esc(i.source) + '</a>' : esc(i.source)) + '</span></li>'; }).join('') + '</ul>'; });
    if (!html) html = '<p>No plants or animals written up for these years yet. Add them in data/eras.json.</p>';
    openCard('<h2>' + esc(e.name) + '</h2><p class="legal">' + esc(e.years) + '</p><div class="tags">' + tag(e.label, 'Era') + '</div>' + (e.summary ? '<p>' + esc(e.summary) + '</p>' : '') +
      (e.url ? '<p class="src"><a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.source) + '</a></p>' : (e.source ? '<p class="src">' + esc(e.source) + '</p>' : '')) +
      '<h3>Family chapters in these years</h3><p>' + (chaptersFor(e).join('; ') || 'none') + '</p><h3>On this map from these years</h3>' + (onMap.length ? '<ul><li>' + onMap.join('</li><li>') + '</li></ul>' : '<p>Nothing yet.</p>') + html +
      '<p><a href="eras.html#' + esc(e.id) + '">Plants and animals for every era, on one page</a></p>'); }
  $('#era').addEventListener('change', function () { var id = this.value; if (!id) { setYear(1891); closeCard(); return; }
    var e = ERA.eras.filter(function (x) { return x.id === id; })[0];
    setYear(Math.max(1825, Math.min(1891, e.to)));
    var cens = YEARS.filter(function (y) { return +y >= e.from && +y <= e.to; }); if (cens.length) { var r = $('input[name=hhy][value="' + cens[cens.length - 1] + '"]'); if (r) { r.checked = true; if (on.households) setLayer('households', r.value); } }
    eraCard(id); });

  /* book map key */
  function bookCard() { var B = D.bookmap; if (!B) return;
    openCard('<h2>Family book map, 1930s and 40s</h2><p class="legal">"' + esc(B.title) + '"</p><div class="tags">' + tag(B.label) + tag(B.position, 'Positions') + '</div>' +
      '<p>These are not placed on the map. Nobody knows where the houses sat, and the sketch is not to scale.</p>' +
      (B.images && S.familyBookImages ? '<p>' + B.images.map(function (im) { return '<a href="images/' + esc(im.file) + '" target="_blank" rel="noopener"><img src="images/' + esc(im.file) + '" alt="' + esc(im.alt) + '" loading="lazy"></a>'; }).join('</p><p>') + '</p>' : '') +
      '<h3>The numbered key, as printed</h3><ol class="bk" style="list-style:none;padding-left:0">' + B.key.map(function (k) { return '<li><strong>' + esc(k.no) + '.</strong> ' + esc(k.as_written) + '</li>'; }).join('') + '</ol><p>' + esc(B.footnote) + '</p>' +
      '<h3>Names written on the sketch</h3><p>' + B.hand_labels.map(esc).join(', ') + '</p><h3>Notes</h3><ul>' + B.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul><p class="src">Source: ' + esc(B.source) + '</p>', false); }

  /* the spot you clicked */
  map.on('click', function (e) { var loc = locate(e.latlng.lat, e.latlng.lng), z = elevFt(e.latlng), h = '';
    if (loc) { var hits = D.parcels.parcels.filter(function (p) { if (p.sec !== loc.sec) return false; return p.al.some(function (code) { var r = rng(code); return loc.u >= r[0] && loc.u <= r[1] && loc.v >= r[2] && loc.v <= r[3]; }); });
      h = '<p class="legal">' + legal(loc.code) + ' · Section ' + loc.sec + ' · T15S R3W (today\'s grid)</p><div class="tags">' + tag('Computed') + '</div>' + (z != null ? '<p>Ground elevation about <strong>' + Math.round(z / 5) * 5 + ' ft</strong> (2024 lidar).</p>' : '') +
        (hits.length ? '<h3>Graham-name entries on this forty</h3><ul>' + hits.map(function (p) { return '<li><a href="#" data-parcel="' + p.id + '">' + esc(p.who) + '</a>, ' + p.yr + '</li>'; }).join('') + '</ul>' : '<p>No Graham-name entry on this forty.</p>') +
        (D.sections.approximate[loc.sec] ? '<p class="src">Section ' + loc.sec + ' is drawn approximately.</p>' : ''); }
    else h = '<p class="legal">Outside the sections drawn on this map.</p>' + (z != null ? '<p>Ground elevation about <strong>' + Math.round(z / 5) * 5 + ' ft</strong> (2024 lidar).</p>' : '');
    lastFocus = null; clearSel(); openCard('<h2>This spot</h2>' + h, false); });

  /* elevation readout and the honest note */
  var ElevCtl = L.Control.extend({ options: { position: 'bottomleft' }, onAdd: function () { var d = L.DomUtil.create('div', 'lm-elev'); d.id = 'elev'; d.setAttribute('aria-live', 'off'); d.textContent = 'Point at the map for elevation'; return d; } });
  new ElevCtl().addTo(map);
  map.on('mousemove', function (e) { var z = elevFt(e.latlng); $('#elev').textContent = z == null ? 'Outside the lidar' : 'Elevation about ' + Math.round(z / 5) * 5 + ' ft'; });
  var NoteCtl = L.Control.extend({ options: { position: 'bottomright' }, onAdd: function () { var d = L.DomUtil.create('div', 'lm-note-ctl'); d.innerHTML = 'Section lines are today\'s grid, not the 1821 lines. Anything we placed is marked <strong>Approximate</strong>.'; L.DomEvent.disableClickPropagation(d); return d; } });
  new NoteCtl().addTo(map);

  /* views */
  $('#bHome').addEventListener('click', function () { map.flyTo(D.layers.home.center, D.layers.home.zoom, { duration: .6 }); });
  $('#bAll').addEventListener('click', function () { map.flyToBounds(L.latLngBounds(D.layers.township.bounds), { duration: .6 }); });

  /* legend: only what is on */
  function legend() { var c = D.parcels.colors, out = [];
    if (on.parcels) Object.keys(D.parcels.groups).forEach(function (k) { out.push('<li><span class="sw f" style="color:' + c[k] + '"></span>' + esc(D.parcels.groups[k].name) + '</li>'); });
    if (on.parcels) out.push('<li><span class="sw" style="color:#7a8592;border-style:dashed"></span>Entered after the slider year</li>');
    if (on.grid) { out.push('<li><span class="ln" style="color:#22303f"></span>Section line (today\'s grid)</li>'); out.push('<li><span class="ln" style="color:#7a8592;border-top-width:1px"></span>Forty lines (even division)</li>'); out.push('<li><span class="ln d" style="color:#22303f"></span>Sections 17 and 18, approximate</li>'); }
    if (on.places) { out.push('<li><span class="dt" style="color:#a3342f"></span>Graham Cemetery</li><li><span class="sw" style="color:#17222e;background:#17222e;width:13px;height:13px"></span>Grahams Chapel</li><li><span class="dt" style="color:#17222e;background:#fff;border:3px solid #17222e"></span>Grahams Mill (approximate)</li>'); }
    if (on.roads) out.push('<li><span class="ln" style="color:#2b2f33"></span>Roads today</li><li><span class="ln" style="color:#1f5f8b;border-top-width:2px"></span>Creeks today</li>');
    if (on.households) out.push('<li><span class="dt" style="color:#6a3d7c"></span>Census household on land in the same name (' + hhYear + ')</li><li><span class="dt" style="color:#6a3d7c;background:#fff;border:2px dashed #6a3d7c"></span>Land in a late husband\'s name</li>');
    if (on.survey) out.push('<li><span class="dm" style="color:#0d5f69"></span>1821 post with witness trees (approximate)</li><li><span class="dt" style="color:#1f5f8b"></span>1821 creek crossing (approximate)</li><li><span class="ln" style="color:#8a5a2b;border-top-width:5px"></span>Land written hilly</li><li><span class="ln" style="color:#b8892e;border-top-width:5px"></span>rolling</li><li><span class="ln" style="color:#3f8f5a;border-top-width:5px"></span>level</li>');
    if (on.usgs1906) out.push('<li><span class="sw" style="color:#9c7b4b;background:#efe4cf"></span>USGS sheet, about 1906 (fitted)</li>');
    if (on.terrain) out.push('<li><span class="sw f" style="color:#c8b99a"></span>' + (on.terrain === 'relief' ? 'Local relief: light is higher than its surroundings, dark is lower' : 'Shaded relief, tinted by height (green low, tan high)') + '</li>');
    if (on.contours) out.push('<li><span class="ln" style="color:#80603c;border-top-width:2px"></span>Contours (10 ft close in; heavier every 50 ft)</li>');
    $('#legend').innerHTML = out.join('') || '<li>Nothing switched on.</li>'; }

  /* search */
  var IDX = [];
  D.parcels.parcels.forEach(function (p) { IDX.push({ t: p.who, k: legal(p.al[0]) + ' Sec. ' + p.sec + ', ' + p.yr + (p.rec ? ', written "' + p.rec + '"' : ''), s: (p.who + ' ' + (p.rec || '')).toLowerCase(), go: function () { showParcel(p.id, true); } }); });
  YEARS.forEach(function (y) { HHY[y].placed.forEach(function (h, i) { IDX.push({ t: h.n, k: y + ' census, placed on land in the same name', s: (h.n + ' ' + (h.w || '')).toLowerCase(), go: function () { var cb = $('[data-layer=households]'); var r = $('input[name=hhy][value="' + y + '"]'); r.checked = true; if (!cb.checked) { cb.checked = true; $('#hhYears').hidden = false; } setLayer('households', y); var row = h.land[0], c = centerOf(row[0], row[1]); map.flyTo(c, 15, { duration: .6 }); showHH(i); } }); });
    HHY[y].other.forEach(function (o) { IDX.push({ t: o.split(':')[0].slice(0, 90), k: y + ' census, not placed', s: o.toLowerCase(), go: function () { var cb = $('[data-layer=households]'); $('input[name=hhy][value="' + y + '"]').checked = true; if (!cb.checked) { cb.checked = true; $('#hhYears').hidden = false; } setLayer('households', y); hhList(); } }); }); });
  D.places.placed.forEach(function (pl) { IDX.push({ t: pl.name, k: 'place', s: pl.name.toLowerCase(), go: function () { map.flyTo([pl.lonlat[1], pl.lonlat[0]], 16, { duration: .6 }); placeCard(pl); } }); });
  D.places.unplaced.forEach(function (pl) { IDX.push({ t: pl.name, k: 'not placed', s: pl.name.toLowerCase(), go: function () { unplacedCard(pl); } }); });
  if (D.bookmap) D.bookmap.key.forEach(function (k) { IDX.push({ t: k.no + '. ' + k.as_written, k: 'family book map key (not placed)', s: k.as_written.toLowerCase(), go: function () { var cb = $('[data-layer=bookmap]'); if (cb) cb.checked = true; bookCard(); } }); });
  function secCard(n) { var ps = D.parcels.parcels.filter(function (p) { return p.sec === n; });
    map.flyToBounds(L.latLngBounds([bil(n, 0, 0), bil(n, 1, 1)]).pad(.05), { duration: .6 });
    openCard('<h2>Section ' + n + '</h2><p class="legal">T15S R3W · today\'s grid' + (D.sections.approximate[n] ? ' · approximate' : '') + '</p>' + (D.sections.approximate[n] ? '<div class="tags">' + tag('Approximate') + '</div><p>' + esc(D.sections.approximate[n]) + '</p>' : '') +
      (ps.length ? '<h3>Graham-name entries</h3><ul>' + ps.map(function (p) { return '<li><a href="#" data-parcel="' + p.id + '">' + esc(p.who) + '</a>, ' + p.al.map(legal).join(', ') + ', ' + p.yr + '</li>'; }).join('') + '</ul>' : '<p>No Graham-name entries in this section.</p>') +
      (SV && SV.cards[n] ? '<p><button type="button" class="btn small" data-svcard="' + n + '">1821 survey card for Section ' + n + '</button></p>' : '')); }
  function unplacedCard(pl) { openCard('<h2>' + esc(pl.name) + '</h2><div class="tags">' + tag(pl.label, 'Fact') + tag(pl.position, 'Position') + '</div><ul>' + pl.facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' + (pl.image && S.familyBookImages ? '<p><a href="images/' + esc(pl.image) + '" target="_blank" rel="noopener"><img src="images/' + esc(pl.image) + '" alt="' + esc(pl.image_alt) + '" loading="lazy"></a></p>' : '') + '<p class="src">Source: ' + esc(pl.source) + '</p>'); }
  window.__unplaced = unplacedCard;
  var q = $('#q'), res = $('#results'), hits = [];
  function runSearch() { var v = q.value.trim().toLowerCase(); hits = []; if (!v) { res.hidden = true; q.setAttribute('aria-expanded', 'false'); return; }
    var m = v.match(/^(?:sec(?:tion)?\.?\s*)?(\d{1,2})$/); if (m && SEC[m[1]]) hits.push({ t: 'Section ' + m[1], k: 'jump to the section', go: function () { secCard(+m[1]); } });
    IDX.forEach(function (x) { if (x.s.indexOf(v) >= 0 && hits.length < 14) hits.push(x); });
    res.innerHTML = hits.length ? hits.map(function (h, i) { return '<li role="option"><button type="button" data-hit="' + i + '">' + esc(h.t) + '<span class="k">' + esc(h.k) + '</span></button></li>'; }).join('') : '<li role="option"><button type="button" disabled>No match. Try a surname or a section number.</button></li>';
    res.hidden = false; q.setAttribute('aria-expanded', 'true'); }
  q.addEventListener('input', runSearch);
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (hits[0]) { res.hidden = true; lastFocus = q; hits[0].go(); } } else if (e.key === 'ArrowDown') { var b = $('button', res); if (b) { e.preventDefault(); b.focus(); } } else if (e.key === 'Escape') { res.hidden = true; } });
  res.addEventListener('click', function (e) { var b = e.target.closest('[data-hit]'); if (!b) return; res.hidden = true; lastFocus = q; hits[+b.getAttribute('data-hit')].go(); });
  res.addEventListener('keydown', function (e) { var bs = $$('button', res), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown' && i < bs.length - 1) { e.preventDefault(); bs[i + 1].focus(); } else if (e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) bs[i - 1].focus(); else q.focus(); } else if (e.key === 'Escape') { res.hidden = true; q.focus(); } });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) res.hidden = true; });

  /* links inside the card */
  window.__wire = function () {
    $$('[data-parcel]', cardBody).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); showParcel(a.getAttribute('data-parcel'), true); }); });
    $$('[data-svcard]', cardBody).forEach(function (b) { b.addEventListener('click', function () { var cb = $('[data-layer=survey]'); if (cb && !cb.checked) { cb.checked = true; setLayer('survey', true); } svCard(b.getAttribute('data-svcard')); }); }); };

  /* the table of forties */
  var tb = $('#rows');
  D.parcels.parcels.slice().sort(function (a, b) { return a.yr - b.yr || a.sec - b.sec; }).forEach(function (p) { var tr = document.createElement('tr'); tr.tabIndex = 0;
    tr.innerHTML = '<td>' + (p.entry ? esc(p.entry) : 'not known') + '</td><td><span class="chip" style="background:' + D.parcels.colors[p.g] + '"></span>' + esc(p.who) + '</td><td>' + p.al.map(legal).join(', ') + ' Sec. ' + p.sec + '</td><td>' + esc(p.ac) + '</td><td>' + esc(p.how) + '</td><td>' + esc(p.pat) + '</td>';
    function go() { lastFocus = tr; showParcel(p.id, true); $('#map').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    tr.addEventListener('click', go); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); tb.appendChild(tr); });
  $$('[data-unplaced]').forEach(function (b) { b.addEventListener('click', function () { var pl = D.places.unplaced.filter(function (x) { return x.id === b.getAttribute('data-unplaced'); })[0]; lastFocus = b; unplacedCard(pl); $('#map').scrollIntoView({ block: 'start' }); }); });

  $('#cardClose').addEventListener('click', closeCard);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden && card.contains(document.activeElement)) closeCard(); });

  /* deep link: #sec-28 or #parcel-w28a */
  var hm = location.hash.match(/^#(sec|parcel)-([\w]+)$/);
  if (hm) { if (hm[1] === 'sec' && SEC[hm[2]]) secCard(+hm[2]); else if (byId[hm[2]]) showParcel(hm[2], true); }
  setYear(1891); legend(); yrLabels();
  window.__map = map;
}
function wireCard() { if (window.__wire) window.__wire(); }
function clearSel() { if (window.__clearSel) window.__clearSel(); }

/* On the website the page is behind the family-archive gate: start the map only once it is open. */
var root = document.documentElement;
function ready() { return !root.classList.contains('pg-locked'); }
function start() { if (start.done) return; start.done = true; init(); }
if (ready()) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start(); }
else { var mo = new MutationObserver(function () { if (ready()) { mo.disconnect(); start(); setTimeout(function () { if (map) map.invalidateSize(); }, 50); } }); mo.observe(root, { attributes: true, attributeFilter: ['class'] }); }
})();
