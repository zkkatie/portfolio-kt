// Dotted background that reacts to the cursor.
// A quiet grid of light grey dots; near the cursor the dots ease away,
// turn brown and are joined by faint lines. Still grid for reduced motion.
// Include on every page with <script src="background.js" defer></script>.

(function () {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // phones/tablets have no cursor to follow, so draw the grid once instead of animating
  var noHover = window.matchMedia('(hover: none)').matches;
  var still = reduceMotion || noHover;

  var SPACING = 34;     // px between dots
  var INFLUENCE = 150;  // px, cursor radius
  var MAX_PUSH = 10;    // px
  var EASE = 0.12;

  var DOT = [205, 188, 164];   // light tan
  var BLUE = [138, 90, 48];    // --accent (warm brown)

  var cols, rows, pts = [], width, height, dpr;
  var pointer = { x: -9999, y: -9999, active: false };

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(width / SPACING) + 1;
    rows = Math.ceil(height / SPACING) + 1;
    var offX = (width - (cols - 1) * SPACING) / 2;
    var offY = (height - (rows - 1) * SPACING) / 2;
    pts = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = offX + c * SPACING, y = offY + r * SPACING;
        pts.push({ ox: x, oy: y, x: x, y: y, g: 0 });
      }
    }
    if (still) draw();
  }

  function update() {
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], tx = p.ox, ty = p.oy, g = 0;
      if (pointer.active) {
        var dx = p.ox - pointer.x, dy = p.oy - pointer.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < INFLUENCE && d > 0.01) {
          var f = 1 - d / INFLUENCE;
          tx += (dx / d) * f * f * MAX_PUSH;
          ty += (dy / d) * f * f * MAX_PUSH;
          g = f;
        }
      }
      p.x += (tx - p.x) * EASE;
      p.y += (ty - p.y) * EASE;
      p.g += (g - p.g) * 0.15;
    }
  }

  function link(a, b) {
    var t = Math.min(a.g, b.g);
    if (t < 0.05) return;
    ctx.strokeStyle = rgba(BLUE, t * 0.3);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var p = pts[r * cols + c];
        if (p.g < 0.05) continue;
        if (c + 1 < cols) link(p, pts[r * cols + c + 1]);
        if (r + 1 < rows) link(p, pts[(r + 1) * cols + c]);
      }
    }
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i], t = q.g;
      ctx.fillStyle = t > 0.03 ? rgba(BLUE, 0.25 + t * 0.6) : rgba(DOT, 0.75);
      var s = 1.6 + t * 1.2;
      ctx.beginPath();
      ctx.arc(q.x, q.y, s / 2 + 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();

  if (!still) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { pointer.active = false; });
    requestAnimationFrame(loop);
  }
})();
