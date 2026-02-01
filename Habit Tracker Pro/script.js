const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const NOW = new Date();
let currentMonth = NOW.getMonth();
const yearInput = document.getElementById("year");
yearInput.value = NOW.getFullYear();

const getDays = (y, m) => new Date(y, m + 1, 0).getDate();
const storageKey = () => `habits-${yearInput.value}-${currentMonth}`;

// INITIAL LOAD: Fetch habits or start with an empty array
let habits = JSON.parse(localStorage.getItem(storageKey())) || [];

const save = () => localStorage.setItem(storageKey(), JSON.stringify(habits));

/**
 * Creates a custom dropdown that stays anchored to its parent container.
 */
function makeDropdown(el, options, selectedIndex, onChange) {
    el.innerHTML = "";
    el.style.position = "relative"; 
    const btn = document.createElement("div");
    btn.className = "dropdown-button";
    btn.innerHTML = options[selectedIndex]?.label || "Select";
    const menu = document.createElement("div");
    menu.className = "dropdown-menu"; menu.style.display = "none";
    options.forEach(opt => {
        const item = document.createElement("div");
        item.className = "dropdown-item"; item.innerHTML = opt.label;
        item.onclick = (e) => { 
            e.stopPropagation(); 
            btn.innerHTML = opt.label; 
            menu.style.display = "none"; 
            onChange(opt.value); 
        };
        menu.appendChild(item);
    });
    btn.onclick = (e) => { 
        e.stopPropagation(); 
        document.querySelectorAll('.dropdown-menu').forEach(m => { if (m !== menu) m.style.display = 'none'; });
        menu.style.display = menu.style.display === "block" ? "none" : "block"; 
    };
    el.appendChild(btn); el.appendChild(menu);
}

function renderHeader() {
    const dayHeader = document.getElementById("dayHeader");
    const days = getDays(yearInput.value, currentMonth);
    const today = NOW.getDate();
    const isThisMonth = currentMonth === NOW.getMonth() && +yearInput.value === NOW.getFullYear();
    
    dayHeader.innerHTML = `<th>Habit</th><th>Type</th><th>Imp</th><th>Goal</th>`;
    for (let d = 1; d <= days; d++) {
        const th = document.createElement("th");
        th.textContent = d;
        if (isThisMonth && d === today) th.classList.add("today-col");
        dayHeader.appendChild(th);
    }
    dayHeader.innerHTML += `<th>Progress</th><th></th>`;
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

        // Habit Name
        const nameTd = document.createElement("td");
        nameTd.contentEditable = true; nameTd.textContent = h.name;
        nameTd.onblur = () => { h.name = nameTd.textContent; save(); };
        tr.appendChild(nameTd);

        // Type (Positive/Negative)
        const typeTd = document.createElement("td");
        const tDD = document.createElement("div"); tDD.className = "dropdown";
        makeDropdown(tDD, [{label:"🟢 Pos", value:"positive"}, {label:"🔴 Neg", value:"negative"}], h.type === "negative" ? 1 : 0, v => { h.type = v; save(); update(); });
        typeTd.appendChild(tDD); tr.appendChild(typeTd);

        // Importance
        const impTd = document.createElement("td");
        const iDD = document.createElement("div"); iDD.className = "dropdown";
        makeDropdown(iDD, [{label:"L", value:1}, {label:"M", value:2}, {label:"H", value:3}], (h.weight || 2) - 1, v => { h.weight = v; save(); update(); });
        impTd.appendChild(iDD); tr.appendChild(impTd);

        // Monthly Goal
        const goalTd = document.createElement("td");
        const gIn = document.createElement("input");
        gIn.type = "number"; gIn.className = "goal-input"; gIn.value = h.goal || 28;
        gIn.oninput = (e) => { h.goal = +e.target.value; save(); updateStats(); };
        goalTd.appendChild(gIn); tr.appendChild(goalTd);

        // Daily Checkboxes
        for (let d = 0; d < days; d++) {
            const td = document.createElement("td");
            if (isThisMonth && (d + 1) === today) td.classList.add("today-col");
            const cb = document.createElement("input");
            cb.type = "checkbox"; cb.checked = h.days[d];

            // DATA ISOLATION: Disable if date hasn't happened yet
            const isFutureYear = +yearInput.value > NOW.getFullYear();
            const isFutureMonth = (+yearInput.value === NOW.getFullYear()) && (currentMonth > NOW.getMonth());
            const isFutureDay = isThisMonth && (d > (NOW.getDate() - 1));
            
            cb.disabled = isFutureYear || isFutureMonth || isFutureDay;

            cb.onchange = () => { h.days[d] = cb.checked; save(); updateStats(); updateProgress(tr, h); };
            td.appendChild(cb); tr.appendChild(td);
        }

        // Progress Bar
        const progTd = document.createElement("td");
        progTd.innerHTML = `<div class="progress-bar"><div class="progress-fill"></div></div>`;
        tr.appendChild(progTd);

        // Delete Button
        const del = document.createElement("td");
        del.innerHTML = "🗑"; del.style.cursor = "pointer"; del.style.opacity = "0.3";
        del.onclick = () => { if(confirm("Delete habit?")) { habits.splice(i, 1); save(); update(); } };
        tr.appendChild(del);

        habitBody.appendChild(tr);
        updateProgress(tr, h);
    });
}

function updateProgress(tr, h) {
    const done = h.days.filter(Boolean).length;
    const pct = h.type === "positive" ? (done / h.days.length) * 100 : ((h.days.length - done) / h.days.length) * 100;
    const fill = tr.querySelector(".progress-fill");
    if (fill) fill.style.width = pct + "%";
}

function setRing(id, pct) {
    const path = document.getElementById(id.replace('ring-', 'path-'));
    const text = document.getElementById(id.replace('ring-', '') + 'Pct');
    const circ = 213.6; // Circumference for r=34
    path.style.strokeDasharray = `${circ} ${circ}`;
    path.style.strokeDashoffset = circ - (pct / 100) * circ;
    text.textContent = Math.round(pct) + "%";
}

function updateStats() {
    const isThisMonth = currentMonth === NOW.getMonth() && +yearInput.value === NOW.getFullYear();
    const todayIdx = isThisMonth ? NOW.getDate() - 1 : (habits[0]?.days.length - 1 || 0);
    
    let earned = 0, totalPossible = 0, todayDone = 0, momentumSum = 0;

    habits.forEach(h => {
        const w = h.weight || 2;
        const successCount = h.type === "positive" ? h.days.filter(Boolean).length : (h.days.length - h.days.filter(Boolean).length);
        earned += (successCount / h.days.length) * w;
        totalPossible += w;

        if (h.type === "positive" ? h.days[todayIdx] : !h.days[todayIdx]) todayDone++;

        // Momentum Calculation (Weighted last 4 days)
        let hMom = 0, wSum = 0;
        [0.1, 0.2, 0.3, 0.4].forEach((weight, i) => {
            const idx = todayIdx - (3 - i);
            if (idx >= 0) { 
                hMom += (h.type === "positive" ? h.days[idx] : !h.days[idx]) * weight; 
                wSum += weight; 
            }
        });
        momentumSum += (wSum ? hMom / wSum : 0) * w;
    });

    const mScore = totalPossible ? (earned / totalPossible) * 100 : 0;
    const tScore = habits.length ? (todayDone / habits.length) * 100 : 0;
    const momScore = totalPossible ? (momentumSum / totalPossible) * 100 : 0;

    document.getElementById("successRate").textContent = Math.round(mScore) + "%";
    document.getElementById("completed").textContent = todayDone;
    document.getElementById("total").textContent = habits.length;
    document.getElementById("todaySummary").textContent = `${todayDone} of ${habits.length} habits done today`;
    
    setRing("ring-monthly", mScore); 
    setRing("ring-normalized", tScore); 
    setRing("ring-momentum", momScore);
}

// CRITICAL: Year Listener forces data refresh and resets rings for future years
yearInput.addEventListener('input', () => {
    const stored = localStorage.getItem(storageKey());
    habits = stored ? JSON.parse(stored) : []; // Explicitly reset to empty if no data
    update();
});

document.getElementById("addHabit").onclick = () => {
    habits.push({ name: "New Habit", type: "positive", weight: 2, goal: 28, days: Array(getDays(yearInput.value, currentMonth)).fill(false) });
    save(); update();
};

// CRITICAL: Month Dropdown also forces data refresh
makeDropdown(document.getElementById("monthDropdown"), monthNames.map((m, i) => ({ label: m, value: i })), currentMonth, m => {
    currentMonth = m; 
    const stored = localStorage.getItem(storageKey());
    habits = stored ? JSON.parse(stored) : []; 
    update();
});

function update() { 
    renderHeader(); 
    renderHabits(); 
    updateStats(); 
    lucide.createIcons(); 
}

// Close menus when clicking away
document.addEventListener("click", () => document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display='none'));

update();
