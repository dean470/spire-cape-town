// Perch Projections page: summary cards, month-by-month chart and table.
(function () {
  var P = window.PERCH;
  if (!P) return;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var rand = function (n) { return "R " + Math.round(n).toLocaleString("en-US").replace(/,/g, " "); };
  var pct = function (n) { return Math.round(n * 100) + "%"; };
  var fullMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var label = function (c) { return c.name + (c.band ? ", " + c.band.toLowerCase() : ""); };
  var byId = {};
  P.cats.forEach(function (c) { byId[c.id] = c; });
  var current = P.cats[0].id;

  // One shared scale for every apartment type, so switching between them compares like with like
  var peak = Math.max.apply(null, P.cats.map(function (c) { return Math.max.apply(null, c.gri); }));
  var STEP = 10000, YMAX = Math.ceil(peak / STEP) * STEP;

  // ---------- Summary cards
  var cards = $("#perchCards");
  cards.innerHTML = P.cats.map(function (c) {
    var t = c.totals;
    return '<article class="pcard" data-card="' + c.id + '">' +
      '<h3 class="pc-name">' + c.name + "<small>" + (c.band || "&nbsp;") + "</small>" + "</h3>" +
      '<p class="pc-val">' + rand(t.nriMonth) + "</p>" +
      '<p class="pc-sub">net a month, on average</p>' +
      "<dl>" +
        "<div><dt>Gross rental income</dt><dd>" + rand(t.gri) + "</dd></div>" +
        "<div><dt>Expenses</dt><dd>" + rand(t.exp) + "</dd></div>" +
        "<div><dt>Net rental income</dt><dd>" + rand(t.nri) + "</dd></div>" +
        "<div><dt>Average occupancy</dt><dd>" + pct(t.occ) + "</dd></div>" +
        "<div><dt>Average nightly rate</dt><dd>" + rand(t.adr) + "</dd></div>" +
      "</dl>" +
      '<button class="arrow-link" type="button" data-cat="' + c.id + '">Month by month</button>' +
    "</article>";
  }).join("");

  // ---------- Apartment type dropdown
  var select = $("#perchType");
  select.innerHTML = P.cats.map(function (c) { return '<option value="' + c.id + '">' + label(c) + "</option>"; }).join("");

  // ---------- Chart: monthly gross income, split into net income and expenses
  var wrap = $("#perchChart"), tip = $("#perchTip"), sub = $("#perchChartSub");
  var NS = "http://www.w3.org/2000/svg", chartSvg = null;
  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function renderChart() {
    var c = byId[current];
    var w = Math.max(300, Math.floor(wrap.clientWidth));
    var narrow = w < 560;
    var h = narrow ? 270 : 340;
    var m = { t: 14, r: narrow ? 6 : 96, b: 30, l: 40 };
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var y = function (v) { return m.t + ih - (v / YMAX) * ih; };
    var band = iw / 12, bw = Math.min(24, Math.max(8, band * 0.58));
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "group",
      "aria-label": "Projected rental income by month for " + label(c) + ". The table below gives every figure." });

    // gridlines and y ticks
    var tickStep = narrow ? STEP * 2 : STEP;
    for (var v = 0; v <= YMAX; v += tickStep) {
      svg.appendChild(el("line", { x1: m.l, x2: m.l + iw, y1: y(v), y2: y(v), stroke: v === 0 ? "#b9b2ad" : "#ebe6e1", "stroke-width": 1 }));
      svg.appendChild(el("text", { x: m.l - 8, y: y(v), "text-anchor": "end", "dominant-baseline": "central", class: "tick" }, v === 0 ? "0" : v / 1000 + "K"));
    }

    c.gri.forEach(function (gross, i) {
      var net = c.nri[i], x = m.l + band * i + (band - bw) / 2;
      var g = el("g", { class: "col", tabindex: 0, role: "img",
        "aria-label": fullMonth[i] + ": net rental income " + rand(net) + ", expenses " + rand(c.expTotal[i]) + ", gross rental income " + rand(gross) +
          ", occupancy " + pct(c.occ[i]) + ", average nightly rate " + rand(c.adr[i]) });
      g.dataset.i = i;
      g.appendChild(el("rect", { class: "hover-band", x: m.l + band * i, y: m.t, width: band, height: ih, fill: "transparent" }));
      // net income: grows from the baseline
      var yNet = y(net);
      g.appendChild(el("rect", { class: "bar-net", x: x, y: yNet, width: bw, height: Math.max(0, y(0) - yNet) }));
      // expenses: stacked above with a 2px surface gap and a rounded top
      var top = y(gross), bottom = yNet - 2, r = Math.min(4, bw / 2, Math.max(0, bottom - top));
      if (bottom - top > 1) {
        g.appendChild(el("path", { class: "bar-exp", d: "M" + x + " " + bottom + "V" + (top + r) + "Q" + x + " " + top + " " + (x + r) + " " + top +
          "H" + (x + bw - r) + "Q" + (x + bw) + " " + top + " " + (x + bw) + " " + (top + r) + "V" + bottom + "Z" }));
      }
      svg.appendChild(g);
      svg.appendChild(el("text", { x: m.l + band * i + band / 2, y: h - 9, "text-anchor": "middle", class: "tick" }, narrow ? P.months[i].charAt(0) : P.months[i]));
    });

    // direct labels beside the last column (the legend carries them on narrow screens)
    if (!narrow) {
      var lx = m.l + iw + 10, last = 11;
      svg.appendChild(el("text", { x: lx, y: (y(c.gri[last]) + y(c.nri[last])) / 2, "dominant-baseline": "central", class: "series" }, "Expenses"));
      svg.appendChild(el("text", { x: lx, y: (y(c.nri[last]) + y(0)) / 2, "dominant-baseline": "central", class: "series" }, "Net income"));
    }
    if (chartSvg) wrap.replaceChild(svg, chartSvg); else wrap.insertBefore(svg, wrap.firstChild);
    chartSvg = svg;
    sub.textContent = label(c) + " · " + P.year + " · rand per month";
  }

  function showTip(g) {
    var c = byId[current], i = +g.dataset.i;
    tip.innerHTML = "<strong>" + fullMonth[i] + "</strong>" +
      '<span><i class="k-net"></i>Net rental income<b>' + rand(c.nri[i]) + "</b></span>" +
      '<span><i class="k-exp"></i>Expenses<b>' + rand(c.expTotal[i]) + "</b></span>" +
      "<span>Gross rental income<b>" + rand(c.gri[i]) + "</b></span>" +
      "<span>Occupancy<b>" + pct(c.occ[i]) + "</b></span>" +
      "<span>Average nightly rate<b>" + rand(c.adr[i]) + "</b></span>";
    tip.hidden = false;
    var box = g.querySelector(".hover-band").getBoundingClientRect(), host = wrap.getBoundingClientRect();
    var top = g.querySelector(".bar-exp, .bar-net").getBoundingClientRect().top - host.top;
    var half = tip.offsetWidth / 2;
    var left = Math.min(Math.max(box.left - host.left + box.width / 2, half), host.width - half);
    tip.style.left = left + "px";
    tip.style.top = Math.max(tip.offsetHeight + 4, top - 8) + "px";
    $$(".col", wrap).forEach(function (o) { o.classList.toggle("on", o === g); });
  }
  function hideTip() {
    tip.hidden = true;
    $$(".col.on", wrap).forEach(function (o) { o.classList.remove("on"); });
  }
  wrap.addEventListener("mouseover", function (e) { var g = e.target.closest(".col"); if (g) showTip(g); });
  wrap.addEventListener("mouseleave", hideTip);
  wrap.addEventListener("focusin", function (e) { var g = e.target.closest(".col"); if (g) showTip(g); });
  wrap.addEventListener("focusout", hideTip);
  wrap.addEventListener("click", function (e) { var g = e.target.closest(".col"); if (g) showTip(g); });

  // ---------- Table: every monthly figure
  var table = $("#perchTable");
  function renderTable() {
    var c = byId[current];
    var row = function (cls, name, vals, total, fmt) {
      return '<tr class="' + cls + '"><th scope="row">' + name + "</th>" + vals.map(function (v) { return "<td>" + fmt(v) + "</td>"; }).join("") +
        '<td class="tot">' + (total == null ? "" : fmt(total)) + "</td></tr>";
    };
    var num = function (v) { return Math.round(v).toLocaleString("en-US").replace(/,/g, " "); };
    var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
    table.innerHTML =
      "<thead><tr><th scope=\"col\">" + label(c) + "</th>" + P.months.map(function (mth) { return '<th scope="col">' + mth + "</th>"; }).join("") + '<th scope="col" class="tot">Year</th></tr></thead>' +
      "<tbody>" +
        row("", "Nights in month", c.days, sum(c.days), String) +
        row("", "Occupancy", c.occ, c.totals.occ, pct) +
        row("", "Average nightly rate (R)", c.adr, c.totals.adr, num) +
        row("strong", "Gross rental income (R)", c.gri, c.totals.gri, num) +
        c.expenses.map(function (e) { return row("minor", e.name, e.vals, sum(e.vals), num); }).join("") +
        row("strong", "Total expenses (R)", c.expTotal, c.totals.exp, num) +
        row("net", "Net rental income (R)", c.nri, c.totals.nri, num) +
      "</tbody>";
  }

  // ---------- Expense basis table (differs between the two-bedroom and the smaller apartments)
  var basis = $("#perchBasis");
  if (basis) {
    var small = P.cats[0], large = P.cats[P.cats.length - 1];
    basis.innerHTML = "<thead><tr><th scope=\"col\">Expense</th><th scope=\"col\">Studio and one bedroom</th><th scope=\"col\">Two bedroom</th></tr></thead><tbody>" +
      small.expenses.map(function (e, i) {
        var other = large.expenses[i] ? large.expenses[i].basis : "";
        return "<tr><th scope=\"row\">" + e.name + "</th>" + (other === e.basis ? '<td colspan="2">' + e.basis + "</td>" : "<td>" + e.basis + "</td><td>" + other + "</td>") + "</tr>";
      }).join("") + "</tbody>";
  }

  // ---------- Selecting an apartment type
  function choose(id, scroll) {
    if (!byId[id]) return;
    current = id;
    select.value = id;
    $$(".pcard", cards).forEach(function (card) { card.classList.toggle("on", card.dataset.card === id); });
    hideTip();
    renderChart();
    renderTable();
    if (scroll) $("#monthly").scrollIntoView();
  }
  select.addEventListener("change", function () { choose(select.value); });
  cards.addEventListener("click", function (e) { var b = e.target.closest("[data-cat]"); if (b) choose(b.dataset.cat, true); });
  if ("ResizeObserver" in window) {
    var lastWidth = 0;
    new ResizeObserver(function () {
      var wNow = Math.floor(wrap.clientWidth);
      if (wNow !== lastWidth) { lastWidth = wNow; renderChart(); }
    }).observe(wrap);
  } else {
    window.addEventListener("resize", renderChart);
  }
  choose(current);
})();
