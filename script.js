/**
 * tobiasahlin-inspired: staggered card reveal + background fade
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
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            // Staggered reveal: delay by card index within its grid
            var card = entry.target;
            var gridCards = Array.from(
              card.parentElement.querySelectorAll('.card')
            );
            var idx = gridCards.indexOf(card);
            var delay = idx * 80; // 80ms stagger

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
    // Fallback: just show all cards
    cards.forEach(function (card) {
      card.style.opacity = '1';
    });
  }
})();