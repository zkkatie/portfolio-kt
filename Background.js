// Cursor-reactive dotted background.
// Draws a grid of dots on a fixed full-screen canvas. Dots near the pointer
// are pushed away slightly and ease back when the pointer moves on.
// Shared by every page — include with <script src="background.js" defer></script>.

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var SPACING = 42;        // px between dots at rest
  var DOT_RADIUS = 1.6;    // px
  var INFLUENCE = 140;     // px — pointer radius of effect
  var MAX_PUSH = 16;       // px — how far a dot can be displaced
  var EASE = 0.12;         // return-to-rest speed

  var dots = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var width = 0, height = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = document.documentElement.scrollHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid();
  }

  function buildGrid() {
    dots = [];
    var cols = Math.ceil(width / SPACING) + 1;
    var rows = Math.ceil(height / SPACING) + 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = c * SPACING;
        var y = r * SPACING;
        dots.push({ ox: x, oy: y, x: x, y: y });
      }
    }
  }

  function onPointerMove(e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY + window.scrollY;
    pointer.active = true;
  }

  function onPointerLeave() {
    pointer.active = false;
  }

  var dotColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--line').trim() || '#2A2A34';

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = dotColor;

    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var targetX = d.ox;
      var targetY = d.oy;

      if (pointer.active) {
        var dx = d.ox - pointer.x;
        var dy = d.oy - pointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < INFLUENCE && dist > 0.01) {
          var strength = (1 - dist / INFLUENCE) * MAX_PUSH;
          targetX = d.ox + (dx / dist) * strength;
          targetY = d.oy + (dy / dist) * strength;
        }
      }

      d.x += (targetX - d.x) * EASE;
      d.y += (targetY - d.y) * EASE;

      ctx.beginPath();
      ctx.arc(d.x, d.y - window.scrollY, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  function drawStatic() {
    // Reduced-motion fallback: plain still grid, no animation loop, no pointer tracking.
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = dotColor;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      ctx.beginPath();
      ctx.arc(d.ox, d.oy - window.scrollY, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  window.addEventListener('resize', resize);
  resize();

  if (reduceMotion) {
    drawStatic();
    window.addEventListener('scroll', drawStatic, { passive: true });
  } else {
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseleave', onPointerLeave);
    requestAnimationFrame(draw);
  }
})();