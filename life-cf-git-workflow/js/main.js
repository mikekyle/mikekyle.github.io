(function () {
  var scroller;
  var activeStep = -1;

  function throttle(fn, wait) {
    var t = 0;
    return function () {
      var now = Date.now();
      if (now - t >= wait) { t = now; fn(); }
    };
  }

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function layoutSteps() {
    var h = window.innerHeight;
    var stepH = isMobile() ? Math.round(h * 0.92) : Math.round(h * 0.75);
    document.querySelectorAll('.step').forEach(function (el) {
      el.style.minHeight = stepH + 'px';
    });
    if (isMobile()) {
      var graphicH = Math.min(360, Math.max(260, Math.round(h * 0.38)));
      document.documentElement.style.setProperty('--graphic-height-mobile', graphicH + 'px');
    }
  }

  function setActiveStep(index) {
    if (index === activeStep) return;
    activeStep = index;
    document.querySelectorAll('.step').forEach(function (el, i) {
      el.classList.toggle('is-active', i === index);
    });
    window.FlowViz.updateFlowViz(index);
  }

  function boot() {
    if (!window.STORY_DATA) {
      document.getElementById('graphic').innerHTML = '<p class="error">Missing story data</p>';
      return;
    }
    window.FlowViz.initFlowViz(window.STORY_DATA);
    layoutSteps();
    scroller = scrollama();
    scroller
      .setup({ step: '.step', offset: isMobile() ? 0.72 : 0.55 })
      .onStepEnter(function (res) { setActiveStep(res.index); });
    var onResize = throttle(function () {
      layoutSteps();
      scroller.resize();
      window.FlowViz.updateFlowViz(activeStep);
    }, 200);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    setActiveStep(0);
    requestAnimationFrame(function () {
      layoutSteps();
      scroller.resize();
      window.FlowViz.updateFlowViz(0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
