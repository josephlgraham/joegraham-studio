/* Sources page: search, filters and sorting for the source catalog. Plain JavaScript, nothing loaded from outside.
   Filters can be set from the address: sources.html?person=nancy, ?kind=deed, ?q=claim. A #id opens with that source in view. */
(function () {
  var list = document.getElementById("srclist");
  if (!list) return;
  var items = Array.prototype.slice.call(list.children);
  var q = document.getElementById("sf-q"), fk = document.getElementById("sf-kind"), fe = document.getElementById("sf-era"),
      fr = document.getElementById("sf-repo"), fp = document.getElementById("sf-person"), fs = document.getElementById("sf-sort"),
      out = document.getElementById("sf-count");

  function filter() {
    var words = (q.value || "").toLowerCase().split(/\s+/).filter(Boolean), n = 0, span = fe.value ? fe.value.split("-").map(Number) : null;
    items.forEach(function (li) {
      var y = parseInt(li.getAttribute("data-y"), 10);
      var ok = (!fk.value || li.getAttribute("data-kind") === fk.value) &&
               (!fr.value || li.getAttribute("data-repo") === fr.value) &&
               (!fp.value || li.getAttribute("data-people").indexOf(" " + fp.value + " ") >= 0) &&
               (!span || (y >= span[0] && y <= span[1]));
      if (ok && words.length) {
        var s = li.getAttribute("data-s");
        ok = words.every(function (w) { return s.indexOf(w) >= 0; });
      }
      li.hidden = !ok;
      if (ok) n++;
    });
    out.textContent = n === items.length ? items.length + " sources." : "Showing " + n + " of " + items.length + " sources.";
  }

  function key(li, k) {
    if (k === "repo") return li.getAttribute("data-repo").toLowerCase() || "￿";
    return li.getAttribute("data-" + k) || "￿";      /* undated and blank last */
  }
  function sort() {
    var v = fs.value, dir = v.charAt(0) === "-" ? -1 : 1, k = v.replace("-", "");
    items.sort(function (a, b) {
      var x = key(a, k), y = key(b, k);
      if (x === "￿" && y !== "￿") return 1;
      if (y === "￿" && x !== "￿") return -1;
      if (x < y) return -dir;
      if (x > y) return dir;
      return a.getAttribute("data-o") - b.getAttribute("data-o");
    });
    items.forEach(function (li) { list.appendChild(li); });
  }

  try {
    var p = new URLSearchParams(location.search);
    if (p.get("q")) q.value = p.get("q");
    [["kind", fk], ["repo", fr], ["person", fp], ["era", fe], ["sort", fs]].forEach(function (a) {
      var v = p.get(a[0]);
      if (v && Array.prototype.some.call(a[1].options, function (o) { return o.value === v; })) a[1].value = v;
    });
  } catch (err) { /* old browsers: no address filters */ }

  [q, fk, fe, fr, fp].forEach(function (el) { el.addEventListener("input", filter); el.addEventListener("change", filter); });
  fs.addEventListener("change", sort);
  if (fs.value !== "date") sort();
  filter();
  if (location.hash) {
    var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t && t.parentNode === list) { t.hidden = false; t.classList.add("hit"); t.scrollIntoView(); }
  }
})();
