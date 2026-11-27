// Page motion, after the Signatura Spire landing page:
// 1. the hero headline slides in from the left, then drifts down and eases out as the page scrolls;
// 2. photos wipe open from the top or bottom as they come into view;
// 3. section headings and copy fade up from below.
// Nothing moves for visitors who ask for reduced motion, and everything stays visible without JavaScript.
(function () {
  // The fixed SPIRE tab tucks away after the hero on narrower desktops, where it would cover content
  var tallHero = document.querySelector(".hero-tall");
  if (tallHero) {
    var past = function () { document.body.classList.toggle("past-hero", window.scrollY > tallHero.offsetHeight - 120); };
    window.addEventListener("scroll", past, { passive: true }); past();
  }
  if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  root.classList.add("motion");

  // 1. Hero: the headline drifts down the tall render as the page scrolls, easing behind the
  // scroll like the landing page's GSAP "scrub: 1", and stops short of the street.
  var hero = document.querySelector(".hero"), head = document.getElementById("heroHead");
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add("hero-in"); }); });
  if (head) {
    var overlay = window.matchMedia("(min-width: 761px)"), cur = 0, running = false;
    function target() {
      if (!overlay.matches) return 0;
      var room = hero.offsetHeight - head.offsetTop - head.offsetHeight - 40;
      // Measured off the landing-page recording: the headline travels about 0.78 px for every
      // pixel scrolled, so the price line is still on screen when the street comes into view.
      return Math.max(0, Math.min(room, window.scrollY * 0.78));
    }
    function step() {
      var t = target();
      cur += (t - cur) * 0.08;
      if (Math.abs(t - cur) < 0.3) cur = t;
      head.style.transform = "translate3d(0," + cur.toFixed(1) + "px,0)";
      if (cur !== t) requestAnimationFrame(step); else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(step); } }
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
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
