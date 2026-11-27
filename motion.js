// Page motion, after the Signatura Spire landing page:
// 1. the hero headline slides in from the left, then drifts down and eases out as the page scrolls;
// 2. photos wipe open from the top or bottom as they come into view;
// 3. section headings and copy fade up from below.
// Nothing moves for visitors who ask for reduced motion, and everything stays visible without JavaScript.
(function () {
  if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  root.classList.add("motion");

  // 1. Hero
  var hero = document.querySelector(".hero"), copy = hero && hero.querySelector(".hero-copy");
  var media = hero && hero.querySelector(".hero-media img");
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add("hero-in"); }); });
  if (copy) {
    var ticking = false, wide = window.matchMedia("(min-width: 961px)");
    function drift() {
      ticking = false;
      var h = hero.offsetHeight, p = Math.min(1, Math.max(0, window.scrollY / h));
      if (!wide.matches) p = 0;              // stacked phone layout: no drift
      copy.style.transform = "translate3d(0," + (p * h * 0.32).toFixed(1) + "px,0)";
      copy.style.opacity = (1 - p * 0.9).toFixed(3);
      if (media) media.style.transform = "translate3d(0," + (p * h * 0.12).toFixed(1) + "px,0) scale(1.06)";
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  // 2 and 3. Reveals
  var wipes = document.querySelectorAll(".feature figure, .gallery figure, figure.framed");
  var fades = document.querySelectorAll(
    "main .section .label, main .section h2, main .section .intro, .feature-text, .reasons > li, .types > *, .tax-card, .facts > *, #overview .features li, .explorer, .view-frame, .plan-layout");
  Array.prototype.forEach.call(wipes, function (el, i) { el.classList.add("rv-wipe", i % 2 ? "rv-up" : "rv-down"); });
  Array.prototype.forEach.call(fades, function (el) { el.classList.add("rv-fade"); });
  // Stagger siblings that arrive together
  var groups = new Map();
  Array.prototype.forEach.call(fades, function (el) {
    var k = el.parentNode, n = groups.get(k) || 0;
    el.style.transitionDelay = Math.min(n, 5) * 90 + "ms"; groups.set(k, n + 1);
  });
  var pending = Array.prototype.slice.call(wipes).concat(Array.prototype.slice.call(fades));
  function reveal(el) {
    el.classList.add("in");
    // Once it has arrived, hand the element back to its own styles (hover effects and so on)
    setTimeout(function () { el.classList.remove("rv-fade", "rv-wipe", "rv-up", "rv-down", "in"); el.style.transitionDelay = ""; }, 2200);
  }
  // Reveal anything whose top has come up past 92% of the screen, including anything
  // skipped over by a fast scroll or a menu jump, so nothing can stay hidden.
  var queued = false;
  function check() {
    queued = false;
    var line = window.innerHeight * 0.92;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < line) { reveal(el); return false; }
      return true;
    });
    if (!pending.length) { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); }
  }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(check); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  check();
})();
