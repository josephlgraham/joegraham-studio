/* pedigree.js: small behaviours shared by the section. No outside requests. */
(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* turnings chips */
  $$(".tchip").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = document.getElementById(b.dataset.p), open = b.getAttribute("aria-expanded") === "true";
      $$(".tchip").forEach(function (x) { x.setAttribute("aria-expanded", "false"); });
      $$(".tpanel").forEach(function (x) { x.hidden = true; });
      if (!open) { b.setAttribute("aria-expanded", "true"); p.hidden = false; }
    });
  });

  /* hover tips on the life bar (the list under the figure carries the same facts) */
  $$("svg title").forEach(function (t) { t.parentNode.setAttribute("data-tip", t.textContent); t.remove(); });
  var tip = document.getElementById("tip");
  if (tip) {
    document.addEventListener("mousemove", function (ev) {
      var t = ev.target.closest ? ev.target.closest("[data-tip]") : null;
      if (!t) { tip.style.display = "none"; return; }
      tip.textContent = t.getAttribute("data-tip"); tip.style.display = "block";
      var w = tip.offsetWidth;
      tip.style.left = Math.min(ev.clientX + 12, window.innerWidth - w - 8) + "px";
      tip.style.top = (ev.clientY + 14) + "px";
    });
  }

  /* lightbox for document images */
  var ov = document.getElementById("ov"), im = document.getElementById("ovi");
  if (ov && im) {
    var close = function () { ov.style.display = "none"; im.removeAttribute("src"); };
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest ? ev.target.closest("a.dv") : null;
      if (a) {
        ev.preventDefault();
        im.src = a.href; im.alt = a.getAttribute("data-t") || "";
        document.getElementById("ovt").textContent = a.getAttribute("data-t") || "";
        document.getElementById("ovo").href = a.href;
        ov.style.display = "block"; ov.scrollTop = 0; return;
      }
      if (ev.target.id === "ovx" || ev.target === ov) { ev.preventDefault(); close(); }
    });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") close(); });
  }

  /* tree explorer: search, open all, close all, jump to a branch */
  var q = document.getElementById("q");
  if (q) {
    var qn = document.getElementById("qn");
    var items = $$(".tree li");
    var run = function () {
      var t = q.value.trim().toLowerCase(), n = 0;
      items.forEach(function (li) { li.style.display = ""; li.classList.remove("hit"); li._show = false; });
      qn.textContent = "";
      if (!t) return;
      for (var i = items.length - 1; i >= 0; i--) {
        var li = items[i], row = li.querySelector(":scope > details > summary, :scope > .row");
        var txt = row ? row.textContent.toLowerCase() : "";
        var mine = txt.indexOf(t) > -1, kid = false;
        $$(":scope > details > ul > li, :scope > ul > li", li).forEach(function (c) { if (c._show) kid = true; });
        li._show = mine || kid;
        li.style.display = li._show ? "" : "none";
        if (mine) { li.classList.add("hit"); n++; }
        var d = li.querySelector(":scope > details");
        if (d && kid) d.open = true;
      }
      qn.textContent = n + (n === 1 ? " match" : " matches");
    };
    q.addEventListener("input", run);
    var ex = document.getElementById("ex"), co = document.getElementById("co");
    if (ex) ex.onclick = function () { $$(".tree details").forEach(function (d) { d.open = true; }); };
    if (co) co.onclick = function () { $$(".tree details").forEach(function (d) { d.open = false; }); };
    if (location.hash) {
      var el = document.getElementById(location.hash.slice(1));
      while (el) { if (el.tagName === "DETAILS") el.open = true; el = el.parentElement; }
    }
    $$(".chips a[href^='#']").forEach(function (a) {
      a.addEventListener("click", function () {
        var el = document.getElementById(a.getAttribute("href").slice(1));
        while (el) { if (el.tagName === "DETAILS") el.open = true; el = el.parentElement; }
      });
    });
  }

  /* printing: open every fold, then put them back */
  var was = [];
  window.addEventListener("beforeprint", function () { was = $$("details").map(function (d) { return d.open; }); $$("details").forEach(function (d) { d.open = true; }); });
  window.addEventListener("afterprint", function () { $$("details").forEach(function (d, i) { d.open = !!was[i]; }); });
})();

/* travel map: a pin opens its card */
(function(){
  function openStop(id){
    var d=document.getElementById('stop-'+id); if(!d) return;
    document.querySelectorAll('details.stopcard.hit').forEach(function(x){x.classList.remove('hit')});
    d.open=true; d.classList.add('hit');
    d.scrollIntoView({behavior:'smooth',block:'center'});
  }
  document.addEventListener('click',function(ev){
    var a=ev.target.closest && ev.target.closest('a.pin');
    if(a){ev.preventDefault();openStop(a.getAttribute('data-stop'))}
  });
})();
