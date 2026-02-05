/* =========================================================

   1. UTILS & SETUP

========================================================= */

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",

  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const NOW = new Date();

let currentMonth = NOW.getMonth();

const yearInput = document.getElementById("year");

yearInput.value = NOW.getFullYear();

const debounce = (func, wait) => {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const getDays = (y, m) => new Date(y, m + 1, 0).getDate();

const storageKey = (y, m) => `habits-${y}-${m}`;

yearInput.addEventListener("wheel", (e) => e.preventDefault());

let habits = [];

let isEditMode = false;

/* =========================================================

   2. DATA PERSISTENCE

========================================================= */

const loadHabits = () => {
  const y = parseInt(yearInput.value) || NOW.getFullYear();

  const key = storageKey(y, currentMonth);

  const stored = localStorage.getItem(key);

  if (stored) {
    habits = JSON.parse(stored);
  } else {
    habits = [];

    let checkY = y;

    let checkM = currentMonth;

    for (let i = 0; i < 12; i++) {
      checkM--;

      if (checkM < 0) {
        checkM = 11;
        checkY--;
      }

      const prevKey = storageKey(checkY, checkM);

      const prevData = localStorage.getItem(prevKey);

      if (prevData) {
        const parsedPrev = JSON.parse(prevData);

        habits = parsedPrev.map((h) => ({
          name: h.name,
          type: h.type || "positive",

          weight: h.weight || 2,
          goal: h.goal || 28,
          days: [],
        }));

        break;
      }
    }
  }
};

const save = () => {
  const y = parseInt(yearInput.value) || NOW.getFullYear();

  localStorage.setItem(storageKey(y, currentMonth), JSON.stringify(habits));
};

const debouncedSave = debounce(() => save(), 500);

/* =========================================================

   3. DROPDOWNS

========================================================= */

function makeDropdown(el, options, selectedIndex, onChange, fixedSide = null) {
  el.innerHTML = "";
  el.style.position = "relative";

  const btn = document.createElement("div");

  btn.className = "dropdown-button";
  btn.tabIndex = 0;

  btn.innerHTML = options[selectedIndex]?.label || "Select";

  const menu = document.createElement("div");

  menu.className = "dropdown-menu";
  menu.style.display = "none";

  options.forEach((opt) => {
    const item = document.createElement("div");

    item.className = "dropdown-item";
    item.innerHTML = opt.label;

    item.onclick = (e) => {
      e.stopPropagation();
      btn.innerHTML = opt.label;

      menu.style.display = "none";
      onChange(opt.value);
    };

    menu.appendChild(item);
  });

  const toggleMenu = (e) => {
    e.stopPropagation();

    document.querySelectorAll(".dropdown-menu").forEach((m) => {
      if (m !== menu) m.style.display = "none";
    });

    const isClosed = menu.style.display === "none";

    if (isClosed) {
      menu.style.display = "block";

      let openUp = false;

      if (fixedSide === "up") openUp = true;
      else if (fixedSide === "down") openUp = false;
      else {
        const rect = btn.getBoundingClientRect();

        const spaceBelow = window.innerHeight - rect.bottom;

        if (spaceBelow < 200) openUp = true;
      }

      if (openUp) {
        menu.style.top = "auto";
        menu.style.bottom = "calc(100% + 8px)";

        menu.style.transformOrigin = "bottom left";
      } else {
        menu.style.top = "calc(100% + 8px)";
        menu.style.bottom = "auto";

        menu.style.transformOrigin = "top left";
      }
    } else {
      menu.style.display = "none";
    }
  };

  btn.onclick = toggleMenu;

  btn.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleMenu(e);
    }
  };

  el.appendChild(btn);
  el.appendChild(menu);
}

/* =========================================================

   4. RENDERING

========================================================= */

function renderHeader() {
  const dayHeader = document.getElementById("dayHeader");

  const y = parseInt(yearInput.value) || NOW.getFullYear();

  const days = getDays(y, currentMonth);

  const today = NOW.getDate();

  const isThisMonth =
    currentMonth === NOW.getMonth() && y === NOW.getFullYear();

  dayHeader.innerHTML = "";

  const nameTh = document.createElement("th");

  const wrapper = document.createElement("div");

  wrapper.className = "sticky-header-content";

  const settingsBtn = document.createElement("button");

  settingsBtn.className = "toggle-edit-btn";

  settingsBtn.style.width = "auto";
  settingsBtn.style.padding = "0 8px";

  settingsBtn.innerHTML = isEditMode
    ? `<i data-lucide="check" style="width:16px;"></i>`
    : `<i data-lucide="settings-2" style="width:16px;"></i>`;

  settingsBtn.onclick = (e) => {
    e.stopPropagation();
    isEditMode = !isEditMode;
    update();
  };

  const labelSpan = document.createElement("span");
  labelSpan.textContent = "Habit";

  wrapper.appendChild(settingsBtn);
  wrapper.appendChild(labelSpan);

  nameTh.appendChild(wrapper);
  dayHeader.appendChild(nameTh);

  if (isEditMode) {
    ["Type", "Imp", "Goal"].forEach((t) => {
      const th = document.createElement("th");
      th.textContent = t;
      dayHeader.appendChild(th);
    });
  }

  for (let d = 1; d <= days; d++) {
    const th = document.createElement("th");
    th.textContent = d;

    if (isThisMonth && d === today) th.classList.add("today-col");

    dayHeader.appendChild(th);
  }

  const endTh = document.createElement("th");

  endTh.textContent = isEditMode ? "Actions" : "";

  endTh.style.minWidth = isEditMode ? "90px" : "auto";

  dayHeader.appendChild(endTh);
}

function renderHabits() {
  const habitBody = document.getElementById("habitBody");
  habitBody.innerHTML = "";

  const y = parseInt(yearInput.value) || NOW.getFullYear();

  const days = getDays(y, currentMonth);

  const today = NOW.getDate();

  const isThisMonth =
    currentMonth === NOW.getMonth() && y === NOW.getFullYear();

  habits.forEach((h, i) => {
    if (!h.days || h.days.length !== days) {
      const newDays = Array(days).fill(false);

      if (h.days)
        h.days.forEach((val, idx) => {
          if (idx < days) newDays[idx] = val;
        });

      h.days = newDays;
    }

    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");

    nameTd.contentEditable = isEditMode;
    nameTd.textContent = h.name;

    nameTd.style.cursor = isEditMode ? "text" : "default";

    nameTd.oninput = () => {
      h.name = nameTd.textContent;
      debouncedSave();
    };

    tr.appendChild(nameTd);

    // LAST 2 ROWS OPEN UP

    const isBottomRow = i >= habits.length - 2;

    const dropDir = isBottomRow ? "up" : "down";

    if (isEditMode) {
      const typeTd = document.createElement("td");
      const tDD = document.createElement("div");
      tDD.className = "dropdown";

      makeDropdown(
        tDD,
        [
          { label: "Positive", value: "positive" },
          { label: "Negative", value: "negative" },
        ],
        h.type === "negative" ? 1 : 0,
        (v) => {
          h.type = v;
          save();
          update();
        },
        dropDir,
      );

      const typeBtn = tDD.querySelector(".dropdown-button");

      if (h.type === "positive") typeBtn.classList.add("badge-pos");
      else typeBtn.classList.add("badge-neg");

      typeTd.appendChild(tDD);
      tr.appendChild(typeTd);

      const impTd = document.createElement("td");
      const iDD = document.createElement("div");
      iDD.className = "dropdown";

      makeDropdown(
        iDD,
        [
          { label: "Low", value: 1 },
          { label: "Medium", value: 2 },
          { label: "High", value: 3 },
        ],
        (h.weight || 2) - 1,
        (v) => {
          h.weight = v;
          save();
          update();
        },
        dropDir,
      );

      const impBtn = iDD.querySelector(".dropdown-button");

      const w = h.weight || 2;

      if (w === 1) impBtn.classList.add("badge-imp-low");
      if (w === 2) impBtn.classList.add("badge-imp-med");
      if (w === 3) impBtn.classList.add("badge-imp-high");

      impTd.appendChild(iDD);
      tr.appendChild(impTd);

      const goalTd = document.createElement("td");
      const gIn = document.createElement("input");

      gIn.type = "number";
      gIn.className = "goal-input";
      gIn.value = h.goal || 28;

      gIn.addEventListener("wheel", (e) => e.preventDefault());

      gIn.oninput = (e) => {
        h.goal = +e.target.value;
        debouncedSave();
        updateStats();
        if (!isEditMode) updateProgress(tr, h);
      };

      goalTd.appendChild(gIn);
      tr.appendChild(goalTd);
    }

    for (let d = 0; d < days; d++) {
      const td = document.createElement("td");

      const isToday = isThisMonth && d + 1 === today;

      if (isToday) td.classList.add("today-col");

      const cb = document.createElement("input");

      cb.type = "checkbox";
      cb.checked = h.days[d];

      if (h.type === "negative") cb.classList.add("neg-habit");

      const isFuture =
        y > NOW.getFullYear() ||
        (y === NOW.getFullYear() && currentMonth > NOW.getMonth()) ||
        (isThisMonth && d > NOW.getDate() - 1);

      if (isFuture) {
        cb.classList.add("future-day");
        cb.disabled = true;
      }

      cb.onchange = () => {
        h.days[d] = cb.checked;
        save();
        updateStats();
        if (!isEditMode) updateProgress(tr, h);
        renderGraph();
      };

      td.appendChild(cb);
      tr.appendChild(td);
    }

    const endTd = document.createElement("td");

    if (isEditMode) {
      const actionWrap = document.createElement("div");

      actionWrap.style.display = "flex";
      actionWrap.style.gap = "4px";
      actionWrap.style.justifyContent = "center";

      const btnUp = document.createElement("button");
      btnUp.className = "toggle-edit-btn";

      btnUp.innerHTML = `<i data-lucide="arrow-up" style="width:14px;"></i>`;
      btnUp.disabled = i === 0;

      btnUp.onclick = (e) => {
        e.stopPropagation();
        [habits[i], habits[i - 1]] = [habits[i - 1], habits[i]];
        save();
        update();
      };

      const btnDown = document.createElement("button");
      btnDown.className = "toggle-edit-btn";

      btnDown.innerHTML = `<i data-lucide="arrow-down" style="width:14px;"></i>`;
      btnDown.disabled = i === habits.length - 1;

      btnDown.onclick = (e) => {
        e.stopPropagation();
        [habits[i], habits[i + 1]] = [habits[i + 1], habits[i]];
        save();
        update();
      };

      const btnDel = document.createElement("button");
      btnDel.className = "toggle-edit-btn";

      btnDel.innerHTML = `<i data-lucide="trash-2" style="width:14px;"></i>`;
      btnDel.style.color = "#ef4444";
      btnDel.style.marginLeft = "8px";

      btnDel.onclick = () => {
        if (confirm("Delete?")) {
          habits.splice(i, 1);
          save();
          update();
        }
      };

      actionWrap.appendChild(btnUp);
      actionWrap.appendChild(btnDown);
      actionWrap.appendChild(btnDel);

      endTd.appendChild(actionWrap);
    } else {
      endTd.innerHTML = `<div class="progress-bar"><div class="progress-fill"></div></div>`;

      setTimeout(() => updateProgress(tr, h), 0);
    }

    tr.appendChild(endTd);
    habitBody.appendChild(tr);
  });
}

function updateProgress(tr, h) {
  const done = h.days.filter(Boolean).length;

  let pct = 0;

  if (h.type === "positive") {
    const target = h.goal || h.days.length;
    pct = (done / target) * 100;
  } else {
    pct = ((h.days.length - done) / h.days.length) * 100;
  }

  if (pct > 100) pct = 100;

  const fill = tr.querySelector(".progress-fill");
  if (fill) fill.style.width = pct + "%";
}

/* =========================================================

   5. STATS, RINGS & GRAPH

========================================================= */

function setRing(id, pct) {
  const path = document.getElementById(id.replace("ring-", "path-"));

  const text = document.getElementById(id.replace("ring-", "") + "Pct");

  const r = path.getAttribute("r");

  const circ = 2 * Math.PI * r;

  path.style.strokeDasharray = `${circ} ${circ}`;

  path.style.strokeDashoffset = circ - (pct / 100) * circ;

  text.textContent = Math.round(pct) + "%";
}

function updateStats() {
  const y = parseInt(yearInput.value) || NOW.getFullYear();

  const isThisMonth =
    currentMonth === NOW.getMonth() && y === NOW.getFullYear();

  const todayIdx = isThisMonth
    ? NOW.getDate() - 1
    : habits[0]?.days.length - 1 || 0;

  let earnedMonth = 0,
    totalPossibleMonth = 0,
    earnedSoFar = 0,
    totalPossibleSoFar = 0;

  let todayDone = 0,
    todayTotal = 0,
    todaySlips = 0,
    negTotal = 0,
    momentumSum = 0;

  habits.forEach((h) => {
    const w = Number(h.weight) || 2;

    const checkedDays = h.days.filter(Boolean).length;

    let ratioMonth = 0;

    if (h.type === "positive") {
      const target = h.goal || h.days.length;
      ratioMonth = checkedDays / target;
      if (ratioMonth > 1) ratioMonth = 1;
    } else {
      ratioMonth = (h.days.length - checkedDays) / h.days.length;
    }

    earnedMonth += ratioMonth * w;
    totalPossibleMonth += w;

    let daysPassed = todayIdx + 1;

    let ratioSoFar = 0;

    if (h.type === "positive") {
      const checksSoFar = h.days.slice(0, daysPassed).filter(Boolean).length;
      ratioSoFar = checksSoFar / daysPassed;
    } else {
      const slipsSoFar = h.days.slice(0, daysPassed).filter(Boolean).length;
      ratioSoFar = (daysPassed - slipsSoFar) / daysPassed;
    }

    if (ratioSoFar < 0) ratioSoFar = 0;

    earnedSoFar += ratioSoFar * w;
    totalPossibleSoFar += w;

    if (h.type === "positive") {
      todayTotal++;
      if (h.days[todayIdx]) todayDone++;
    } else {
      negTotal++;
      if (h.days[todayIdx]) todaySlips++;
    }

    let hMom = 0,
      wSum = 0;

    const weights = [0.1, 0.2, 0.3, 0.4];

    weights.forEach((weight, i) => {
      const idx = todayIdx - (3 - i);

      if (idx >= 0 && idx < h.days.length) {
        const isSuccess = h.type === "positive" ? h.days[idx] : !h.days[idx];

        hMom += (isSuccess ? 1 : 0) * weight;
        wSum += weight;
      }
    });

    const normalizedMom = wSum > 0 ? hMom / wSum : 0;

    momentumSum += normalizedMom * w;
  });

  const monthPct = totalPossibleMonth
    ? (earnedMonth / totalPossibleMonth) * 100
    : 0;

  const efficiencyPct = totalPossibleSoFar
    ? (earnedSoFar / totalPossibleSoFar) * 100
    : 0;

  const todayPerformance =
    ((todayDone + (negTotal - todaySlips)) / (todayTotal + negTotal || 1)) *
    100;

  const momPct = totalPossibleMonth
    ? (momentumSum / totalPossibleMonth) * 100
    : 0;

  const successEl = document.getElementById("successRate");
  if (successEl) successEl.textContent = Math.round(monthPct) + "%";

  const footerCounter = document.querySelector(".counter");

  if (footerCounter) {
    const slipText =
      negTotal > 0
        ? `<span style="opacity:0.3; margin:0 6px">|</span> <span style="color:#ef4444">${todaySlips}/${negTotal}</span> slips`
        : ``;

    footerCounter.innerHTML = `Today: <span style="color:var(--green)">${todayDone}/${todayTotal}</span> done ${slipText}`;
  }

  setRing("ring-efficiency", efficiencyPct);
  setRing("ring-normalized", todayPerformance);
  setRing("ring-momentum", momPct);

  document.getElementById("todaySummary").innerHTML = todayScoreText();

  // --- STREAK & HEATMAP ---

  let currentStreak = 0;

  for (let d = todayIdx; d >= 0; d--) {
    let dayScore = 0;

    habits.forEach((h) => {
      if (h.days[d]) dayScore += h.type === "positive" ? 1 : -1;
    });

    if (dayScore > 0) currentStreak++;
    else {
      if (d === todayIdx && dayScore === 0) continue;
      break;
    }
  }

  const streakEl = document.getElementById("streakValue");
  if (streakEl) streakEl.innerText = currentStreak;

  const heatGrid = document.getElementById("streakHeatmap");

  if (heatGrid) {
    heatGrid.innerHTML = "";

    const daysToShow = 14;

    for (let i = 0; i < daysToShow; i++) {
      const dayIndex = todayIdx - (daysToShow - 1) + i;

      const div = document.createElement("div");
      div.className = "heat-box";

      if (dayIndex >= 0 && dayIndex < habits[0]?.days.length) {
        let dScore = 0,
          maxPossible = 0;

        habits.forEach((h) => {
          maxPossible++;
          if (h.days[dayIndex]) dScore += h.type === "positive" ? 1 : -1;
        });

        if (dScore > 0) {
          const intensity = dScore / (maxPossible || 1);

          if (intensity < 0.4) div.classList.add("active-low");
          else if (intensity < 0.8) div.classList.add("active-med");
          else div.classList.add("active-high");

          div.title = `Day ${dayIndex + 1}: ${dScore} pts`;
        }
      }

      heatGrid.appendChild(div);
    }
  }
}

function todayScoreText() {
  const y = parseInt(yearInput.value) || NOW.getFullYear();

  const today = NOW.getDate() - 1;

  let score = 0;

  habits.forEach((h) => {
    if (h.days[today]) score += h.type === "positive" ? 1 : -1;
  });

  return `${score > 0 ? "+" : ""}${score} Net Score`;
}

function renderGraph() {
  const svg = document.getElementById("activityGraph");
  if (!svg) return;

  const y = parseInt(yearInput.value) || NOW.getFullYear();
  const totalDaysInMonth = getDays(y, currentMonth);

  // --- NEW: Determine how many days to show dots for ---
  const isThisMonth = currentMonth === NOW.getMonth() && y === NOW.getFullYear();
  const today = NOW.getDate();
  // Points array is 0-indexed, so today is index (today - 1).
  // We want to show dots up to index (today - 1).
  const maxDotIndex = isThisMonth ? today - 1 : totalDaysInMonth - 1;

  // 1. DATA CALCULATION
  let dataPoints = [];
  for (let d = 0; d < totalDaysInMonth; d++) {
    let dailyScore = 0;
    let posCount = 0;
    let negCount = 0;

    habits.forEach((h) => {
      if (h.days[d]) {
        if (h.type === "positive") {
            dailyScore += 1;
            posCount++;
        } else {
            dailyScore -= 1;
            negCount++;
        }
      }
    });
    
    dataPoints.push({
        score: dailyScore,
        pos: posCount,
        neg: negCount
    });
  }

  // 2. SETUP DIMENSIONS
  const container = svg.parentElement;
  
  let tooltip = container.querySelector(".graph-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "graph-tooltip";
    tooltip.innerHTML = `<span class="tooltip-date"></span><div class="tooltip-stats"></div>`;
    container.appendChild(tooltip);
  }

  const width = container.offsetWidth;
  const height = 150;

  // 3. X-AXIS SPACING
  let xPositions = [];
  const padding = 15;
  const drawWidth = width - (padding * 2);
  
  for (let d = 0; d < totalDaysInMonth; d++) {
    const x = padding + (d / (totalDaysInMonth - 1)) * drawWidth;
    xPositions.push(x);
  }

  // 4. Y-AXIS MAPPING
  const topPad = 30;
  const bottomPad = 20;
  const graphHeight = height - bottomPad;
  
  const maxVal = Math.max(...dataPoints.map(d => d.score), 5);
  const pxPerUnit = (graphHeight - topPad) / (maxVal || 1);
  const mapY = (val) => graphHeight - val * pxPerUnit;

  const points = dataPoints.map((d, i) => ({
    x: xPositions[i],
    y: mapY(d.score),
    val: d.score,
    pos: d.pos,
    neg: d.neg,
    day: i + 1,
    index: i // Keep track of original index
  }));

  if (points.length < 2) {
    svg.innerHTML = ``;
    return;
  }

  // 5. DRAW CURVE & DOTS
  let dPath = `M ${points[0].x} ${points[0].y}`;
  let dotsSVG = ""; 

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i < points.length - 1) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];

        const cp1x = p1.x + (p2.x - p0.x) * 0.15;
        const cp1y = p1.y + (p2.y - p0.y) * 0.15;
        const cp2x = p2.x - (p3.x - p1.x) * 0.15;
        const cp2y = p2.y - (p3.y - p1.y) * 0.15;

        dPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    // --- NEW: ONLY DRAW DOT IF NOT FUTURE ---
    // If it's past months, draw all. If current month, draw up to today.
    if (!isThisMonth || (isThisMonth && i <= maxDotIndex)) {
         dotsSVG += `<circle cx="${p.x}" cy="${p.y}" class="graph-dot" />`;
    }
  }
  
  const dArea = `${dPath} L ${points[points.length - 1].x} ${graphHeight} L ${points[0].x} ${graphHeight} Z`;

  // 6. RENDER SVG
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.width = "100%";

  let svgContent = `
    <defs>
        <linearGradient id="gradient-area" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#63e6a4" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#63e6a4" stop-opacity="0"/>
        </linearGradient>
    </defs>
    
    <line x1="0" y1="${graphHeight}" x2="${width}" y2="${graphHeight}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
    <path class="graph-area" d="${dArea}" pointer-events="none" />
    <path class="graph-path" d="${dPath}" pointer-events="none" />
    ${dotsSVG}
    <circle id="activeDot" cx="0" cy="0" />
    <rect class="graph-overlay" width="${width}" height="${height}" />
  `;

  svg.innerHTML = svgContent;

  // 7. INTERACTION LOGIC
  const overlay = svg.querySelector(".graph-overlay");
  const activeDot = svg.getElementById("activeDot");
  const dateEl = tooltip.querySelector(".tooltip-date");
  const statsEl = tooltip.querySelector(".tooltip-stats");
  
  let isPinned = false;

  const updateView = (relX) => {
    let closest = points[0];
    let minDiff = Infinity;
    
    for (let p of points) {
        const diff = Math.abs(relX - p.x);
        if (diff < minDiff) {
            minDiff = diff;
            closest = p;
        }
    }

    if (closest) {
        // Show Active Dot
        activeDot.setAttribute("cx", closest.x);
        activeDot.setAttribute("cy", closest.y);
        
        // Only show the big active ring if it's not a future date
        if (!isThisMonth || (isThisMonth && closest.index <= maxDotIndex)) {
             activeDot.classList.add("is-active");
        } else {
             activeDot.classList.remove("is-active");
        }

        // Update Content
        const monthName = monthNames[currentMonth].substring(0, 3);
        dateEl.textContent = `${monthName} ${closest.day}`;
        
        let html = ``;
        if (closest.pos > 0 || closest.neg === 0) {
             html += `<span class="stat-item" style="color:var(--green)">${closest.pos} done</span>`;
        }
        if (closest.neg > 0) {
             html += `<span class="stat-item" style="color:#ef4444">${closest.neg} slip</span>`;
        }
        if (closest.pos === 0 && closest.neg === 0) {
            html = `<span class="stat-item" style="color:var(--muted)">No activity</span>`;
        }
        statsEl.innerHTML = html;

        // CLAMPING LOGIC
        tooltip.style.opacity = "1";
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;
        let leftPos = closest.x - (tipWidth / 2);
        if (leftPos < 0) leftPos = 0;
        if (leftPos + tipWidth > width) {
            leftPos = width - tipWidth;
        }
        tooltip.style.left = `${leftPos}px`;
        tooltip.style.top = `${closest.y - tipHeight - 12}px`;
    }
  };

  const handleMove = (e) => {
    isPinned = false;
    const rect = svg.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    const relY = clientY - rect.top;
    if (relY < 40) { 
        handleLeave();
        return;
    }
    updateView(clientX - rect.left);
  };

  const handleClick = (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.type === 'touchend') {
        isPinned = true;
        return;
    }
    const relY = clientY - rect.top;
    if (relY < 40) return;
    updateView(clientX - rect.left);
    isPinned = true; 
  };

  const handleLeave = () => {
    if (!isPinned) {
        tooltip.style.opacity = "0";
        activeDot.classList.remove("is-active");
    }
  };

  overlay.addEventListener("mousemove", handleMove);
  overlay.addEventListener("touchmove", handleMove, { passive: false });
  overlay.addEventListener("click", handleClick);
  overlay.addEventListener("touchend", handleClick);
  overlay.addEventListener("mouseleave", handleLeave);
}

window.addEventListener(
  "resize",
  debounce(() => renderGraph(), 100),
);

yearInput.addEventListener("input", () => {
  loadHabits();
  update();
});

document.getElementById("addHabit").onclick = () => {
  habits.push({
    name: "New Habit",
    type: "positive",
    weight: 2,
    goal: 28,
    days: Array(
      getDays(yearInput.value || NOW.getFullYear(), currentMonth),
    ).fill(false),
  });

  save();
  update();
};

makeDropdown(
  document.getElementById("monthDropdown"),
  monthNames.map((m, i) => ({ label: m, value: i })),
  currentMonth,
  (m) => {
    currentMonth = m;
    loadHabits();
    update();
  },
  null,
);

document.addEventListener("click", () =>
  document
    .querySelectorAll(".dropdown-menu")
    .forEach((m) => (m.style.display = "none")),
);

function update() {
  renderHeader();
  renderHabits();
  updateStats();
  renderGraph();

  // RE-INIT ICONS AT END OF UPDATE

  lucide.createIcons();
}

loadHabits();
update();

/* =========================================================

   8. DYNAMIC QUOTES

========================================================= */

const motivationalQuotes = [
  "Consistency is key.",

  "Focus on the process.",

  "Small wins matter.",

  "Day one or one day.",

  "Keep showing up.",

  "Progress, not perfection.",

  "Build momentum.",

  "Stay hard.",

  "Discipline equals freedom.",

  "Just do it.",

  "One percent better.",

  "Don't break the chain.",

  "Focus.",

  "Execute.",

  "Less talk, more action.",
];

function setDailyQuote() {
  const el = document.getElementById("dailyQuote");

  if (el) {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);

    el.innerText = motivationalQuotes[randomIndex];
  }
}

// Run on load

setDailyQuote();

/* =========================================================
   MOBILE LAYOUT MANAGER (Teleport Elements)
========================================================= */

function handleMobileLayout() {
  const isMobile = window.innerWidth <= 768;

  // Select the elements we need to move
  const streakInfo = document.querySelector(".streak-info");
  const quote = document.getElementById("dailyQuote");
  const heatmap = document.getElementById("streakHeatmap");
  
  // Select Destinations
  const header = document.querySelector(".top");
  const graphSection = document.querySelector(".today-focus");
  const analyticsSection = document.querySelector(".analytics");
  const streakWidget = document.querySelector(".streak-widget");

  // Create a wrapper for rings if it doesn't exist (to separate them from heatmap)
  let ringsWrapper = document.getElementById("mobileRingsWrapper");
  if (!ringsWrapper) {
    ringsWrapper = document.createElement("div");
    ringsWrapper.id = "mobileRingsWrapper";
    ringsWrapper.className = "rings-container-mobile";
  }

  if (isMobile) {
    // --- 1. MOVE STREAK TO HEADER ---
    if (streakInfo && streakInfo.parentElement !== header) {
      header.appendChild(streakInfo);
      streakInfo.classList.add("mobile-view");
    }

    // --- 2. MOVE QUOTE TO BELOW GRAPH ---
    // We insert it right after the graph section
    if (quote && quote.previousElementSibling !== graphSection) {
      graphSection.parentNode.insertBefore(quote, graphSection.nextSibling);
      quote.classList.add("mobile-view");
    }

    // --- 3. MOVE HEATMAP TO ANALYTICS (ABOVE TASKS) ---
    // First, gather existing rings into the wrapper so they sit together
    const rings = document.querySelectorAll(".ring-block");
    rings.forEach(ring => ringsWrapper.appendChild(ring));
    
    // Put wrapper in analytics
    if (ringsWrapper.parentElement !== analyticsSection) {
      analyticsSection.insertBefore(ringsWrapper, analyticsSection.firstChild);
    }

    // Put Heatmap AFTER rings in analytics
    if (heatmap && heatmap.parentElement !== analyticsSection) {
      analyticsSection.appendChild(heatmap);
      heatmap.classList.add("mobile-view");
    }

  } else {
    // --- DESKTOP: RESET EVERYTHING ---
    // Move elements back to their original home: .streak-widget
    if (streakWidget) {
      // Move Streak back
      if (streakInfo && streakInfo.parentElement !== streakWidget) {
        streakInfo.classList.remove("mobile-view");
        streakWidget.insertBefore(streakInfo, streakWidget.firstChild);
      }
      
      // Move Quote back
      if (quote && quote.parentElement !== streakWidget) {
        quote.classList.remove("mobile-view");
        // Insert quote before heatmap (approximate original position)
        streakWidget.insertBefore(quote, streakWidget.children[1]); 
      }

      // Move Heatmap back
      if (heatmap && heatmap.parentElement !== streakWidget) {
        heatmap.classList.remove("mobile-view");
        streakWidget.appendChild(heatmap);
      }

      // Unwrap Rings (Put them back into analytics container directly)
      const rings = document.querySelectorAll(".ring-block");
      rings.forEach(ring => {
        analyticsSection.insertBefore(ring, streakWidget);
      });
      // Remove temporary wrapper
      if (ringsWrapper.parentElement) ringsWrapper.remove();
    }
  }
}

// Run on load
handleMobileLayout();

// Run on resize (debounced)
window.addEventListener("resize", debounce(() => {
  renderGraph(); // Your existing graph redraw
  handleMobileLayout(); // The new layout manager
}, 100));