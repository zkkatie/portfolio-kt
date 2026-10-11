// Liquid puddle text reveal: an intro for the home page.
// Letters fall as droplets, pool into a puddle, then rise out of it as words.
// An SVG "gooey" filter (blur + alpha threshold) is what makes the droplets
// and letters melt into each other; at the end the blur is eased to zero so
// the name settles into crisp text.
// Plays once per visit (sessionStorage), can be skipped with a click or any key,
// and never plays for people who prefer reduced motion.

(function () {
  var intro = document.getElementById('intro');
  if (!intro) return;

  var KEY = 'introSeen';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  if (reduce || seen) { intro.remove(); return; }
  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

  // build the letters from the text in the stage
  var stage = intro.querySelector('.intro-stage');
  var text = stage.getAttribute('data-text') || stage.textContent.trim();
  stage.textContent = '';
  var i = 0;
  text.split('').forEach(function (ch) {
    var span = document.createElement('span');
    if (ch === ' ') {
      span.className = 'intro-space';
    } else {
      span.className = 'intro-letter';
      var glyph = document.createElement('span');
      glyph.className = 'ch';
      glyph.textContent = ch;
      span.appendChild(glyph);
      span.style.setProperty('--i', i++);
    }
    stage.appendChild(span);
  });
  var puddle = document.createElement('span');
  puddle.className = 'intro-puddle';
  stage.appendChild(puddle);

  document.documentElement.style.overflow = 'hidden';

  var blur = intro.querySelector('#intro-goo feGaussianBlur');
  var timers = [];
  var finished = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  // ease the gooey blur down to 0 so the text comes out sharp
  function sharpen(duration) {
    if (!blur) return;
    var start = performance.now();
    var from = parseFloat(blur.getAttribute('stdDeviation')) || 8;
    (function step(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      blur.setAttribute('stdDeviation', (from * (1 - eased)).toFixed(2));
      if (t < 1 && !finished) requestAnimationFrame(step);
    })(start);
  }

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    intro.classList.add('done', 'leaving');
    document.documentElement.style.overflow = '';
    setTimeout(function () { intro.remove(); }, 750);
  }

  later(function () { intro.classList.add('rising'); }, 1500);
  later(function () { sharpen(700); }, 1750);
  later(function () { intro.classList.add('done'); }, 2500);
  later(finish, 3500);

  // skip
  intro.addEventListener('click', finish);
  document.addEventListener('keydown', function onKey() {
    document.removeEventListener('keydown', onKey);
    finish();
  });
})();
