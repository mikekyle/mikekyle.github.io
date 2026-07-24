/**
 * tobiasahlin-inspired: staggered card reveal + background fade + Go tile animations
 * Pure vanilla JS, no dependencies.
 */

(function () {
  'use strict';

  /* --- Page background fade on scroll --- */
  var bg = document.querySelector('.page-bg');
  var ticking = false;

  function updateBg() {
    var scrolled = window.scrollY || window.pageYOffset;
    var maxScroll = window.innerHeight * 0.8;
    var pct = Math.min(scrolled / maxScroll, 1);

    if (pct > 0.8) {
      bg.classList.add('scrolled-down');
    } else if (bg.classList.contains('scrolled-down')) {
      bg.classList.remove('scrolled-down');
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateBg);
      ticking = true;
    }
  }, { passive: true });

  /* --- Intersection Observer: staggered card reveal --- */
  var cards = document.querySelectorAll('.card');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var card = entry.target;
            var gridCards = Array.from(
              card.parentElement.querySelectorAll('.card')
            );
            var idx = gridCards.indexOf(card);
            var delay = idx * 80;

            setTimeout(function () {
              card.style.animation = 'cardReveal 0.7s ' +
                'cubic-bezier(0.175, 0.885, 0.32, 1.275) both';
            }, delay);

            observer.unobserve(card);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    cards.forEach(function (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      observer.observe(card);
    });
  } else {
    cards.forEach(function (card) {
      card.style.opacity = '1';
    });
  }

  /* ============================================================
     Go stone canvas animations
     ------------------------------------------------------------
     Patterns are data-driven. Edit GO_PATTERNS (or swap the
     data-go-pattern attribute on a card) to change what plays.

     Layout: Tobias-style — stones sit in a compact .card-media
     slot between the title and subtitle (not a full-card bg).

     Stone format: { x, y, color }
       x, y  — 0-indexed intersections (0,0 = top-left)
       color — 'B' (black) or 'W' (white)

     Two pattern shapes:

     1) Simple sequence (joseki):
        { stones: [...], stoneDelay, stoneDuration, opacity }

     2) Tsumego:
        {
          setup: [...],            // initial problem stones
          setupJitter,             // ms window — randomised appear times
          setupDuration,           // pop-in duration
          thinkPause,              // long pause after setup
          moves: [                 // solution, step by step
            { x, y, color, captures?: [{x,y}, ...] }
          ],
          stoneDelay,              // delay between solution moves
          stoneDuration,
          captureDelay,            // remove captures shortly after placing
          captureDuration,
          opacity
        }
     ============================================================ */

  var GO_PATTERNS = {
    /**
     * Avalanche (nadare) joseki — Joseki Study card.
     * Coords as specified (0-indexed). User listed board:7 but sequence
     * reaches x=7, so size is 8 (intersections 0–7). Bounding-box crop
     * fills the media slot either way.
     * stoneDelay = 65% of the previous 320ms default → 208.
     */
    'avelanche': {
      size: 8,
      stoneDelay: 208,
      stoneDuration: 280,
      opacity: 0.95,
      stones: [
        { x: 3, y: 4, color: 'B' },
        { x: 5, y: 4, color: 'W' },
        { x: 5, y: 3, color: 'B' },
        { x: 4, y: 4, color: 'W' },
        { x: 4, y: 3, color: 'B' },
        { x: 3, y: 5, color: 'W' },
        { x: 6, y: 4, color: 'B' },
        { x: 3, y: 3, color: 'W' },
        { x: 2, y: 4, color: 'B' },
        { x: 3, y: 2, color: 'W' },
        { x: 2, y: 5, color: 'B' },
        { x: 3, y: 6, color: 'W' },
        { x: 4, y: 2, color: 'B' },
        { x: 6, y: 3, color: 'W' },
        { x: 6, y: 2, color: 'B' },
        { x: 7, y: 3, color: 'W' },
      ],
    },

    /**
     * Small ishinoshita (石の下) — Tsumego Pages card.
     * Setup rushes in (randomised, near-simultaneous), long think pause,
     * then solution step-by-step with captures shortly after the capturing
     * stone lands. Coords as specified (0-indexed); board listed as 6 but
     * reaches 6 → size 7.
     */
    'small-ishinoshita': {
      size: 7,
      opacity: 0.95,
      // Near-simultaneous rush: appear times randomised inside this window
      setupJitter: 55,
      setupDuration: 200,
      thinkPause: 4200,
      stoneDelay: 480,
      stoneDuration: 260,
      // Captures vanish just after the capturing stone — shorter than move gap
      captureDelay: 100,
      captureDuration: 160,
      setup: [
        { x: 1, y: 2, color: 'B' },
        { x: 2, y: 2, color: 'B' },
        { x: 3, y: 3, color: 'B' },
        { x: 4, y: 2, color: 'B' },
        { x: 5, y: 2, color: 'B' },
        { x: 1, y: 4, color: 'W' },
        { x: 2, y: 4, color: 'W' },
        { x: 3, y: 4, color: 'W' },
        { x: 4, y: 4, color: 'W' },
        { x: 4, y: 3, color: 'W' },
        { x: 5, y: 3, color: 'W' },
        { x: 6, y: 3, color: 'W' },
        { x: 6, y: 2, color: 'W' },
        { x: 6, y: 1, color: 'W' },
      ],
      moves: [
        { x: 5, y: 1, color: 'B' },
        { x: 3, y: 1, color: 'W' },
        { x: 2, y: 1, color: 'B' },
        { x: 3, y: 2, color: 'W' },
        {
          x: 4, y: 1, color: 'B',
          captures: [{ x: 3, y: 1 }, { x: 3, y: 2 }],
        },
        { x: 3, y: 2, color: 'W' },
        { x: 2, y: 3, color: 'B' },
        {
          x: 3, y: 1, color: 'W',
          captures: [
            { x: 4, y: 2 },
            { x: 4, y: 1 },
            { x: 5, y: 2 },
            { x: 5, y: 1 },
          ],
        },
        { x: 4, y: 2, color: 'B' },
      ],
    },
  };

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInCubic(t) {
    return t * t * t;
  }

  function shuffled(arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function collectCoords(pattern) {
    var pts = [];
    function push(s) {
      if (!s) return;
      pts.push(s);
      if (s.captures) {
        s.captures.forEach(function (c) { pts.push(c); });
      }
    }
    if (pattern.setup) pattern.setup.forEach(push);
    if (pattern.moves) pattern.moves.forEach(push);
    if (pattern.stones) pattern.stones.forEach(push);
    return pts;
  }

  /**
   * Create and run a Go animation on one card's canvas.
   * @param {HTMLElement} card
   */
  function initGoCard(card) {
    var media = card.querySelector('.card-media');
    var canvas = card.querySelector('.card-canvas');
    var patternName = card.getAttribute('data-go-pattern');
    var pattern = GO_PATTERNS[patternName];

    if (!canvas || !pattern) return;

    var isTsumego = !!(pattern.setup && pattern.moves);
    var isSimple = !!(pattern.stones && pattern.stones.length);

    if (!isTsumego && !isSimple) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var opacity = pattern.opacity != null ? pattern.opacity : 0.95;
    var stoneDelay = pattern.stoneDelay != null ? pattern.stoneDelay : 300;
    var stoneDuration = pattern.stoneDuration != null ? pattern.stoneDuration : 260;

    // Bounding box across every coord that ever appears
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    collectCoords(pattern).forEach(function (s) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    });
    minX -= 1;
    maxX += 1;
    minY -= 1;
    maxY += 1;
    var spanX = Math.max(1, maxX - minX);
    var spanY = Math.max(1, maxY - minY);

    var started = false;
    var startTime = 0;
    var rafId = null;
    var dpr = 1;
    var cssW = 0;
    var cssH = 0;
    var settled = false;

    // Live stone instances (same intersection may reappear after a capture)
    var stoneInstances = [];
    var timelineBuilt = false;

    function resize() {
      var host = media || canvas.parentElement || card;
      var rect = host.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function intersectionToXY(x, y) {
      var pad = Math.min(cssW, cssH) * 0.08;
      var availW = cssW - pad * 2;
      var availH = cssH - pad * 2;
      var cell = Math.min(availW / spanX, availH / spanY);
      var boardW = spanX * cell;
      var boardH = spanY * cell;
      var originX = (cssW - boardW) / 2;
      var originY = (cssH - boardH) / 2;
      return {
        cx: originX + (x - minX) * cell,
        cy: originY + (y - minY) * cell,
        radius: cell * 0.42,
      };
    }

    function drawStone(cx, cy, radius, color, scale) {
      if (scale <= 0) return;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = opacity;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);

      if (color === 'W') {
        ctx.fillStyle = '#f2f2f2';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = Math.max(1, radius * 0.06);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#111111';
        ctx.fill();
      }

      ctx.restore();
    }

    function placeStone(x, y, color, appearAt, durationIn) {
      stoneInstances.push({
        x: x,
        y: y,
        color: color,
        appearAt: appearAt,
        durationIn: durationIn,
        removeAt: null,
        durationOut: 0,
      });
    }

    function scheduleCapture(x, y, removeAt, durationOut) {
      // Remove the living stone currently at this intersection
      for (var i = stoneInstances.length - 1; i >= 0; i--) {
        var s = stoneInstances[i];
        if (
          s.x === x &&
          s.y === y &&
          s.removeAt == null &&
          s.appearAt < removeAt
        ) {
          s.removeAt = removeAt;
          s.durationOut = durationOut;
          return;
        }
      }
    }

    /**
     * Build absolute timeline into stoneInstances.
     * Returns total animation length in ms.
     */
    function buildTimeline() {
      stoneInstances = [];
      var t = 0;

      if (isSimple) {
        pattern.stones.forEach(function (s, i) {
          placeStone(s.x, s.y, s.color, i * stoneDelay, stoneDuration);
        });
        t = (pattern.stones.length - 1) * stoneDelay + stoneDuration;
        timelineBuilt = true;
        return t;
      }

      // --- Tsumego ---
      var setupJitter = pattern.setupJitter != null ? pattern.setupJitter : 50;
      var setupDuration = pattern.setupDuration != null ? pattern.setupDuration : 200;
      var thinkPause = pattern.thinkPause != null ? pattern.thinkPause : 4000;
      var captureDelay = pattern.captureDelay != null ? pattern.captureDelay : 100;
      var captureDuration = pattern.captureDuration != null ? pattern.captureDuration : 160;

      // Randomised near-simultaneous rush
      var setupOrder = shuffled(pattern.setup);
      var maxSetupAppear = 0;
      setupOrder.forEach(function (s) {
        var appearAt = Math.random() * setupJitter;
        if (appearAt > maxSetupAppear) maxSetupAppear = appearAt;
        placeStone(s.x, s.y, s.color, appearAt, setupDuration);
      });

      // Think pause starts once the last setup stone has finished popping in
      var solutionStart = maxSetupAppear + setupDuration + thinkPause;
      t = solutionStart;

      pattern.moves.forEach(function (move, i) {
        var appearAt = solutionStart + i * stoneDelay;
        placeStone(move.x, move.y, move.color, appearAt, stoneDuration);

        var moveEnd = appearAt + stoneDuration;
        if (moveEnd > t) t = moveEnd;

        if (move.captures && move.captures.length) {
          // Removals fire shortly after the capturing stone is placed
          var removeAt = appearAt + captureDelay;
          move.captures.forEach(function (c) {
            scheduleCapture(c.x, c.y, removeAt, captureDuration);
            var remEnd = removeAt + captureDuration;
            if (remEnd > t) t = remEnd;
          });
        }
      });

      timelineBuilt = true;
      return t;
    }

    function scaleForStone(stone, elapsed) {
      if (elapsed < stone.appearAt) return 0;
      var inT = (elapsed - stone.appearAt) / stone.durationIn;
      var scale = inT >= 1 ? 1 : easeOutCubic(Math.max(0, inT));

      if (stone.removeAt != null && elapsed >= stone.removeAt) {
        var outT = (elapsed - stone.removeAt) / stone.durationOut;
        if (outT >= 1) return 0;
        scale *= 1 - easeInCubic(Math.max(0, outT));
      }
      return scale;
    }

    function drawBoardAt(elapsed) {
      ctx.clearRect(0, 0, cssW, cssH);
      stoneInstances.forEach(function (stone) {
        var scale = scaleForStone(stone, elapsed);
        if (scale <= 0) return;
        var pos = intersectionToXY(stone.x, stone.y);
        drawStone(pos.cx, pos.cy, pos.radius, stone.color, scale);
      });
    }

    function finalElapsed() {
      return 1e9;
    }

    function drawReducedMotion() {
      // Show the problem position (setup only) — the tsumego itself
      stoneInstances = [];
      if (isTsumego) {
        pattern.setup.forEach(function (s) {
          placeStone(s.x, s.y, s.color, 0, 1);
        });
      } else {
        pattern.stones.forEach(function (s) {
          placeStone(s.x, s.y, s.color, 0, 1);
        });
      }
      drawBoardAt(finalElapsed());
      settled = true;
      timelineBuilt = true;
    }

    var totalMs = 0;

    function drawFrame(now) {
      if (!started) {
        if (prefersReducedMotion) {
          drawReducedMotion();
        }
        return;
      }

      var elapsed = now - startTime;
      drawBoardAt(elapsed);

      if (elapsed < totalMs) {
        rafId = requestAnimationFrame(drawFrame);
      } else {
        drawBoardAt(finalElapsed());
        settled = true;
        rafId = null;
      }
    }

    function start() {
      if (started) return;
      started = true;
      if (prefersReducedMotion) {
        drawReducedMotion();
        return;
      }
      totalMs = buildTimeline();
      startTime = performance.now();
      settled = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(drawFrame);
    }

    resize();

    if (prefersReducedMotion) {
      drawReducedMotion();
    }

    if ('IntersectionObserver' in window) {
      var goObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var gridCards = Array.from(
                card.parentElement.querySelectorAll('.card')
              );
              var idx = gridCards.indexOf(card);
              var delay = idx * 80 + 450;
              setTimeout(start, prefersReducedMotion ? 0 : delay);
              goObserver.unobserve(card);
            }
          });
        },
        { threshold: 0.2 }
      );
      goObserver.observe(card);
    } else {
      setTimeout(start, 600);
    }

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        if (!timelineBuilt && !settled) return;
        if (prefersReducedMotion || settled) {
          drawBoardAt(finalElapsed());
        } else if (started) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(drawFrame);
        }
      }, 100);
    });
  }

  document.querySelectorAll('.card-go').forEach(initGoCard);
})();
