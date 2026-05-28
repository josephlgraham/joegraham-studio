(function () {
  var LEAFLET_VERSION = '1.9.4';
  var LEAFLET_CSS = 'https://unpkg.com/leaflet@' + LEAFLET_VERSION + '/dist/leaflet.css';
  var LEAFLET_JS  = 'https://unpkg.com/leaflet@' + LEAFLET_VERSION + '/dist/leaflet.js';

  function ready(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  ready(function () {
    var targets = document.querySelectorAll('.mini-map-leaflet');
    if (!targets.length) return;

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    document.head.appendChild(css);

    var style = document.createElement('style');
    style.textContent = '.mini-map-leaflet{position:relative;z-index:0;isolation:isolate;}';
    document.head.appendChild(style);

    var js = document.createElement('script');
    js.src = LEAFLET_JS;
    js.onload = function () {
      targets.forEach(initMap);
    };
    document.head.appendChild(js);
  });

  function initMap(el) {
    var bbox = (el.dataset.bbox || '').split(',').map(Number);
    if (bbox.length !== 4 || bbox.some(isNaN)) return;
    var sw = [bbox[1], bbox[0]];
    var ne = [bbox[3], bbox[2]];

    var map = L.map(el, {
      scrollWheelZoom: false,
      zoomControl: true
    });
    map.fitBounds([sw, ne]);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (el.dataset.marker) {
      var m = el.dataset.marker.split(',').map(Number);
      if (m.length === 2 && !m.some(isNaN)) {
        L.marker(m).addTo(map);
      }
    }
  }
})();
