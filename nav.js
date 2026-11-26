// Header behaviour shared by every page: dropdown menus, the phone menu and in-page links.
(function () {
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var header = $(".site-header"), nav = $("#siteNav"), toggle = $(".nav-toggle");
  if (!header || !nav || !toggle) return;
  var groups = $$(".has-menu", nav);
  var canHover = window.matchMedia("(hover: hover) and (min-width: 961px)");

  function closeGroup(li) {
    li.classList.remove("open");
    li.dataset.pinned = "";
    $(".nav-btn", li).setAttribute("aria-expanded", "false");
  }
  function openGroup(li, pinned) {
    groups.forEach(function (g) { if (g !== li) closeGroup(g); });
    li.classList.add("open");
    if (pinned) li.dataset.pinned = "1";
    $(".nav-btn", li).setAttribute("aria-expanded", "true");
  }
  function closeAll() { groups.forEach(closeGroup); }
  function closeMobileNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  groups.forEach(function (li) {
    var btn = $(".nav-btn", li);
    btn.addEventListener("click", function () {
      if (li.classList.contains("open") && li.dataset.pinned) closeGroup(li);
      else openGroup(li, true);
    });
    li.addEventListener("mouseenter", function () { if (canHover.matches) openGroup(li, false); });
    li.addEventListener("mouseleave", function () { if (canHover.matches) closeGroup(li); });
    li.addEventListener("focusout", function (e) {
      if (canHover.matches && !li.contains(e.relatedTarget)) closeGroup(li);
    });
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) { closeAll(); closeMobileNav(); }
  });
  document.addEventListener("click", function (e) { if (!header.contains(e.target)) { closeAll(); closeMobileNav(); } });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = groups.filter(function (g) { return g.classList.contains("open"); })[0];
    if (open) { closeGroup(open); $(".nav-btn", open).focus(); }
  });
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    if (!open) closeAll();
  });
  window.addEventListener("scroll", function () { header.classList.toggle("scrolled", window.scrollY > 8); }, { passive: true });

  // Mark the menu that matches the section in view (pages without grouped sections keep the class set in the HTML)
  var grouped = $$("section[data-group]");
  if (grouped.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var g = en.target.dataset.group;
        groups.forEach(function (li) { li.classList.toggle("current", li.dataset.group === g); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    grouped.forEach(function (s) { spy.observe(s); });
  }

  // In-page links scroll to their section
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView();
    try { history.replaceState(null, "", a.getAttribute("href")); } catch (err) {}
  });
})();
