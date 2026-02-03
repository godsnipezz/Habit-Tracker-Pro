const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const NOW = new Date();
let currentMonth = NOW.getMonth();
const yearInput = document.getElementById("year");
yearInput.value = NOW.getFullYear();

/* PREVENT SCROLL WHEEL
   Since we removed visual arrows, we also disable the scroll wheel
   to ensure the number only changes when you intentionally type it.
*/
yearInput.addEventListener("wheel", (e) => e.preventDefault());

const getDays = (y, m) => new Date(y, m + 1, 0).getDate();
const storageKey = () => `habits-${yearInput.value}-${currentMonth}`;

// LOAD DATA
let habits = JSON.parse(localStorage.getItem(storageKey())) || [];
const save = () => localStorage.setItem(storageKey(), JSON.stringify(habits));

function makeDropdown(el, options, selectedIndex, onChange) {
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

    if (menu.style.display === "none") {
      menu.style.display = "block";
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      if (spaceBelow < 220) {
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

let isEditMode = false;

function renderHeader() {
  const dayHeader = document.getElementById("dayHeader");
  const days = getDays(yearInput.value, currentMonth);
  const today = NOW.getDate();
  const isThisMonth = currentMonth === NOW.getMonth() && +yearInput.value === NOW.getFullYear();

  dayHeader.innerHTML = "";

  // 1. Habit Column
  const nameTh = document.createElement("th");
  const wrapper = document.createElement("div");
  wrapper.className = "sticky-header-content";

  const settingsBtn = document.createElement("button");
  settingsBtn.className = "toggle-edit-btn";
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

  // 2. Edit Columns
  if (isEditMode) {
      ["Type", "Imp", "Goal"].forEach(t => {
          const th = document.createElement("th");
          th.textContent = t;
          dayHeader.appendChild(th);
      });
  }

  // 3. Day Columns
  for (let d = 1; d <= days; d++) {
    const th = document.createElement("th");
    th.textContent = d;
    if (isThisMonth && d === today) th.classList.add("today-col");
    dayHeader.appendChild(th);
  }
  
  // 4. End Column
  const endTh = document.createElement("th");
  endTh.textContent = isEditMode ? "Del" : "";
  dayHeader.appendChild(endTh);

  lucide.createIcons();
}

function renderHabits() {
  const habitBody = document.getElementById("habitBody");
  habitBody.innerHTML = "";
  const days = getDays(yearInput.value, currentMonth);
  const today = NOW.getDate();
  const isThisMonth = currentMonth === NOW.getMonth() && +yearInput.value === NOW.getFullYear();

  habits.forEach((h, i) => {
    if (!h.days || h.days.length !== days) h.days = Array(days).fill(false);
    const tr = document.createElement("tr");

    // --- 1. Habit Name ---
    const nameTd = document.createElement("td");
    nameTd.contentEditable = isEditMode; 
    nameTd.textContent = h.name;
    nameTd.style.cursor = isEditMode ? "text" : "default";
    nameTd.onblur = () => { h.name = nameTd.textContent; save(); };
    tr.appendChild(nameTd);

    // --- 2. Edit Columns ---
    if (isEditMode) {
        // TYPE
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

        // IMP
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

        // GOAL
        const goalTd = document.createElement("td");
        const gIn = document.createElement("input");
        gIn.type = "number";
        gIn.className = "goal-input";
        gIn.value = h.goal || 28;
        
        // Disable scroll wheel for Goal Input (Typing only!)
        gIn.addEventListener("wheel", (e) => e.preventDefault());

        gIn.oninput = (e) => { 
            h.goal = +e.target.value; save(); updateStats(); 
        };
        gIn.onkeydown = (e) => { 
            if (e.key === "Enter") gIn.blur(); 
        };

        goalTd.appendChild(gIn);
        tr.appendChild(goalTd);
    }

    // --- 3. Checkboxes ---
    for (let d = 0; d < days; d++) {
      const td = document.createElement("td");
      const isToday = isThisMonth && d + 1 === today;
      
      if (isToday) td.classList.add("today-col");
      
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = h.days[d];

      if (h.type === "negative") cb.classList.add("neg-habit");
      
      const isFutureYear = +yearInput.value > NOW.getFullYear();
      const isFutureMonth = +yearInput.value === NOW.getFullYear() && currentMonth > NOW.getMonth();
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
      };
      td.appendChild(cb);
      tr.appendChild(td);
    }

    // --- 4. End Column ---
    const endTd = document.createElement("td");
    if (isEditMode) {
        endTd.innerHTML = `<i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>`;
        endTd.style.cursor = "pointer";
        endTd.style.opacity = "0.7";
        endTd.style.color = "#ef4444";
        endTd.onclick = () => {
            if (confirm("Delete habit?")) {
                habits.splice(i, 1);
                save();
                update();
            }
        };
    } else {
        endTd.innerHTML = `<div class="progress-bar"><div class="progress-fill"></div></div>`;
        setTimeout(() => updateProgress(tr, h), 0);
    }
    tr.appendChild(endTd);

    habitBody.appendChild(tr);
  });
  lucide.createIcons();
}

function updateProgress(tr, h) {
  const done = h.days.filter(Boolean).length;
  const pct = h.type === "positive"
      ? (done / h.days.length) * 100
      : ((h.days.length - done) / h.days.length) * 100;
  const fill = tr.querySelector(".progress-fill");
  if (fill) fill.style.width = pct + "%";
}

function setRing(id, pct) {
  const path = document.getElementById(id.replace("ring-", "path-"));
  const text = document.getElementById(id.replace("ring-", "") + "Pct");
  const circ = 213.6; 
  path.style.strokeDasharray = `${circ} ${circ}`;
  path.style.strokeDashoffset = circ - (pct / 100) * circ;
  text.textContent = Math.round(pct) + "%";
}

function updateStats() {
    const isThisMonth = currentMonth === NOW.getMonth() && +yearInput.value === NOW.getFullYear();
    const todayIdx = isThisMonth ? NOW.getDate() - 1 : (habits[0]?.days.length - 1 || 0);

    let earned = 0, totalPossible = 0;
    let todayDone = 0, todayTotal = 0; 
    let negSlips = 0, negTotal = 0;   
    let momentumSum = 0;

    habits.forEach(h => {
        const w = Number(h.weight) || 2; 
        const daysInMonth = h.days.length;
        const checkedDays = h.days.filter(Boolean).length;
        const successCount = h.type === "positive" ? checkedDays : (daysInMonth - checkedDays);

        earned += (successCount / daysInMonth) * w;
        totalPossible += w;

        if (h.type === "positive") {
            todayTotal++;
            if (h.days[todayIdx]) todayDone++; 
        } else {
            negTotal++;
            if (h.days[todayIdx]) negSlips++;
        }

        let hMom = 0, wSum = 0;
        [0.1, 0.2, 0.3, 0.4].forEach((weight, i) => {
            const idx = todayIdx - (3 - i);
            if (idx >= 0) { 
                const daySuccess = h.type === "positive" ? h.days[idx] : !h.days[idx];
                hMom += (daySuccess ? 1 : 0) * weight; 
                wSum += weight; 
            }
        });
        momentumSum += (wSum ? hMom / wSum : 0) * w;
    });

    const mScore = totalPossible ? (earned / totalPossible) * 100 : 0;
    const tScore = habits.length ? ((todayDone + (negTotal - negSlips)) / habits.length) * 100 : 0;
    const momScore = totalPossible ? (momentumSum / totalPossible) * 100 : 0;

    // UPDATE UI
    const successEl = document.getElementById("successRate");
    if (successEl) successEl.textContent = Math.round(mScore) + "%";

    document.getElementById("completed").textContent = todayDone;
    document.getElementById("total").textContent = todayTotal;

    document.getElementById("todaySummary").innerHTML = 
        `${todayDone} of ${todayTotal} habits done <span style="opacity:0.5; margin:0 8px">|</span> ${negSlips} of ${negTotal} slips`;

    setRing("ring-monthly", mScore); 
    setRing("ring-normalized", tScore); 
    setRing("ring-momentum", momScore);
}

yearInput.addEventListener("input", () => {
  const stored = localStorage.getItem(storageKey());
  habits = stored ? JSON.parse(stored) : []; 
  update();
});

document.getElementById("addHabit").onclick = () => {
  habits.push({
    name: "New Habit",
    type: "positive",
    weight: 2,
    goal: 28,
    days: Array(getDays(yearInput.value, currentMonth)).fill(false),
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
    const stored = localStorage.getItem(storageKey());
    habits = stored ? JSON.parse(stored) : [];
    update();
  },
);

function update() {
  renderHeader();
  renderHabits();
  updateStats();
  lucide.createIcons();
}

document.addEventListener("click", () =>
  document.querySelectorAll(".dropdown-menu").forEach((m) => (m.style.display = "none"))
);

update();