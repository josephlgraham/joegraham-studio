var PEDIGREE_PIN = "1836"; /* the one place the code lives. A curtain, not a lock. */
(function () {
  var PIN = PEDIGREE_PIN, KEY = "pedigree-gate";
  var root = document.documentElement;

  function remembered() {
    try { if (window.localStorage && window.localStorage.getItem(KEY) === PIN) return true; } catch (e) {}
    try { if (window.sessionStorage && window.sessionStorage.getItem(KEY) === PIN) return true; } catch (e) {}
    return false;
  }
  function remember() {
    var done = false;
    try { window.localStorage.setItem(KEY, PIN); done = window.localStorage.getItem(KEY) === PIN; } catch (e) {}
    if (!done) { try { window.sessionStorage.setItem(KEY, PIN); } catch (e) {} }
  }
  function forget() {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
    try { window.sessionStorage.removeItem(KEY); } catch (e) {}
  }

  /* Runs in the head, before first paint: the page is hidden unless this device is remembered. */
  if (remembered()) { root.classList.add("pg-open"); }
  else { root.classList.add("pg-locked"); }

  function open() {
    root.classList.remove("pg-locked");
    root.classList.add("pg-open");
    var h = document.getElementById("main");
    if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) {} }
    window.scrollTo(0, 0);
  }

  function wire() {
    var row = document.getElementById("pg-digits");
    if (row) {
      var boxes = Array.prototype.slice.call(row.querySelectorAll("input"));
      var hint = document.getElementById("pg-hint");
      var clear = function () { boxes.forEach(function (b) { b.value = ""; }); boxes[0].focus(); };
      var value = function () { return boxes.map(function (b) { return b.value; }).join(""); };
      var check = function () {
        var v = value();
        if (v.length < boxes.length) return;
        if (v === PIN) { remember(); open(); return; }
        if (hint) hint.textContent = "Not that one.";
        row.classList.remove("shake");
        void row.offsetWidth;
        row.classList.add("shake");
        window.setTimeout(function () { clear(); if (hint) hint.textContent = ""; }, 380);
      };
      boxes.forEach(function (b, i) {
        b.addEventListener("input", function () {
          var d = b.value.replace(/\D/g, "");
          if (d.length > 1) { /* a paste or autofill of several digits */
            for (var k = 0; k < d.length && i + k < boxes.length; k++) boxes[i + k].value = d.charAt(k);
            boxes[Math.min(i + d.length, boxes.length - 1)].focus();
          } else {
            b.value = d;
            if (d && i < boxes.length - 1) boxes[i + 1].focus();
          }
          check();
        });
        b.addEventListener("keydown", function (ev) {
          if (ev.key === "Backspace" && !b.value && i > 0) { boxes[i - 1].value = ""; boxes[i - 1].focus(); ev.preventDefault(); }
          else if (ev.key === "ArrowLeft" && i > 0) { boxes[i - 1].focus(); ev.preventDefault(); }
          else if (ev.key === "ArrowRight" && i < boxes.length - 1) { boxes[i + 1].focus(); ev.preventDefault(); }
        });
        b.addEventListener("focus", function () { try { b.select(); } catch (e) {} });
      });
      if (root.classList.contains("pg-locked") && boxes[0]) boxes[0].focus();
    }
    var f = document.getElementById("pg-forget");
    if (f) f.addEventListener("click", function (ev) { ev.preventDefault(); forget(); window.location.reload(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();
})();
