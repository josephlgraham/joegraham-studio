/* Farms page: search, filters and sorting for the table of every record. Plain JavaScript, nothing loaded from outside. */
(function () {
  var t = document.getElementById("farmtable");
  if (!t) return;
  var body = t.tBodies[0];
  var rows = Array.prototype.slice.call(body.rows);
  var q = document.getElementById("ff-q"), fy = document.getElementById("ff-year"),
      ff = document.getElementById("ff-fam"), ft = document.getElementById("ff-type"),
      out = document.getElementById("ff-count");

  function filter() {
    var words = (q.value || "").toLowerCase().split(/\s+/).filter(Boolean), n = 0;
    rows.forEach(function (r) {
      var ok = (!fy.value || r.getAttribute("data-year") === fy.value) &&
               (!ff.value || r.getAttribute("data-family") === ff.value) &&
               (!ft.value || r.getAttribute("data-type") === ft.value);
      if (ok && words.length) {
        var s = r.getAttribute("data-s");
        ok = words.every(function (w) { return s.indexOf(w) >= 0; });
      }
      r.hidden = !ok;
      if (ok) n++;
    });
    out.textContent = n === rows.length ? rows.length + " records." : "Showing " + n + " of " + rows.length + " records.";
  }
  [q, fy, ff, ft].forEach(function (el) { el.addEventListener("input", filter); el.addEventListener("change", filter); });

  var heads = Array.prototype.slice.call(t.tHead.rows[0].cells), cur = -1, dir = 1;
  function val(r, k, isNum) {
    var c = r.cells[k], v = c ? c.getAttribute("data-v") : "";
    if (isNum) return v === "" || v === null ? null : parseFloat(v);
    return (v || "").toLowerCase();
  }
  heads.forEach(function (th, k) {
    var b = th.querySelector("button");
    if (!b) return;
    b.addEventListener("click", function () {
      var isNum = th.hasAttribute("data-num");
      dir = cur === k ? -dir : (isNum ? -1 : 1);
      cur = k;
      heads.forEach(function (h) { h.removeAttribute("aria-sort"); });
      th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
      rows.sort(function (a, c) {
        var x = val(a, k, isNum), y = val(c, k, isNum);
        if (x === null && y === null) return a.getAttribute("data-o") - c.getAttribute("data-o");
        if (x === null) return 1;            /* blanks always last */
        if (y === null) return -1;
        if (x < y) return -dir;
        if (x > y) return dir;
        return a.getAttribute("data-o") - c.getAttribute("data-o");
      });
      rows.forEach(function (r) { body.appendChild(r); });
    });
  });
  filter();
})();
