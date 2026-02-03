/* =========================================================
   1. UTILS & SETUP (Keep existing)
========================================================= */
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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
   2. DATA PERSISTENCE (Keep existing)
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
            if (checkM < 0) { checkM = 11; checkY--; }
            const prevKey = storageKey(checkY, checkM);
            const prevData = localStorage.getItem(prevKey);
            
            if (prevData) {
                const parsedPrev = JSON.parse(prevData);
                habits = parsedPrev.map(h => ({
                    name: h.name,
                    type: h.type || 'positive',
                    weight: h.weight || 2,
                    goal: h.goal || 28,
                    days: [] 
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
   3. RENDERING & LOGIC
========================================================= */
function makeDropdown(el, options, selectedIndex, onChange) {
    el.innerHTML = "";
    el.style.position = "relative";
    // ... (Keep existing dropdown code) ...
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
        menu.style.display = menu.style.display === "none" ? "block" : "none";
        if(menu.style.display === 'block') {
             menu.style.top = "calc(100% + 8px)";
             menu.style.bottom = "auto";
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

// ... (renderHeader and renderHabits remain exactly the same as previous) ...

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
        ? `<i data-lucide="check" style="width: 16px; height: 16px;"></i>` 
        : `<i data-lucide="settings-2" style="width: 16px; height: 16px;"></i>`;
      
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
        ["Type", "Imp", "Goal"].forEach(t => {
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
            if(h.days) {
                h.days.forEach((val, idx) => { if(idx < days) newDays[idx] = val; });
            }
            h.days = newDays;
        }

        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.contentEditable = isEditMode; 
        nameTd.textContent = h.name;
        nameTd.style.cursor = isEditMode ? "text" : "default";
        nameTd.oninput = () => { h.name = nameTd.textContent; debouncedSave(); };
        tr.appendChild(nameTd);

        if (isEditMode) {
            const typeTd = document.createElement("td");
            const tDD = document.createElement("div");
            tDD.className = "dropdown";
            makeDropdown(tDD, 
                [{ label: "Positive", value: "positive" }, { label: "Negative", value: "negative" }],
                h.type === "negative" ? 1 : 0,
                (v) => { h.type = v; save(); update(); }
            );
            const typeBtn = tDD.querySelector('.dropdown-button');
            if (h.type === 'positive') typeBtn.classList.add('badge-pos');
            else typeBtn.classList.add('badge-neg');
            typeTd.appendChild(tDD);
            tr.appendChild(typeTd);

            const impTd = document.createElement("td");
            const iDD = document.createElement("div");
            iDD.className = "dropdown";
            makeDropdown(iDD, 
                [{ label: "Low", value: 1 }, { label: "Medium", value: 2 }, { label: "High", value: 3 }],
                (h.weight || 2) - 1,
                (v) => { h.weight = v; save(); update(); }
            );
            const impBtn = iDD.querySelector('.dropdown-button');
            const w = h.weight || 2;
            if (w === 1) impBtn.classList.add('badge-imp-low');
            if (w === 2) impBtn.classList.add('badge-imp-med');
            if (w === 3) impBtn.classList.add('badge-imp-high');
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
            
            const isFutureYear = y > NOW.getFullYear();
            const isFutureMonth = y === NOW.getFullYear() && currentMonth > NOW.getMonth();
            const isFutureDay = isThisMonth && d > NOW.getDate() - 1;
            
            if (isFutureYear || isFutureMonth || isFutureDay) {
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
            actionWrap.style.alignItems = "center";

            const btnUp = document.createElement("button");
            btnUp.className = "toggle-edit-btn";
            btnUp.innerHTML = `<i data-lucide="arrow-up" style="width: 14px; height: 14px;"></i>`;
            btnUp.disabled = i === 0; 
            btnUp.onclick = (e) => {
                e.stopPropagation();
                [habits[i], habits[i - 1]] = [habits[i - 1], habits[i]];
                save();
                update();
            };

            const btnDown = document.createElement("button");
            btnDown.className = "toggle-edit-btn";
            btnDown.innerHTML = `<i data-lucide="arrow-down" style="width: 14px; height: 14px;"></i>`;
            btnDown.disabled = i === habits.length - 1;
            btnDown.onclick = (e) => {
                e.stopPropagation();
                [habits[i], habits[i + 1]] = [habits[i + 1], habits[i]];
                save();
                update();
            };

            const btnDel = document.createElement("button");
            btnDel.className = "toggle-edit-btn";
            btnDel.innerHTML = `<i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>`;
            btnDel.style.color = "#ef4444";
            btnDel.style.marginLeft = "8px"; 
            btnDel.onclick = () => {
                if (confirm("Delete habit?")) {
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

function setRing(id, pct) {
    const path = document.getElementById(id.replace("ring-", "path-"));
    const text = document.getElementById(id.replace("ring-", "") + "Pct");
    const r = path.getAttribute('r'); 
    const circ = 2 * Math.PI * r; 
    path.style.strokeDasharray = `${circ} ${circ}`;
    path.style.strokeDashoffset = circ - (pct / 100) * circ;
    text.textContent = Math.round(pct) + "%";
}

function updateStats() {
    const y = parseInt(yearInput.value) || NOW.getFullYear();
    const isThisMonth = currentMonth === NOW.getMonth() && y === NOW.getFullYear();
    const todayIdx = isThisMonth ? NOW.getDate() - 1 : (habits[0]?.days.length - 1 || 0);

    let earned = 0, totalPossible = 0;
    let todayDone = 0, todayTotal = 0; 
    let negSlips = 0, negTotal = 0;   
    let momentumSum = 0;

    habits.forEach(h => {
        const w = Number(h.weight) || 2; 
        const checkedDays = h.days.filter(Boolean).length;
        
        let ratio = 0;
        if (h.type === "positive") {
            const target = h.goal || h.days.length;
            ratio = checkedDays / target;
            if (ratio > 1) ratio = 1; 
        } else {
            ratio = (h.days.length - checkedDays) / h.days.length;
        }
        
        earned += ratio * w;
        totalPossible += w;

        if (h.type === "positive") {
            todayTotal++;
            if (h.days[todayIdx]) todayDone++; 
        } else {
            negTotal++;
            if (h.days[todayIdx]) negSlips++;
        }

        let hMom = 0, wSum = 0;
        const weights = [0.1, 0.2, 0.3, 0.4]; 
        
        weights.forEach((weight, i) => {
            const lookback = 3 - i; 
            const idx = todayIdx - lookback;
            if (idx >= 0 && idx < h.days.length) { 
                const isSuccess = h.type === "positive" ? h.days[idx] : !h.days[idx];
                hMom += (isSuccess ? 1 : 0) * weight; 
                wSum += weight; 
            }
        });
        
        const normalizedMom = wSum > 0 ? (hMom / wSum) : 0;
        momentumSum += normalizedMom * w;
    });

    const mScore = totalPossible ? (earned / totalPossible) * 100 : 0;
    const tScore = habits.length ? ((todayDone + (negTotal - negSlips)) / habits.length) * 100 : 0;
    const momScore = totalPossible ? (momentumSum / totalPossible) * 100 : 0;

    const successEl = document.getElementById("successRate");
    if (successEl) successEl.textContent = Math.round(mScore) + "%";

    document.getElementById("completed").textContent = todayDone;
    document.getElementById("total").textContent = todayTotal;

    document.getElementById("todaySummary").innerHTML = todayScoreText();

    setRing("ring-monthly", mScore); 
    setRing("ring-normalized", tScore); 
    setRing("ring-momentum", momScore);
}

function todayScoreText() {
    const y = parseInt(yearInput.value) || NOW.getFullYear();
    const today = NOW.getDate() - 1;
    let score = 0;
    habits.forEach(h => {
        if(h.days[today]) score += (h.type === 'positive' ? 1 : -1);
    });
    return `${score > 0 ? '+' : ''}${score} Net Score`;
}

// =========================================================
//  UPDATED GRAPH LOGIC (The Fix)
// =========================================================
// --- GRAPH RENDERING LOGIC ---
// --- GRAPH RENDERING LOGIC ---
function renderGraph() {
    const svg = document.getElementById("activityGraph");
    if (!svg) return;

    // 1. Data Setup
    const y = parseInt(yearInput.value) || NOW.getFullYear();
    const totalDaysInMonth = getDays(y, currentMonth); 
    
    let scores = [];
    for (let d = 0; d < totalDaysInMonth; d++) {
        let dailyScore = 0;
        habits.forEach(h => {
            if (h.days[d]) dailyScore += (h.type === 'positive' ? 1 : -1);
        });
        scores.push(dailyScore);
    }

    // 2. Setup Dimensions
    const width = 800;  
    const height = 150; 
    
    // 3. DYNAMIC ALIGNMENT (Match Table Columns)
    let leftOffset = 0;
    const table = document.querySelector('table');
    const firstHeader = document.querySelector('th:first-child');
    
    if (table && firstHeader) {
        const ratio = width / table.offsetWidth;
        leftOffset = firstHeader.offsetWidth * ratio;
    } else {
        leftOffset = width * 0.22; 
    }

    // 4. Y-AXIS SCALING (LIFT THE GRAPH)
    const padding = 20; // Space for top labels
    const bottomBuffer = 50; // <--- INCREASED from 20 to 50 to lift graph up
    
    // Force valid range so low scores (1, 2) have height
    let maxData = Math.max(...scores);
    let maxVal = Math.max(maxData + 2, 6); // Min peak height of 6
    let minVal = Math.min(...scores, 0);   // Anchor bottom to 0
    
    const range = maxVal - minVal;
    
    // Map Y (Inverted: 0 is bottom)
    // The "Floor" (0) will now be at (height - bottomBuffer)
    const mapY = (val) => height - bottomBuffer - ((val - minVal) / range) * (height - padding - bottomBuffer);
    
    // 5. X-AXIS SCALING
    const graphWidth = width - leftOffset;
    const mapX = (i) => leftOffset + ((i + 0.5) / totalDaysInMonth) * graphWidth;

    // 6. Generate Points
    const points = scores.map((val, i) => ({ x: mapX(i), y: mapY(val), val }));

    if (points.length < 2) {
        svg.innerHTML = ``;
        return;
    }

    // 7. Build Curve (Spline)
    let dPath = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
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

    // 8. Gradient Area
    // Anchor area to the new, lifted baseline
    const baseline = height - bottomBuffer;
    const dArea = `${dPath} L ${points[points.length-1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

    // 9. Render SVG
    let svgContent = `
        <defs>
            <linearGradient id="gradient-area" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#63e6a4" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#63e6a4" stop-opacity="0"/>
            </linearGradient>
        </defs>
        
        <line x1="${leftOffset}" y1="${baseline}" x2="${width}" y2="${baseline}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        
        <line x1="${leftOffset}" y1="0" x2="${leftOffset}" y2="${height}" stroke="rgba(255,255,255,0.05)" stroke-width="1" stroke-dasharray="4 4" />

        <path class="graph-area" d="${dArea}" />
        <path class="graph-path" d="${dPath}" />
    `;

    // 10. Labels
    points.forEach((p, i) => {
        if (p.val !== 0) {
            svgContent += `
                <text x="${p.x}" y="${p.y - 12}" class="graph-label visible">${p.val}</text>
                <circle cx="${p.x}" cy="${p.y}" r="3" fill="#1a1a1a" stroke="#63e6a4" stroke-width="2"/>
            `;
        }
    });

    svg.innerHTML = svgContent;
}

// EVENTS
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
        days: Array(getDays(yearInput.value || NOW.getFullYear(), currentMonth)).fill(false),
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
);

document.addEventListener("click", () =>
    document.querySelectorAll(".dropdown-menu").forEach((m) => (m.style.display = "none"))
);

function update() {
    renderHeader();
    renderHabits();
    updateStats();
    renderGraph();
    lucide.createIcons();
}

// INIT
loadHabits();
update();