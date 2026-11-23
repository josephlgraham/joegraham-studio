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
  $$("svg title").forEach(function (t) {
    var p = t.parentNode, a = p.closest ? p.closest("a") : null;
    p.setAttribute("data-tip", t.textContent);
    if (a && !a.getAttribute("aria-label")) a.setAttribute("aria-label", t.textContent); /* the title was the link's name */
    t.remove();
  });
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

/* travel map: on a narrow screen the map scrolls sideways; start it centred on the route, not on the empty left edge.
   Runs when the map first gets a size, so it also works when the page is opened by the gate after load. */
(function(){
  function centre(f){
    if(f.scrollWidth<=f.clientWidth) return true;
    var pins=f.querySelectorAll('a.pin circle'); if(!pins.length) return true;
    var r=f.getBoundingClientRect(), lo=Infinity, hi=-Infinity;
    for(var i=0;i<pins.length;i++){var b=pins[i].getBoundingClientRect(); lo=Math.min(lo,b.left); hi=Math.max(hi,b.right);}
    f.scrollLeft=Math.max(0,(lo+hi)/2-r.left+f.scrollLeft-f.clientWidth/2);
    return true;
  }
  function wire(){
    document.querySelectorAll('.travelmap').forEach(function(f){
      if(f.clientWidth){centre(f);return;}
      if(!window.ResizeObserver) return;
      var ro=new ResizeObserver(function(){ if(f.clientWidth){ro.disconnect();centre(f);} }); ro.observe(f);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire); else wire();
})();

/* the lifeline switch: down the page or across. Remembered on this device only (22 Nov 2026). */
(function () {
  function all(r, s) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  all(document, ".lifeview").forEach(function (lv) {
    var KEY = "pedigree-lifeview", btns = all(lv, ".lv-switch button");
    var mq = window.matchMedia ? window.matchMedia("(max-width:700px)") : null;
    function shown() { return lv.dataset.view || (mq && mq.matches ? "v" : "h"); }
    function mark() { btns.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.view === shown() ? "true" : "false"); }); }
    try { var saved = window.localStorage.getItem(KEY); if (saved === "v" || saved === "h") lv.dataset.view = saved; } catch (e) {}
    mark();
    if (mq && mq.addEventListener) mq.addEventListener("change", mark);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        lv.dataset.view = b.dataset.view; mark();
        try { window.localStorage.setItem(KEY, b.dataset.view); } catch (e) {}
      });
    });
  });
})();

/* tap to read on the life bar (23 Nov 2026). A finger cannot hover, so a tap shows the same text in a box under the chart.
   The nearest item within reach counts, because the marks are small. On a link, the first tap reads it and the box carries
   the link; a mouse click still opens the link at once. */
(function () {
  var lastTouch = false;
  document.addEventListener("pointerdown", function (ev) { lastTouch = ev.pointerType === "touch" || ev.pointerType === "pen"; }, true);
  function nearest(svg, x, y) {
    var best = null, bd = 30;
    Array.prototype.forEach.call(svg.querySelectorAll("[data-tip]"), function (el) {
      var r = el.getBoundingClientRect();
      var dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom), d = Math.sqrt(dx * dx + dy * dy);
      if (d < bd) { bd = d; best = el; }
    });
    return best;
  }
  document.addEventListener("click", function (ev) {
    var fig = ev.target.closest ? ev.target.closest(".figure") : null;
    if (!fig) return;
    var svg = fig.querySelector("svg"); if (!svg) return;
    var hit = ev.target.closest("[data-tip]") || (lastTouch ? nearest(svg, ev.clientX, ev.clientY) : null);
    if (!hit) return;
    var link = hit.closest("a");
    if (link && !lastTouch) return;            /* mouse: let the link open as before */
    ev.preventDefault();
    var box = fig.nextElementSibling;
    if (!box || !box.classList.contains("tapread")) {
      box = document.createElement("div"); box.className = "tapread"; box.setAttribute("aria-live", "polite");
      fig.parentNode.insertBefore(box, fig.nextSibling);
    }
    Array.prototype.forEach.call(svg.querySelectorAll(".tapped"), function (x) { x.classList.remove("tapped"); });
    hit.classList.add("tapped");
    box.innerHTML = "";
    var p = document.createElement("p"); p.textContent = hit.getAttribute("data-tip").replace(/ · Click to open the source page$/, ""); box.appendChild(p);
    if (link) {
      var a = document.createElement("a"); a.href = link.getAttribute("href"); a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Open the source page"; box.appendChild(a);
    }
    var x = document.createElement("button"); x.type = "button"; x.className = "tapread-x"; x.textContent = "Close";
    x.addEventListener("click", function () { box.remove(); hit.classList.remove("tapped"); });
    box.appendChild(x);
  });
})();
