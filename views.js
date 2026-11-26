// Floor views: the 360° drone panorama taken at the height of each floor (Panoee tour "Spire").
// Scene slugs come from the tour; floor N in the tour is Spire's floor N.
(function () {
  var TOUR = "https://tour.panoee.net/6a392069630a1a65eb77bd73/";
  var SCENES = {
    1: ["1floor_5_3meters_03-fixed-1", 5.3], 2: ["2floor_8meters_03-1", 8], 3: ["3floor_10_8meters_03-1", 10.8],
    4: ["4floor_13_5meters_03", 13.5], 5: ["5floor_16_3meters_03", 16.3], 6: ["6floor_19meters_03", 19],
    7: ["7floor_21_8meters_03", 21.8], 8: ["8floor_24_5meters_03", 24.5], 9: ["9floor_27_3meters_03", 27.3],
    10: ["10floor_30meters_04", 30], 11: ["11floor_32_8meters_04", 32.8], 12: ["12floor_35_5meters_04", 35.5],
    13: ["13floor_38_3meters_04", 38.3], 14: ["14floor_41meters_04", 41], 15: ["15floor_43_8meters_04", 43.8],
    16: ["16floor_46_5meters_04", 46.5], 17: ["17floor_49_3meters_04", 49.3], 18: ["18floor_526meters_02", 52.6]
  };
  var NOTE = { 17: "Roof terrace and penthouse", 18: "Penthouse upper level" };
  var picker = document.getElementById("viewPicker");
  if (!picker) return;
  var frame = document.getElementById("viewFrame"), iframe = frame.querySelector("iframe");
  var title = document.getElementById("viewTitle"), open = document.getElementById("viewOpen");
  var current = 1, live = false;

  function ordinal(n) {
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  for (var f = 1; f <= 18; f++) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = f; b.dataset.vfloor = f; b.setAttribute("role", "tab");
    b.setAttribute("aria-label", "View from the " + ordinal(f) + " floor");
    picker.appendChild(b);
  }
  function show(f) {
    f = Math.min(18, Math.max(1, +f || 1)); current = f;
    Array.prototype.forEach.call(picker.children, function (b) { b.setAttribute("aria-selected", +b.dataset.vfloor === f); });
    title.textContent = ordinal(f) + " floor · about " + String(SCENES[f][1]).replace(".", ",") + " m above the street" + (NOTE[f] ? " · " + NOTE[f] : "");
    open.href = TOUR + SCENES[f][0];
    if (live) iframe.src = TOUR + SCENES[f][0];
  }
  function start() {
    if (live) return;
    live = true; frame.classList.add("live");
    iframe.src = TOUR + SCENES[current][0];
  }
  picker.addEventListener("click", function (e) { if (e.target.dataset.vfloor) { show(e.target.dataset.vfloor); start(); } });
  frame.querySelector(".view-start").addEventListener("click", start);
  // Load the tour once the section is close to the screen, so the rest of the page stays quick.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es, ob) {
      if (es.some(function (x) { return x.isIntersecting; })) { start(); ob.disconnect(); }
    }, { rootMargin: "300px 0px" }).observe(frame);
  }
  // "View from this floor" buttons anywhere on the page
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-view]");
    if (!t) return;
    var f = t.dataset.view === "plan" ? (document.querySelector('#floorPicker [aria-selected="true"]') || {}).dataset : null;
    show(f ? f.floor : t.dataset.view); start();
    var m = document.getElementById("modal");
    if (m && !m.hidden) { var c = m.querySelector(".modal-close"); if (c) c.click(); }
    document.getElementById("views").scrollIntoView();
  });
  show(1);
})();
