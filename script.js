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

     Stone format: { x, y, color }
       x, y  — 0-indexed intersections (0,0 = top-left)
       color — 'B' (black) or 'W' (white)

     Order of the stones array = play order (animated one-by-one).
     ============================================================ */

  /**
   * Draft patterns — swap / tweak freely.
   * Coordinates are on a `size`×`size` board (no grid lines drawn).
   */
  var GO_PATTERNS = {
    /**
     * Classic 4-4 high-approach keima joseki (top-left corner).
     * Recognisable opening sequence for any club player.
     */
    'keima-joseki': {
      size: 9,
      stoneDelay: 320,
      stoneDuration: 280,
      opacity: 0.88,
      stones: [
        { x: 3, y: 3, color: 'B' }, // 4-4 star
        { x: 5, y: 3, color: 'W' }, // high approach
        { x: 2, y: 5, color: 'B' }, // keima
        { x: 5, y: 5, color: 'W' }, // two-space jump
        { x: 3, y: 5, color: 'B' }, // solidify
        { x: 6, y: 2, color: 'W' }, // knight toward side
        { x: 5, y: 1, color: 'B' }, // press
        { x: 7, y: 3, color: 'W' }, // extend
      ],
    },

    /**
     * Classic L+1 / "bent four in the corner" setup flavour —
     * a short life-and-death shape every tsumego student knows.
     * Draft only; swap for a real problem later.
     */
    'tsume-lgroup': {
      size: 9,
      stoneDelay: 300,
      stoneDuration: 260,
      opacity: 0.88,
      stones: [
        { x: 1, y: 1, color: 'B' },
        { x: 2, y: 1, color: 'B' },
        { x: 3, y: 1, color: 'B' },
        { x: 1, y: 2, color: 'B' },
        { x: 1, y: 3, color: 'B' },
        { x: 2, y: 3, color: 'W' },
        { x: 3, y: 2, color: 'W' },
        { x: 3, y: 3, color: 'W' },
        { x: 4, y: 1, color: 'W' },
        { x: 2, y: 2, color: 'W' }, // eye-space fill — order readable as a problem unfold
      ],
    },
  };

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Ease-out cubic for stone pop-in.
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Create and run a Go animation on one card's canvas.
   * @param {HTMLElement} card
   */
  function initGoCard(card) {
    var canvas = card.querySelector('.card-canvas');
    var patternName = card.getAttribute('data-go-pattern');
    var pattern = GO_PATTERNS[patternName];

    if (!canvas || !pattern || !pattern.stones || !pattern.stones.length) {
      return;
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var size = pattern.size || 9;
    var stoneDelay = pattern.stoneDelay != null ? pattern.stoneDelay : 300;
    var stoneDuration = pattern.stoneDuration != null ? pattern.stoneDuration : 260;
    var opacity = pattern.opacity != null ? pattern.opacity : 0.85;
    var stones = pattern.stones;

    // Per-stone animation progress 0→1; -1 = not started
    var progress = stones.map(function () { return -1; });
    var started = false;
    var startTime = 0;
    var rafId = null;
    var dpr = 1;
    var cssW = 0;
    var cssH = 0;

    function resize() {
      var rect = card.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /**
     * Map board intersection → canvas pixel centre.
     * Board is centred in the card with padding so stones
     * sit as a decorative field behind the copy.
     */
    function intersectionToXY(x, y) {
      var pad = Math.min(cssW, cssH) * 0.12;
      var boardSpan = Math.min(cssW, cssH) - pad * 2;
      // Prefer slightly upper placement so text (centred) reads cleanly
      var offsetX = (cssW - boardSpan) / 2;
      var offsetY = (cssH - boardSpan) / 2 - cssH * 0.04;
      var cell = boardSpan / (size - 1);
      return {
        cx: offsetX + x * cell,
        cy: offsetY + y * cell,
        radius: cell * 0.42,
      };
    }

    /**
     * Stones near the card centre (where the title sits) fade down
     * so copy stays readable; edge stones stay fuller.
     */
    function alphaAt(cx, cy) {
      var dx = (cx - cssW / 2) / (cssW * 0.55);
      var dy = (cy - cssH / 2) / (cssH * 0.55);
      var d = Math.sqrt(dx * dx + dy * dy);
      var edge = Math.max(0, Math.min(1, d));
      return opacity * (0.28 + 0.72 * edge);
    }

    function drawStone(cx, cy, radius, color, scale) {
      if (scale <= 0) return;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alphaAt(cx, cy);

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);

      if (color === 'W') {
        ctx.fillStyle = '#f2f2f2';
        ctx.fill();
        // Hairline rim so white stones read on pale greens
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = Math.max(1, radius * 0.06);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#111111';
        ctx.fill();
      }

      ctx.restore();
    }

    function drawFrame(now) {
      ctx.clearRect(0, 0, cssW, cssH);

      if (!started) {
        // Reduced motion: show final position immediately
        if (prefersReducedMotion) {
          stones.forEach(function (s) {
            var p = intersectionToXY(s.x, s.y);
            drawStone(p.cx, p.cy, p.radius, s.color, 1);
          });
          return;
        }
        return;
      }

      var elapsed = now - startTime;

      for (var i = 0; i < stones.length; i++) {
        var appearAt = i * stoneDelay;
        var t = (elapsed - appearAt) / stoneDuration;

        if (t < 0) {
          progress[i] = -1;
          continue;
        }
        progress[i] = Math.min(1, t);

        var s = stones[i];
        var pos = intersectionToXY(s.x, s.y);
        var scale = easeOutCubic(progress[i]);
        drawStone(pos.cx, pos.cy, pos.radius, s.color, scale);
      }

      var totalMs = (stones.length - 1) * stoneDelay + stoneDuration;
      if (elapsed < totalMs) {
        rafId = requestAnimationFrame(drawFrame);
      } else {
        // Final settled frame
        ctx.clearRect(0, 0, cssW, cssH);
        stones.forEach(function (s) {
          var p = intersectionToXY(s.x, s.y);
          drawStone(p.cx, p.cy, p.radius, s.color, 1);
        });
        rafId = null;
      }
    }

    function start() {
      if (started) return;
      started = true;
      startTime = performance.now();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(drawFrame);
    }

    resize();

    if (prefersReducedMotion) {
      drawFrame(performance.now());
    }

    // Start when the card scrolls into view (after reveal stagger)
    if ('IntersectionObserver' in window) {
      var goObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              // Wait for cardReveal stagger (~same as card index * 80 + a beat)
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
        // Redraw settled or in-progress state
        if (prefersReducedMotion || (started && rafId === null)) {
          ctx.clearRect(0, 0, cssW, cssH);
          stones.forEach(function (s) {
            var p = intersectionToXY(s.x, s.y);
            drawStone(p.cx, p.cy, p.radius, s.color, 1);
          });
        } else if (started) {
          // Restart frame loop from current clock so mid-animation resizes cleanly
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(drawFrame);
        }
      }, 100);
    });
  }

  document.querySelectorAll('.card-go').forEach(initGoCard);
})();
