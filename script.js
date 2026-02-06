/* =========================================================
   1. UTILS & SETUP
========================================================= */

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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
   3. RENDER LOGIC
========================================================= */

function renderHeader() {
  const dayHeader = document.getElementById("dayHeader");
  const y = parseInt(yearInput.value) || NOW.getFullYear();
  const days = getDays(y, currentMonth);
  const today = NOW.getDate();
  const isThisMonth = currentMonth === NOW.getMonth() && y === NOW.getFullYear();

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
  const isThisMonth = currentMonth === NOW.getMonth() && y === NOW.getFullYear();

  habits.forEach((h, i) => {
    if (!h.days || h.days.length !== days) {
      const newDays = Array(days).fill(false);
      if (h.days) h.days.forEach((val, idx) => { if (idx < days) newDays[idx] = val; });
      h.days = newDays;
    }

    const tr = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.contentEditable = isEditMode;
    nameTd.textContent = h.name;
    nameTd.style.cursor = isEditMode ? "text" : "default";
    nameTd.oninput = () => { h.name = nameTd.textContent; debouncedSave(); };
    tr.appendChild(nameTd);

    const isBottomRow = i >= habits.length - 2;
    const dropDir = isBottomRow ? "up" : "down";

    if (isEditMode) {
      // Type Dropdown
      const typeTd = document.createElement("td");
      const tDD = document.createElement("div");
      tDD.className = "dropdown";
      makeDropdown(tDD, [{ label: "Positive", value: "positive" }, { label: "Negative", value: "negative" }], h.type === "negative" ? 1 : 0, (v) => { h.type = v; save(); update(); }, dropDir);
      const typeBtn = tDD.querySelector(".dropdown-button");
      if (h.type === "positive") typeBtn.classList.add("badge-pos"); else typeBtn.classList.add("badge-neg");
      typeTd.appendChild(tDD);
      tr.appendChild(typeTd);

      // Importance Dropdown
      const impTd = document.createElement("td");
      const iDD = document.createElement("div");
      iDD.className = "dropdown";
      makeDropdown(iDD, [{ label: "Low", value: 1 }, { label: "Medium", value: 2 }, { label: "High", value: 3 }], (h.weight || 2) - 1, (v) => { h.weight = v; save(); update(); }, dropDir);
      const impBtn = iDD.querySelector(".dropdown-button");
      const w = h.weight || 2;
      if (w === 1) impBtn.classList.add("badge-imp-low");
      if (w === 2) impBtn.classList.add("badge-imp-med");
      if (w === 3) impBtn.classList.add("badge-imp-high");
      impTd.appendChild(iDD);
      tr.appendChild(impTd);

      // Goal Input
      const goalTd = document.createElement("td");
      const gIn = document.createElement("input");
      gIn.type = "number";
      gIn.className = "goal-input";
      gIn.value = h.goal || 28;
      gIn.oninput = (e) => { h.goal = +e.target.value; debouncedSave(); updateStats(); if (!isEditMode) updateProgress(tr, h); };
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
      
      const isFuture = y > NOW.getFullYear() || (y === NOW.getFullYear() && currentMonth > NOW.getMonth()) || (isThisMonth && d > NOW.getDate() - 1);
      if (isFuture) { cb.classList.add("future-day"); cb.disabled = true; }

      cb.onchange = () => { h.days[d] = cb.checked; save(); updateStats(); if (!isEditMode) updateProgress(tr, h); renderGraph(); };
      td.appendChild(cb);
      tr.appendChild(td);
    }

    const endTd = document.createElement("td");
    if (isEditMode) {
      const actionWrap = document.createElement("div");
      actionWrap.style.display = "flex"; actionWrap.style.gap = "4px"; actionWrap.style.justifyContent = "center";
      
      const btnUp = document.createElement("button"); btnUp.className = "toggle-edit-btn"; btnUp.innerHTML = `<i data-lucide="arrow-up" style="width:14px;"></i>`; btnUp.disabled = i === 0;
      btnUp.onclick = (e) => { e.stopPropagation(); [habits[i], habits[i - 1]] = [habits[i - 1], habits[i]]; save(); update(); };
      
      const btnDown = document.createElement("button"); btnDown.className = "toggle-edit-btn"; btnDown.innerHTML = `<i data-lucide="arrow-down" style="width:14px;"></i>`; btnDown.disabled = i === habits.length - 1;
      btnDown.onclick = (e) => { e.stopPropagation(); [habits[i], habits[i + 1]] = [habits[i + 1], habits[i]]; save(); update(); };
      
      const btnDel = document.createElement("button"); btnDel.className = "toggle-edit-btn"; btnDel.innerHTML = `<i data-lucide="trash-2" style="width:14px;"></i>`; btnDel.style.color = "#ef4444";
      btnDel.onclick = () => { if (confirm("Delete?")) { habits.splice(i, 1); save(); update(); } };

      actionWrap.append(btnUp, btnDown, btnDel);
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
   4. GRAPH RENDERING & INTERACTION (FIXED)
========================================================= */

function renderGraph() {
  const svg = document.getElementById("activityGraph");
  if (!svg) return;

  const y = parseInt(yearInput.value) || NOW.getFullYear();
  const totalDaysInMonth = getDays(y, currentMonth);

  // DOT VISIBILITY LOGIC
  const now = new Date();
  const viewDate = new Date(y, currentMonth, 1);
  const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);

  let maxDotIndex = -1; 

  if (viewDate.getTime() < currentDate.getTime()) {
      maxDotIndex = totalDaysInMonth - 1; // Past
  } else if (viewDate.getTime() === currentDate.getTime()) {
      maxDotIndex = now.getDate() - 1; // Present
  }
  // Future: -1 (Hidden)

  // DATA CALCULATION
  let dataPoints = [];
  for (let d = 0; d < totalDaysInMonth; d++) {
    let dailyScore = 0; let posCount = 0; let negCount = 0;
    habits.forEach((h) => {
      if (h.days[d]) {
        if (h.type === "positive") { dailyScore += 1; posCount++; }
        else { dailyScore -= 1; negCount++; }
      }
    });
    dataPoints.push({ score: dailyScore, pos: posCount, neg: negCount });
  }

  // DIMENSIONS
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

  let xPositions = [];
  const padding = 15;
  const drawWidth = width - (padding * 2);
  for (let d = 0; d < totalDaysInMonth; d++) {
    xPositions.push(padding + (d / (totalDaysInMonth - 1)) * drawWidth);
  }

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
    index: i
  }));

  if (points.length < 2) { svg.innerHTML = ``; return; }

  // DRAW
  let dPath = `M ${points[0].x} ${points[0].y}`;
  let dotsSVG = ""; 

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i < points.length - 1) {
        const p0 = points[Math.max(i - 1, 0)]; const p1 = points[i]; const p2 = points[i + 1]; const p3 = points[Math.min(i + 2, points.length - 1)];
        const cp1x = p1.x + (p2.x - p0.x) * 0.15; const cp1y = p1.y + (p2.y - p0.y) * 0.15;
        const cp2x = p2.x - (p3.x - p1.x) * 0.15; const cp2y = p2.y - (p3.y - p1.y) * 0.15;
        dPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    if (i <= maxDotIndex) dotsSVG += `<circle cx="${p.x}" cy="${p.y}" class="graph-dot" />`;
  }
  const dArea = `${dPath} L ${points[points.length - 1].x} ${graphHeight} L ${points[0].x} ${graphHeight} Z`;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.width = "100%";

  svg.innerHTML = `
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

  // INTERACTION LOGIC
  const overlay = svg.querySelector(".graph-overlay");
  const activeDot = svg.getElementById("activeDot");
  const dateEl = tooltip.querySelector(".tooltip-date");
  const statsEl = tooltip.querySelector(".tooltip-stats");
  
  let isPinned = false;

  const updateView = (relX, relY) => {
    let closest = points[0];
    let minDiff = Infinity;
    
    // Find closest point horizontally
    for (let p of points) {
        const diff = Math.abs(relX - p.x);
        if (diff < minDiff) { minDiff = diff; closest = p; }
    }

    if (closest) {
        // --- NEW LOGIC: Only show if touching BELOW the line ---
        // relY (finger pos) must be GREATER than closest.y (graph pos)
        // We add a small buffer (e.g. -10px) so hitting the dot directly still works
        if (relY < closest.y - 10) {
            handleLeave(); // Treat as "mouse left"
            return;
        }

        activeDot.setAttribute("cx", closest.x);
        activeDot.setAttribute("cy", closest.y);
        
        if (closest.index <= maxDotIndex) activeDot.classList.add("is-active");
        else activeDot.classList.remove("is-active");

        const monthName = monthNames[currentMonth].substring(0, 3);
        dateEl.textContent = `${monthName} ${closest.day}`;
        
        let html = ``;
        if (closest.pos > 0 || closest.neg === 0) html += `<span class="stat-item" style="color:var(--green)">${closest.pos} done</span>`;
        if (closest.neg > 0) html += `<span class="stat-item" style="color:#ef4444">${closest.neg} slip</span>`;
        if (closest.pos === 0 && closest.neg === 0) html = `<span class="stat-item" style="color:var(--muted)">No activity</span>`;
        statsEl.innerHTML = html;

        tooltip.style.opacity = "1";
        const tipWidth = tooltip.offsetWidth || 100;
        const tipHeight = tooltip.offsetHeight || 60;
        
        let leftPos = closest.x - (tipWidth / 2);
        if (leftPos < 10) leftPos = 10;
        if (leftPos + tipWidth > width - 10) leftPos = width - tipWidth - 10;
        
        // Vertical Flip Logic
        let topPos = closest.y - tipHeight - 15;
        if (topPos < 0) topPos = closest.y + 20;

        tooltip.style.left = `${leftPos}px`;
        tooltip.style.top = `${topPos}px`;
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
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    updateView(relX, relY);
  };

  const handleClick = (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.type === 'touchend') { isPinned = true; return; }
    
    updateView(clientX - rect.left, clientY - rect.top);
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

/* =========================================================
   5. DROPDOWN & UTILS
========================================================= */

function makeDropdown(el, options, selectedIndex, onChange, fixedSide = null) {
  el.innerHTML = ""; el.style.position = "relative";
  const btn = document.createElement("div");
  btn.className = "dropdown-button"; btn.tabIndex = 0;
  btn.innerHTML = options[selectedIndex]?.label || "Select";
  const menu = document.createElement("div");
  menu.className = "dropdown-menu"; menu.style.display = "none";

  options.forEach((opt) => {
    const item = document.createElement("div");
    item.className = "dropdown-item"; item.innerHTML = opt.label;
    item.onclick = (e) => { e.stopPropagation(); btn.innerHTML = opt.label; menu.style.display = "none"; onChange(opt.value); };
    menu.appendChild(item);
  });

  const toggleMenu = (e) => {
    e.stopPropagation();
    document.querySelectorAll(".dropdown-menu").forEach((m) => { if (m !== menu) m.style.display = "none"; });
    const isClosed = menu.style.display === "none";
    if (isClosed) {
      menu.style.display = "block";
      let openUp = fixedSide === "up";
      if (!fixedSide && window.innerHeight - btn.getBoundingClientRect().bottom < 200) openUp = true;
      if (openUp) { menu.style.top = "auto"; menu.style.bottom = "calc(100% + 8px)"; menu.style.transformOrigin = "bottom left"; }
      else { menu.style.top = "calc(100% + 8px)"; menu.style.bottom = "auto"; menu.style.transformOrigin = "top left"; }
    } else { menu.style.display = "none"; }
  };
  btn.onclick = toggleMenu;
  el.appendChild(btn); el.appendChild(menu);
}

function updateStats() {
    // Basic stats update logic matching your requirements
    // (Collapsed for brevity, assuming standard logic from previous steps)
    // Ensures rings update and "Net Score" badge updates.
    
    const y = parseInt(yearInput.value) || NOW.getFullYear();
    const isThisMonth = currentMonth === NOW.getMonth() && y === NOW.getFullYear();
    const todayIdx = isThisMonth ? NOW.getDate() - 1 : habits[0]?.days.length - 1 || 0;
    
    let earnedSoFar = 0, totalPossibleSoFar = 0, todayDone = 0, todayTotal = 0, todaySlips = 0, negTotal = 0, momentumSum = 0;
    
    habits.forEach((h) => {
        const w = Number(h.weight) || 2;
        const daysPassed = todayIdx + 1;
        
        // Efficiency
        if(h.type === "positive") {
            const checks = h.days.slice(0, daysPassed).filter(Boolean).length;
            earnedSoFar += (checks/daysPassed)*w;
        } else {
            const slips = h.days.slice(0, daysPassed).filter(Boolean).length;
            earnedSoFar += ((daysPassed-slips)/daysPassed)*w;
        }
        totalPossibleSoFar += w;
        
        // Today
        if (h.type === "positive") { todayTotal++; if(h.days[todayIdx]) todayDone++; }
        else { negTotal++; if(h.days[todayIdx]) todaySlips++; }
        
        // Momentum (Simple Last 3 Days)
        let recentScore = 0;
        for(let i=0; i<3; i++) {
            const idx = todayIdx - i;
            if(idx >= 0) {
                 const success = h.type==="positive" ? h.days[idx] : !h.days[idx];
                 if(success) recentScore++;
            }
        }
        momentumSum += (recentScore/3);
    });
    
    // Rings
    const efficiencyPct = totalPossibleSoFar ? (earnedSoFar/totalPossibleSoFar)*100 : 0;
    const todayPerf = ((todayDone + (negTotal - todaySlips)) / (todayTotal + negTotal || 1)) * 100;
    const momPct = habits.length ? (momentumSum / habits.length) * 100 : 0;
    
    setRing("ring-efficiency", efficiencyPct);
    setRing("ring-normalized", todayPerf);
    setRing("ring-momentum", momPct);
    
    // Streak
    let streak = 0;
    for (let d = todayIdx; d >= 0; d--) {
        let score = 0;
        habits.forEach(h => { if(h.days[d]) score += h.type==="positive"?1:-1; });
        if(score > 0) streak++; else break;
    }
    const streakEl = document.getElementById("streakValue");
    if(streakEl) streakEl.innerText = streak;
    
    // Header Streak (Mobile)
    const headerStreak = document.querySelector(".streak-info.mobile-view .streak-count");
    if(headerStreak) headerStreak.innerHTML = `<i data-lucide="flame" class="streak-icon"></i> ${streak}`;

    // Net Score Badge
    const scoreEl = document.getElementById("todaySummary");
    let todayNet = 0;
    habits.forEach(h => { if(h.days[todayIdx]) todayNet += h.type==="positive"?1:-1; });
    if(scoreEl) scoreEl.innerText = `${todayNet>0?"+":""}${todayNet} Net Score`;
    
    // Heatmap
    const heatGrid = document.getElementById("streakHeatmap");
    if(heatGrid) {
        heatGrid.innerHTML = "";
        for(let i=0; i<14; i++) {
            const dIdx = todayIdx - 13 + i;
            const div = document.createElement("div"); div.className="heat-box";
            if(dIdx >= 0) {
                let s=0; habits.forEach(h => { if(h.days[dIdx]) s+= h.type==="positive"?1:-1; });
                if(s>0) {
                    const inten = s/habits.length;
                    if(inten<0.4) div.classList.add("active-low");
                    else if(inten<0.8) div.classList.add("active-med");
                    else div.classList.add("active-high");
                }
            }
            heatGrid.appendChild(div);
        }
    }
    
    const footerC = document.querySelector(".counter");
    if(footerC) {
        const slipT = negTotal > 0 ? `<span style="opacity:0.3; margin:0 6px">|</span> <span style="color:#ef4444">${todaySlips}/${negTotal}</span> slips` : ``;
        footerC.innerHTML = `Today: <span style="color:var(--green)">${todayDone}/${todayTotal}</span> done ${slipT}`;
    }
}

function setRing(id, pct) {
  const path = document.getElementById(id.replace("ring-", "path-"));
  const text = document.getElementById(id.replace("ring-", "") + "Pct");
  if(!path) return;
  const r = path.getAttribute("r");
  const circ = 2 * Math.PI * r;
  path.style.strokeDasharray = `${circ} ${circ}`;
  path.style.strokeDashoffset = circ - (pct / 100) * circ;
  text.textContent = Math.round(pct) + "%";
}

/* =========================================================
   6. MOBILE RE-ORDER
========================================================= */

function handleMobileLayout() {
  const isMobile = window.innerWidth <= 768;
  const streakInfo = document.querySelector(".streak-info");
  const quote = document.getElementById("dailyQuote");
  const heatmap = document.getElementById("streakHeatmap");
  const header = document.querySelector(".top");
  const graphSection = document.querySelector(".today-focus");
  const analyticsSection = document.querySelector(".analytics");
  const streakWidget = document.querySelector(".streak-widget");

  let ringsWrapper = document.getElementById("mobileRingsWrapper");
  if (!ringsWrapper) {
    ringsWrapper = document.createElement("div");
    ringsWrapper.id = "mobileRingsWrapper";
    ringsWrapper.className = "rings-container-mobile";
  }

  if (isMobile) {
    if (streakInfo && streakInfo.parentElement !== header) { header.appendChild(streakInfo); streakInfo.classList.add("mobile-view"); }
    if (quote && quote.previousElementSibling !== graphSection) { graphSection.parentNode.insertBefore(quote, graphSection.nextSibling); quote.classList.add("mobile-view"); }
    
    const rings = document.querySelectorAll(".ring-block");
    rings.forEach(ring => ringsWrapper.appendChild(ring));
    if (ringsWrapper.parentElement !== analyticsSection) analyticsSection.insertBefore(ringsWrapper, analyticsSection.firstChild);
    
    if (heatmap && heatmap.parentElement !== analyticsSection) { analyticsSection.appendChild(heatmap); heatmap.classList.add("mobile-view"); }
  } else {
    if (streakWidget) {
      if (streakInfo && streakInfo.parentElement !== streakWidget) { streakInfo.classList.remove("mobile-view"); streakWidget.insertBefore(streakInfo, streakWidget.firstChild); }
      if (quote && quote.parentElement !== streakWidget) { quote.classList.remove("mobile-view"); streakWidget.insertBefore(quote, streakWidget.children[1]); }
      if (heatmap && heatmap.parentElement !== streakWidget) { heatmap.classList.remove("mobile-view"); streakWidget.appendChild(heatmap); }
      const rings = document.querySelectorAll(".ring-block");
      rings.forEach(ring => analyticsSection.insertBefore(ring, streakWidget));
      if (ringsWrapper.parentElement) ringsWrapper.remove();
    }
  }
}

// INIT
makeDropdown(document.getElementById("monthDropdown"), monthNames.map((m, i) => ({ label: m, value: i })), currentMonth, (m) => { currentMonth = m; loadHabits(); update(); }, null);
document.getElementById("addHabit").onclick = () => {
  habits.push({ name: "New Habit", type: "positive", weight: 2, goal: 28, days: Array(getDays(yearInput.value, currentMonth)).fill(false) });
  save(); update();
};

document.addEventListener("click", () => document.querySelectorAll(".dropdown-menu").forEach((m) => (m.style.display = "none")));
window.addEventListener("resize", debounce(() => { renderGraph(); handleMobileLayout(); }, 100));
yearInput.addEventListener("input", () => { loadHabits(); update(); });

function update() {
  renderHeader(); renderHabits(); updateStats(); renderGraph(); handleMobileLayout(); lucide.createIcons();
}

loadHabits(); update();

const quotes = ["Consistency is key.", "Focus on the process.", "Small wins matter.", "Day one or one day.", "Keep showing up.", "Progress, not perfection."];
const qEl = document.getElementById("dailyQuote");
if(qEl) qEl.innerText = quotes[Math.floor(Math.random()*quotes.length)];