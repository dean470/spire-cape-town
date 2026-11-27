(function () {
  var units = window.SPIRE_UNITS || [];
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var rand = function (n) { return "R " + Math.round(n).toLocaleString("en-US").replace(/,/g, " "); };
  var ordinal = function (n) {
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  var typeLabel = { "Studio": "Studio", "1 Bed": "One bedroom", "2 Bed": "Two bedroom", "Penthouse": "Penthouse" };
  var typeClass = { "Studio": "t-studio", "1 Bed": "t-1bed", "2 Bed": "t-2bed", "Penthouse": "t-ph" };
  var swatch = function (u) { return '<i class="sw ' + typeClass[u.type] + '"></i>'; };
  var byUnit = {};
  units.forEach(function (u) { byUnit[u.unit] = u; });

  // ---------- Modal
  var modal = $("#modal"), modalBody = $("#modalBody"), lastFocus = null;
  function openModal(html) {
    lastFocus = document.activeElement;
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal-close").focus();
  }
  function closeModal() {
    modal.hidden = true;
    modalBody.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });
  // Buttons anywhere on the page that act on one apartment
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-enquire],[data-layout],[data-show]");
    if (!t) return;
    if (t.dataset.layout) { openUnit(t.dataset.layout); return; }
    if (!modal.hidden) closeModal();
    if (t.dataset.enquire) {
      var ref = $("#enquiryRef");
      ref.textContent = "You were viewing unit " + t.dataset.enquire + ". Please mention it when you call or email.";
      ref.hidden = false;
      $("#enquire").scrollIntoView();
    } else {
      var u = byUnit[t.dataset.show];
      showFloor(u.floor, u.unit);
      $("#plans").scrollIntoView();
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  function openImage(src, alt) { openModal('<img src="' + src + '" alt="' + (alt || "") + '">'); }

  function openUnit(n) {
    var u = byUnit[n];
    if (!u) return;
    openModal(
      '<div class="unit-modal">' +
        '<div class="um-plan"><img src="assets/units/unit-' + u.layout + '.webp" alt="Layout of unit ' + u.unit + '"></div>' +
        '<div class="um-info">' +
          '<p class="um-type">' + typeLabel[u.type] + " · " + ordinal(u.floor) + " floor</p>" +
          '<h3 id="modalTitle">Unit ' + u.unit + "</h3>" +
          "<dl>" +
            '<div class="um-price"><dt>Price incl. VAT</dt><dd>' + rand(u.price) + "</dd></div>" +
            "<div><dt>Internal area</dt><dd>" + u.size + " m²</dd></div>" +
            "<div><dt>" + (u.type === "Penthouse" ? "Terrace" : "Balcony") + "</dt><dd>" + (u.balcony >= 1 ? u.balcony + " m²" : "Juliet") + "</dd></div>" +
            "<div><dt>Est. levy / month</dt><dd>" + rand(u.levy) + "</dd></div>" +
            "<div><dt>Long-term rent today</dt><dd>" + rand(u.rentNow) + " / month</dd></div>" +
            "<div><dt>Long-term rent 2028</dt><dd>" + rand(u.rent2028) + " / month</dd></div>" +
            "<div><dt>UDZ year 1 deduction</dt><dd>" + rand(u.price * 0.55 * 0.2) + "</dd></div>" +
          "</dl>" +
          '<p class="um-tax">The UDZ figure is 20% of 55% of the price, for investors who qualify for the allowance. See Investment.</p>' +
          '<button class="btn" data-enquire="' + u.unit + '">Enquire about ' + u.unit + "</button>" +
          '<button class="row-link um-show" type="button" data-show="' + u.unit + '">Show on floor plan</button>' +
        "</div>" +
      "</div>"
    );
  }

  // ---------- Building explorer: grey tower, the hovered apartment shown in colour
  var EX = window.SPIRE_EXPLORER;
  if (EX && $("#exSvg")) (function () {
    var svg = $("#exSvg"), group = $("#exUnits"), clipPath = $("#exClipPath"), outline = $("#exOutline");
    var panel = $("#exPanel"), floorTag = $("#exFloor"), stage = $("#exStage");
    var pinned = null;
    svg.setAttribute("viewBox", "0 0 " + EX.size[0] + " " + EX.size[1]);
    $$("image", svg).forEach(function (im) { im.setAttribute("width", EX.size[0]); im.setAttribute("height", EX.size[1]); });
    group.innerHTML = units.map(function (u) {
      var d = EX.units[u.unit];
      if (!d) return "";
      return '<path class="ex-u" d="' + d + '" data-unit="' + u.unit + '" tabindex="0" role="button" aria-label="Unit ' + u.unit + ", " +
        typeLabel[u.type] + ", " + ordinal(u.floor) + " floor, " + rand(u.price) + '"></path>';
    }).join("");
    var perch = window.PERCH;
    function perchLine(u) {
      if (!perch) return "";
      var name = { "Studio": "Studio", "1 Bed": "One bedroom", "2 Bed": "Two bedroom" }[u.type];
      var xs = perch.cats.filter(function (c) { return c.name === name; }).map(function (c) { return c.totals.nriMonth; });
      if (!xs.length) return "";
      var lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs);
      return '<p class="ex-perch">Perch projects net short-stay income of ' + (lo === hi ? rand(lo) : rand(lo) + " to " + rand(hi)) +
        ' a month for this apartment type. <a href="perch-projections.html">See Perch Projections</a></p>';
    }
    function show(n) {
      var u = byUnit[n];
      if (!u) return;
      var d = EX.units[n];
      clipPath.setAttribute("d", d);
      outline.setAttribute("d", d);
      stage.classList.add("active");
      $$(".ex-u", group).forEach(function (p) { p.classList.toggle("on", +p.dataset.unit === +n); });
      floorTag.textContent = u.unit === 1701 ? "Floors 17 and 18" : ordinal(u.floor) + " floor";
      var bb = $('.ex-u[data-unit="' + n + '"]', group).getBBox();
      var sx = svg.getBoundingClientRect().width / EX.size[0], sl = svg.getBoundingClientRect().left - stage.getBoundingClientRect().left;
      floorTag.style.left = Math.max(sl + bb.x * sx - 10, floorTag.offsetWidth + 6) + "px";
      floorTag.style.top = (bb.y + bb.height / 2) * sx + "px";
      var outside = u.balcony >= 1 ? u.balcony : 0;
      var tile = function (k, v) { return "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>"; };
      panel.innerHTML =
        '<p class="up-kicker">' + swatch(u) + typeLabel[u.type] + " · " + (u.unit === 1701 ? "17th and 18th floors" : ordinal(u.floor) + " floor") + "</p>" +
        "<h3>Unit " + u.unit + "</h3>" +
        '<p class="up-price">' + rand(u.price) + "</p>" +
        '<dl class="up-stats">' +
          tile("Internal", u.size + " m²") +
          tile(u.type === "Penthouse" ? "Terrace" : "Balcony", outside ? outside + " m²" : "Juliet") +
          tile("Total", (u.size + outside) + " m²") +
          tile("Est. levy / month", rand(u.levy)) +
          tile("Rent today / month", rand(u.rentNow)) +
          tile("Rent 2028 / month", rand(u.rent2028)) +
          tile("Price per m²", rand(u.price / u.size)) +
          tile("UDZ year 1", rand(u.price * 0.55 * 0.2)) +
        "</dl>" + perchLine(u) +
        '<div class="up-actions">' +
          '<button class="btn" type="button" data-layout="' + u.unit + '">View unit layout</button>' +
          '<button class="btn btn-line" type="button" data-show="' + u.unit + '">Show on floor plan</button>' +
          '<button class="row-link" type="button" data-view="' + u.floor + '">View from this floor</button>' +
          '<button class="row-link" type="button" data-enquire="' + u.unit + '">Enquire about this unit</button>' +
        "</div>" +
        (pinned === +n ? '<p class="ex-hint">Selected. Hover over another apartment, or click this one again to release it.</p>' : "");
    }
    function clear() {
      if (pinned) { show(pinned); return; }
      stage.classList.remove("active");
      clipPath.setAttribute("d", ""); outline.setAttribute("d", "");
      $$(".ex-u.on", group).forEach(function (p) { p.classList.remove("on"); });
      floorTag.textContent = "";
    }
    group.addEventListener("mouseover", function (e) { var p = e.target.closest(".ex-u"); if (p) show(p.dataset.unit); });
    group.addEventListener("mouseleave", clear);
    group.addEventListener("focusin", function (e) { var p = e.target.closest(".ex-u"); if (p) show(p.dataset.unit); });
    function toggle(n) {
      n = +n;
      pinned = pinned === n ? null : n;
      show(n);
      // On phones the details sit below the tower, so bring them into view
      if (pinned && window.matchMedia("(max-width: 960px)").matches) panel.scrollIntoView({ block: "nearest" });
    }
    group.addEventListener("click", function (e) { var p = e.target.closest(".ex-u"); if (p) toggle(p.dataset.unit); });
    group.addEventListener("keydown", function (e) {
      var p = e.target.closest(".ex-u");
      if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(p.dataset.unit); }
    });
  })();

  // ---------- Gallery
  $("#inside").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-full]");
    if (b) openImage(b.dataset.full, $("img", b).alt);
  });
  $("#gallery").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-full]");
    if (b) openImage(b.dataset.full, $("img", b).alt);
  });

  // ---------- Apartment types
  var typeInfo = [
    { t: "Studio", name: "Studios", link: "View studios", blurb: "Efficient open-plan apartments on floors 1 to 12." },
    { t: "1 Bed", name: "One bedroom", link: "View one-beds", blurb: "A separate bedroom, on floors 1 to 16." },
    { t: "2 Bed", name: "Two bedroom", link: "View two-beds", blurb: "The largest plans, on floors 13 to 16." },
    { t: "Penthouse", name: "Penthouse", link: "View penthouse", blurb: "A duplex on the top floors, opening onto a private terrace." }
  ];
  function range(a, b, suffix) { return (a === b ? a : a + " – " + b) + suffix; }
  $("#types").innerHTML = typeInfo.map(function (ti) {
    var xs = units.filter(function (u) { return u.type === ti.t; });
    if (!xs.length) return "";
    var sizes = xs.map(function (u) { return u.size; }), prices = xs.map(function (u) { return u.price; });
    return '<a class="type" href="#prices" data-filter="' + ti.t + '">' +
      '<span class="count">' + xs.length + "</span>" +
      "<h3>" + swatch({ type: ti.t }) + ti.name + "</h3><p>" + ti.blurb + "</p>" +
      "<dl><div><dt>Internal size</dt><dd>" + range(Math.min.apply(null, sizes), Math.max.apply(null, sizes), " m²") + "</dd></div>" +
      "<div><dt>" + (xs.length > 1 ? "From" : "Price") + "</dt><dd>" + rand(Math.min.apply(null, prices)) + "</dd></div></dl>" +
      '<span class="arrow-link">' + ti.link + "</span></a>";
  }).join("");

  // ---------- Floor plans: colour-coded apartments that can be selected
  var plans = window.SPIRE_PLANS || { size: [1400, 1469], floors: {} };
  var picker = $("#floorPicker"), planImg = $("#planImage"), planTitle = $("#planTitle");
  var fills = $("#planFills"), labels = $("#planLabels"), panel = $("#unitPanel");
  var floorNote = { 17: "Roof terrace, plunge pool and penthouse", 18: "Penthouse upper level" };
  var current = { floor: 1, unit: null };
  var viewBox = "0 0 " + plans.size[0] + " " + plans.size[1];
  fills.setAttribute("viewBox", viewBox); labels.setAttribute("viewBox", viewBox);
  planImg.width = plans.size[0]; planImg.height = plans.size[1];
  for (var f = 1; f <= 18; f++) {
    var b = document.createElement("button");
    b.textContent = f; b.dataset.floor = f; b.setAttribute("role", "tab");
    b.setAttribute("aria-label", ordinal(f) + " floor");
    picker.appendChild(b);
  }
  function unitsOn(f) { return units.filter(function (u) { return u.floor === (f === 18 ? 17 : f); }); }
  function showFloor(f, unit) {
    f = +f; current.floor = f;
    $$("button", picker).forEach(function (b) { b.setAttribute("aria-selected", +b.dataset.floor === f); });
    planImg.src = "assets/plans/floor-" + (f < 10 ? "0" + f : f) + ".webp";
    planImg.alt = ordinal(f) + " floor plan";
    planTitle.textContent = ordinal(f) + " floor" + (floorNote[f] ? " · " + floorNote[f] : "");
    var shapes = plans.floors[f] || {}, onFloor = unitsOn(f);
    fills.innerHTML = onFloor.map(function (u) {
      if (!shapes[u.unit]) return "";
      return '<path class="u ' + typeClass[u.type] + '" d="' + shapes[u.unit].d + '" fill-rule="evenodd" data-unit="' + u.unit +
        '" tabindex="0" role="button" aria-label="Unit ' + u.unit + ", " + typeLabel[u.type] + ", " + rand(u.price) + '"></path>';
    }).join("");
    var keep = onFloor.filter(function (u) { return u.unit === +unit; })[0];
    selectUnit((keep || onFloor[0]).unit);
  }
  function selectUnit(n) {
    n = +n; current.unit = n;
    $$(".u", fills).forEach(function (p) {
      var on = +p.dataset.unit === n;
      p.classList.toggle("sel", on); p.setAttribute("aria-pressed", on);
    });
    var shape = (plans.floors[current.floor] || {})[n];
    labels.innerHTML = shape ? '<text x="' + shape.c[0] + '" y="' + shape.c[1] + '" text-anchor="middle" dominant-baseline="central">' + n + "</text>" : "";
    renderPanel(byUnit[n]);
  }
  function renderPanel(u) {
    var tile = function (k, v) { return "<div><dt>" + k + "</dt><dd>" + v + "</dd></div>"; };
    var outside = u.balcony >= 1 ? u.balcony : 0;
    panel.innerHTML =
      '<p class="up-kicker">' + swatch(u) + typeLabel[u.type] + " · " + ordinal(u.floor) + " floor</p>" +
      "<h3>Unit " + u.unit + "</h3>" +
      '<p class="up-price">' + rand(u.price) + "</p>" +
      '<dl class="up-stats">' +
        tile("Internal", u.size + " m²") +
        tile(u.type === "Penthouse" ? "Terrace" : "Balcony", outside ? outside + " m²" : "Juliet") +
        tile("Total", (u.size + outside) + " m²") +
        tile("Est. levy / month", rand(u.levy)) +
        tile("Rent today / month", rand(u.rentNow)) +
        tile("Rent 2028 / month", rand(u.rent2028)) +
      "</dl>" +
      '<div class="up-actions">' +
        '<button class="btn" type="button" data-layout="' + u.unit + '">View unit layout</button>' +
        '<button class="btn btn-line" type="button" data-enquire="' + u.unit + '">Enquire about this unit</button>' +
        '<button class="row-link" type="button" data-view="' + current.floor + '">View from this floor</button>' +
      "</div>" +
      '<p class="picker-label">On this floor</p>' +
      '<div class="up-units">' + unitsOn(current.floor).map(function (x) {
        return '<button class="chip" type="button" data-select="' + x.unit + '" aria-pressed="' + (x.unit === u.unit) + '">' + swatch(x) + x.unit + "</button>";
      }).join("") + "</div>";
  }
  picker.addEventListener("click", function (e) { if (e.target.dataset.floor) showFloor(e.target.dataset.floor); });
  fills.addEventListener("click", function (e) { var p = e.target.closest(".u"); if (p) selectUnit(p.dataset.unit); });
  fills.addEventListener("keydown", function (e) {
    var p = e.target.closest(".u");
    if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectUnit(p.dataset.unit); }
  });
  panel.addEventListener("click", function (e) { var c = e.target.closest("[data-select]"); if (c) selectUnit(c.dataset.select); });
  $("#planEnlarge").addEventListener("click", function () { openImage(planImg.src, planImg.alt); });
  showFloor(1);

  // ---------- Price list with dropdown filters
  var tbody = $("#priceTable tbody"), fType = $("#fType"), fFloor = $("#fFloor"), fSort = $("#fSort"), count = $("#resultCount");
  var more = $("#showMore"), expanded = false, PAGE = 10;
  var floors = units.map(function (u) { return u.floor; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  fFloor.innerHTML += floors.map(function (fl) { return '<option value="' + fl + '">' + ordinal(fl) + " floor</option>"; }).join("");

  function renderTable() {
    var sort = fSort.value.split(":"), key = sort[0], dir = +sort[1];
    var rows = units.filter(function (u) {
      return (fType.value === "All" || u.type === fType.value) && (fFloor.value === "All" || u.floor === +fFloor.value);
    });
    rows.sort(function (a, b) { return (a[key] - b[key]) * dir || a.unit - b.unit; });
    count.textContent = "Showing " + rows.length + " of " + units.length + " apartments";
    if (!rows.length) {
      more.hidden = true;
      tbody.innerHTML = '<tr><td class="empty" colspan="8">No apartments match this selection. <button class="row-link" id="resetFilters">Show all apartments</button></td></tr>';
      return;
    }
    var hidden = expanded ? 0 : Math.max(0, rows.length - PAGE);
    more.hidden = rows.length <= PAGE;
    more.textContent = hidden ? "Show all " + rows.length + " apartments" : "Show fewer";
    if (hidden) {
      count.textContent = "Showing " + PAGE + " of " + rows.length + " apartments";
      rows = rows.slice(0, PAGE);
    }
    tbody.innerHTML = rows.map(function (u) {
      return '<tr data-unit="' + u.unit + '">' +
        '<td class="unit">' + u.unit + "</td><td>" + ordinal(u.floor) + "</td><td>" + swatch(u) + typeLabel[u.type] + "</td>" +
        '<td class="num">' + u.size + '</td><td class="num">' + (u.balcony >= 1 ? u.balcony : "Juliet") + "</td>" +
        '<td class="num price">' + rand(u.price) + '</td><td class="num">' + rand(u.levy) + "</td>" +
        '<td class="num">' + rand(u.rentNow) + '</td><td class="num">' + rand(u.rent2028) + "</td>" +
        '<td class="num"><button class="row-link" aria-label="View layout of unit ' + u.unit + '">Layout</button></td></tr>';
    }).join("");
  }
  [fType, fFloor, fSort].forEach(function (s) { s.addEventListener("change", renderTable); });
  more.addEventListener("click", function () {
    expanded = !expanded;
    renderTable();
    if (!expanded) $("#prices").scrollIntoView();
  });
  tbody.addEventListener("click", function (e) {
    if (e.target.id === "resetFilters") { fType.value = "All"; fFloor.value = "All"; renderTable(); return; }
    var tr = e.target.closest("tr[data-unit]");
    if (tr) openUnit(tr.dataset.unit);
  });
  renderTable();

  // Links that jump to the price list with a type already selected
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-filter]");
    if (!a) return;
    fType.value = a.dataset.filter; fFloor.value = "All";
    renderTable();
  });

  // ---------- Long-term rental estimates by category
  var rentBody = $("#rentTable tbody");
  if (rentBody && window.SPIRE_RENT) rentBody.innerHTML = window.SPIRE_RENT.rows.map(function (r) {
    return "<tr><td>" + r.label + '</td><td class="num">' + r.units + '</td><td class="num">' + r.size +
      '</td><td class="num">' + rand(r.now) + '</td><td class="num price">' + rand(r.r2028) + "</td></tr>";
  }).join("");

  // ---------- Figures derived from the price list
  if (units.length) {
    var min = Math.min.apply(null, units.map(function (u) { return u.price; }));
    $("#fromPrice").textContent = "from R" + (min / 1e6).toFixed(2).replace(/0$/, "").replace(".", ",") + " million";
    $("#exPrice").textContent = rand(min);
    $("#exCost").textContent = rand(min * 0.55);
    $("#exY1").textContent = rand(min * 0.55 * 0.2);
    $("#exY2").textContent = rand(min * 0.55 * 0.08) + " a year";
  }

  // ---------- Perch teaser figures, taken from the projection data
  var perch = window.PERCH;
  if (perch) {
    [["#pfStudio", "Studio"], ["#pf1bed", "One bedroom"], ["#pf2bed", "Two bedroom"]].forEach(function (pair) {
      var node = $(pair[0]);
      var xs = perch.cats.filter(function (c) { return c.name === pair[1]; }).map(function (c) { return c.totals.nriMonth; });
      if (node && xs.length) node.textContent = (xs.length > 1 ? "from " : "") + rand(Math.min.apply(null, xs));
    });
  }

  // ---------- Copy buttons for the phone number and email address
  $$(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 2000);
      };
      var selectText = function () {
        var range = document.createRange();
        range.selectNodeContents(btn.previousElementSibling);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      };
      try {
        navigator.clipboard.writeText(btn.dataset.copy).then(done, selectText);
      } catch (err) { selectText(); }
    });
  });

})();
