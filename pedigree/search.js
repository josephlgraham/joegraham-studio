/* search.js: the archive's search page (index.html). Reads search.json, made by pedigree_search.py on every publish.
   Everything runs in the browser; no outside requests. Questions work because the little words are dropped and a few
   words map to the words the records use ("buried" finds "burial" and "cemetery"). */
(function () {
  var form = document.getElementById("hub-form"), input = document.getElementById("hub-q"), out = document.getElementById("hub-out");
  if (!form || !input || !out) return;

  var STOP = ("a an and are as at be been but by can did do does for from had has have he her his how i if in into is it its me my " +
    "of on or our she that the their them then there they this to was we were what when where which who whom why will with you your " +
    "any about tell show find me us all some much many ever get got go went s").split(" ");
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  var SYN = {
    buried: ["burial", "cemetery", "grave", "buried", "stone"], burial: ["buried", "cemetery", "grave"], grave: ["cemetery", "burial", "buried"],
    born: ["birth", "born", "b"], birth: ["born", "birth"], died: ["death", "died", "d", "obituary"], death: ["died", "death", "obituary"], die: ["died", "death"],
    married: ["marriage", "married", "wife", "husband", "m"], marry: ["marriage", "married"], marriage: ["married", "marriage"], wife: ["married", "wife", "spouse"], husband: ["married", "husband", "spouse"],
    land: ["land", "forty", "acre", "patent", "entry", "tract"], farm: ["farm", "agricultural", "acre"], farms: ["farm", "agricultural"], grow: ["crop", "corn", "cotton", "bushel", "grew", "grow"], grew: ["crop", "corn", "cotton", "bushel", "grow"],
    pension: ["pension", "claim", "widow"], war: ["war", "regiment", "confederate", "union", "enlisted", "soldier"], soldier: ["regiment", "enlisted", "soldier", "war"],
    alive: ["alive"], lived: ["lived", "residence", "household", "census"], live: ["lived", "residence", "household", "census"], church: ["church", "chapel", "methodist", "baptist"],
    kids: ["children", "son", "daughter"], children: ["children", "son", "daughter", "child"], parents: ["father", "mother", "parents", "son", "daughter"],
    slave: ["slave", "enslaved", "schedule"], slaves: ["slave", "enslaved", "schedule"], enslaved: ["enslaved", "slave"]
  };
  var KIND = { person: "Life sheet", record: "Record page", era: "Era", essay: "The Old Homeplace", document: "Documents", farm: "Farm records",
    land: "Land map", place: "Place", pdf: "PDF", people: "Life sheets", page: "Page" };
  var GROUPS = [["all", "Everything"], ["people", "People", ["person", "record", "people"]], ["docs", "Documents", ["document", "pdf"]],
    ["land", "Land and places", ["land", "place"]], ["eras", "Eras", ["era", "essay"]], ["farms", "Farms", ["farm"]]];

  var D = null, loading = null, filter = "all", last = null, shown = 20;

  function fold(s) { return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function toks(s) { return fold(s).replace(/['’]s\b/g, "").split(/[^a-z0-9]+/).filter(Boolean); }
  function stem(w) {
    if (/^\d+$/.test(w) || w.length < 4) return w;
    if (/ies$/.test(w)) return w.slice(0, -3) + "y";
    if (/(ss|us|is)$/.test(w)) return w;
    if (/s$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function load() {
    if (!loading) loading = fetch("search.json").then(function (r) { return r.json(); }).then(function (d) {
      d.chunks.forEach(function (c) {
        var pg = d.pages[c[0]];
        c.b = " " + toks(c[3]).map(stem).join(" ") + " ";
        c.h = " " + toks(pg[1] + " " + c[2]).map(stem).join(" ") + " ";
      });
      D = d; return d;
    });
    return loading;
  }

  /* a word matches itself and its endings (mill, mills, miller), not every longer word it starts (million, millennial) */
  var ENDS = { "": 1, s: 1, es: 1, d: 1, ed: 1, er: 1, ers: 1, ing: 1, ings: 1, y: 1, ly: 1, n: 1, en: 1, al: 1 };
  function has(str, w) {
    if (w.length < 3 || /^\d+$/.test(w)) return str.indexOf(" " + w + " ") >= 0;
    var i = str.indexOf(" " + w);
    if (w === PRE) return i >= 0;      /* the word still being typed matches any word it starts ("tuck" finds Tucker) */
    while (i >= 0) { if (ENDS[str.slice(i + 1 + w.length, str.indexOf(" ", i + 1))]) return true; i = str.indexOf(" " + w, i + 1); }
    return false;
  }
  var PRE = null;

  function terms(q) {
    var t = toks(q).filter(function (w) { return !STOPSET[w]; });
    if (!t.length) t = toks(q);
    var seen = {};
    return t.filter(function (w) { if (seen[w]) return false; seen[w] = 1; return true; }).map(function (w) {
      var s = stem(w), alts = [s].concat((SYN[w] || SYN[s] || []).map(stem));
      return { w: w, s: s, alts: alts.filter(function (a, i) { return alts.indexOf(a) === i; }) };
    });
  }

  function search(q) {
    var T = terms(q);
    if (!T.length) return { T: T, groups: [], years: [] };
    var lastw = T[T.length - 1];
    PRE = TYPING && /[a-z]$/i.test(q) && toks(q).pop() === lastw.w ? lastw.s : null;
    var N = D.chunks.length;
    T.forEach(function (t) {           /* rarer words count for more */
      var n = 0; D.chunks.forEach(function (c) { if (t.alts.some(function (a) { return has(c.b, a) || has(c.h, a); })) n++; });
      t.idf = Math.log(1 + N / (1 + n)); t.df = n;
    });
    var live = T.filter(function (t) { return t.df > 0; });
    var need = live.length <= 2 ? live.length : live.length - 1;
    var byPage = {};
    D.chunks.forEach(function (c) {
      var m = 0, sc = 0;
      live.forEach(function (t) {
        var exact = has(c.b, t.s) || has(c.h, t.s), inB = exact || t.alts.some(function (a) { return has(c.b, a); }), inH = t.alts.some(function (a) { return has(c.h, a); });
        if (inB || inH) { m++; sc += t.idf * ((inB ? 1 : 0) + (inH ? 1.2 : 0)) * (exact ? 1 : 0.6); }
      });
      if (!m || m < need) return;
      sc *= (m / live.length) * (m / live.length);
      for (var i = 0; i + 1 < live.length; i++) {
        var pair = " " + live[i].s + " " + live[i + 1].s;
        if (c.b.indexOf(pair) >= 0) sc += live[i].idf;
        if (c.h.indexOf(pair) >= 0) sc += 1.5 * live[i].idf;      /* "thomas graham" as a phrase in the page name */
      }
      var pg = D.pages[c[0]];
      if (c[1] === "" && c[2] === "" && (pg[2] === "person" || pg[2] === "record")) sc *= 1.15;
      var g = byPage[c[0]] || (byPage[c[0]] = { p: c[0], best: 0, sum: 0, hits: [] });
      g.hits.push({ c: c, sc: sc }); g.best = Math.max(g.best, sc); g.sum += sc;
    });
    var qs = {}; T.forEach(function (t) { qs[t.s] = 1; });
    var groups = Object.keys(byPage).map(function (k) {
      var g = byPage[k]; g.hits.sort(function (a, b) { return b.sc - a.sc; });
      g.score = g.best + 0.15 * Math.min(g.sum - g.best, g.best * 2);
      /* a page whose whole name is in the question goes first: "Thomas Graham" over "James Thomas Graham" */
      var nt = toks(D.pages[k][1].replace(/\(.*?\)|".*?"/g, " ")).map(stem).filter(function (w) { return !STOPSET[w]; });
      if (nt.length > 1 && nt.every(function (w) { return qs[w]; })) g.score *= 1.8;
      return g;
    }).sort(function (a, b) { return b.score - a.score; });
    var years = (q.match(/\b(1[5-9]\d\d|20[0-2]\d)\b/g) || []).map(Number);
    return { T: live, groups: groups, years: years };
  }

  function snippet(text, T) {
    var f = fold(text), pos = -1;
    T.forEach(function (t) { t.alts.forEach(function (a) {
      var re = new RegExp("(^|[^a-z0-9])" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), m = re.exec(f);
      if (m && (pos < 0 || m.index < pos)) pos = m.index; }); });
    var start = 0, end = text.length;
    if (text.length > 280) { start = Math.max(0, pos - 90); end = Math.min(text.length, start + 280); }
    var s = esc((start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : ""));
    var words = [];
    T.forEach(function (t) { t.alts.forEach(function (a) { if (a.length >= 2) words.push(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); }); });
    if (!words.length) return s;
    words.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp("(^|[^A-Za-z0-9À-ɏ])(" + words.join("|") + ")([A-Za-z]*)", "gi");
    return s.replace(re, function (m, pre, w, rest) { return pre + "<mark>" + w + rest + "</mark>"; });
  }

  function href(pg, c) {
    var u = pg[0];
    if (c && c[1]) u = u.split("#")[0] + "#" + c[1];
    return u;
  }

  function eraFor(y) { for (var i = 0; i < D.eras.length; i++) if (D.eras[i][3] <= y && y <= D.eras[i][4]) return D.eras[i]; return null; }

  function render(q) {
    var r = last = search(q);
    var kinds = {}, total = 0;
    GROUPS.forEach(function (g) { kinds[g[0]] = 0; });
    r.groups.forEach(function (g) { var k = D.pages[g.p][2]; GROUPS.forEach(function (G) { if (G[2] && G[2].indexOf(k) >= 0) kinds[G[0]]++; }); total++; });
    kinds.all = total;
    var list = r.groups.filter(function (g) { var G = GROUPS.filter(function (x) { return x[0] === filter; })[0]; return !G[2] || G[2].indexOf(D.pages[g.p][2]) >= 0; });
    var html = "";
    var seenEra = {};
    r.years.forEach(function (y) { var er = eraFor(y); if (er && !seenEra[er[0]]) { seenEra[er[0]] = 1;
      html += '<a class="hub-era" href="era-' + esc(er[0]) + '.html"><span class="k">' + y + ' falls in</span><span class="t">' + esc(er[1]) + '</span><span class="y">' + esc(er[2]) + ': who was alive, the records, the land, and the farms</span></a>'; } });
    if (!r.T.length) { out.innerHTML = html || '<p class="hub-none">Nothing in the archive matches that yet. Try a surname, a place, or a year.</p>'; return; }
    html += '<div class="hub-filters" role="group" aria-label="Show only">' + GROUPS.map(function (G) {
      if (G[0] !== "all" && !kinds[G[0]]) return "";
      return '<button type="button" data-f="' + G[0] + '" aria-pressed="' + (filter === G[0]) + '">' + G[1] + ' <span>' + kinds[G[0]] + '</span></button>'; }).join("") + "</div>";
    if (!list.length) html += '<p class="hub-none">No match for every word. Try fewer words, or a surname on its own.</p>';
    html += '<ol class="hub-results">' + list.slice(0, shown).map(function (g) {
      var pg = D.pages[g.p], top = g.hits[0].c;
      var more = g.hits.slice(1, 3).map(function (h) {
        return '<li><a href="' + esc(href(pg, h.c)) + '">' + (h.c[2] ? '<b>' + esc(h.c[2]) + '</b> ' : "") + snippet(h.c[3], r.T) + "</a></li>"; }).join("");
      var extra = "";
      return '<li class="hr k-' + esc(pg[2]) + '"><span class="hr-k">' + esc(KIND[pg[2]] || "Page") + '</span>' +
        '<a class="hr-t" href="' + esc(href(pg, top)) + '">' + esc(pg[1]) + (top[2] ? ' <span class="hr-s">' + esc(top[2]) + "</span>" : "") + "</a>" +
        '<p class="hr-x">' + snippet(top[3], r.T) + "</p>" + (more ? '<ul class="hr-more">' + more + "</ul>" : "") + extra + "</li>"; }).join("") + "</ol>";
    if (list.length > shown) html += '<p><button type="button" class="hub-moreb" id="hub-more">Show ' + Math.min(20, list.length - shown) + " more of " + list.length + "</button></p>";
    out.innerHTML = html;
  }

  var timer = null;
  function run(push) {
    var q = input.value.trim();
    if (push) { try { history.replaceState(null, "", q ? "?q=" + encodeURIComponent(q).replace(/%20/g, "+") : location.pathname); } catch (e) {} }
    document.body.classList.toggle("hub-has-q", !!q);
    if (!q) { out.innerHTML = ""; return; }
    shown = 20;
    load().then(function () { render(q); }, function () { out.innerHTML = '<p class="hub-none">The search index did not load. Reload the page to try again.</p>'; });
  }
  var TYPING = false;
  form.addEventListener("submit", function (ev) { ev.preventDefault(); filter = "all"; TYPING = false; run(true); });
  input.addEventListener("input", function () { clearTimeout(timer); filter = "all"; timer = setTimeout(function () { TYPING = true; run(true); }, 180); });
  input.addEventListener("focus", load, { once: true });
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest ? ev.target.closest("[data-q]") : null;
    if (a) { ev.preventDefault(); input.value = a.getAttribute("data-q"); filter = "all"; TYPING = false; run(true); input.focus(); return; }
    var f = ev.target.closest ? ev.target.closest("[data-f]") : null;
    if (f && last) { filter = f.getAttribute("data-f"); shown = 20; render(input.value.trim()); var b = out.querySelector('[data-f="' + filter + '"]'); if (b) b.focus(); return; }
    if (ev.target.id === "hub-more") { shown += 20; render(input.value.trim()); }
  });
  var m = location.search.match(/[?&]q=([^&]*)/);
  if (m) { input.value = decodeURIComponent(m[1].replace(/\+/g, " ")); run(false); }
})();
