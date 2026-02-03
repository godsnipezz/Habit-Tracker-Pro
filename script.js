/* =========================================================
   CORE STATE (UNCHANGED)
========================================================= */
const NOW = new Date();
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

let currentMonth = NOW.getMonth();
let habits = [];
let isEditMode = false;

const yearInput = document.getElementById("year");
yearInput.value = NOW.getFullYear();

const getDays = (y,m)=>new Date(y,m+1,0).getDate();
const storageKey = (y,m)=>`habits-${y}-${m}`;

/* =========================================================
   LOAD / SAVE (UNCHANGED)
========================================================= */
function loadHabits() {
  const y = +yearInput.value;
  const key = storageKey(y,currentMonth);
  habits = JSON.parse(localStorage.getItem(key)) || [];
}

function save() {
  const y = +yearInput.value;
  localStorage.setItem(storageKey(y,currentMonth),JSON.stringify(habits));
}

/* =========================================================
   HEADER RENDER (ORDER FIXED, LOGIC SAME)
========================================================= */
function renderHeader() {
  const head = document.getElementById("dayHeader");
  head.innerHTML = "";

  const days = getDays(+yearInput.value,currentMonth);

  // Habit always first
  const habitTh = document.createElement("th");
  habitTh.className = "sticky-col";
  habitTh.textContent = "Habit";
  head.appendChild(habitTh);

  // Metadata AFTER habit (edit only)
  if (isEditMode) {
    ["Type","Imp","Goal"].forEach(t=>{
      const th = document.createElement("th");
      th.className = "metadata-col";
      th.textContent = t;
      head.appendChild(th);
    });
  }

  // Days
  for(let d=1;d<=days;d++){
    const th=document.createElement("th");
    th.textContent=d;
    head.appendChild(th);
  }
}

/* =========================================================
   HABIT ROWS (ORDER FIXED)
========================================================= */
function renderHabits() {
  const body=document.getElementById("habitBody");
  body.innerHTML="";

  const days=getDays(+yearInput.value,currentMonth);

  habits.forEach(h=>{
    if(!h.days||h.days.length!==days){
      h.days=Array(days).fill(false);
    }

    const tr=document.createElement("tr");

    // Habit name first
    const nameTd=document.createElement("td");
    nameTd.className="sticky-col";
    nameTd.textContent=h.name;
    tr.appendChild(nameTd);

    // Metadata scrolls AFTER
    if(isEditMode){
      for(let i=0;i<3;i++){
        const td=document.createElement("td");
        td.className="metadata-col";
        tr.appendChild(td);
      }
    }

    // Days
    h.days.forEach((v,i)=>{
      const td=document.createElement("td");
      const cb=document.createElement("input");
      cb.type="checkbox";
      cb.checked=v;
      cb.onchange=()=>{
        h.days[i]=cb.checked;
        save();
        update();
      };
      td.appendChild(cb);
      tr.appendChild(td);
    });

    body.appendChild(tr);
  });
}

/* =========================================================
   GRAPH (INDEX-BASED, SCROLL SAFE)
========================================================= */
function renderGraph() {
  const svg=document.getElementById("activityGraph");
  if(!svg)return;

  const days=getDays(+yearInput.value,currentMonth);
  const colWidth=42;
  const height=150;
  const baseY=120;

  let scores=Array(days).fill(0);
  habits.forEach(h=>{
    h.days.forEach((v,i)=>{
      if(v)scores[i]+=1;
    });
  });

  svg.setAttribute("viewBox",`0 0 ${days*colWidth} ${height}`);

  let d=`M 0 ${baseY}`;
  scores.forEach((s,i)=>{
    const x=i*colWidth+colWidth/2;
    const y=baseY-s*12;
    d+=` L ${x} ${y}`;
  });

  svg.innerHTML=`
    <defs>
      <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#63e6a4" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#63e6a4" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path class="graph-path" d="${d}"/>
  `;
}

/* =========================================================
   SCROLL SYNC (NEW, NON-DESTRUCTIVE)
========================================================= */
const tableWrap=document.querySelector(".table-wrapper");
const graph=document.getElementById("activityGraph");

const graphScroll=document.createElement("div");
graphScroll.className="graph-scroll";
graph.parentNode.insertBefore(graphScroll,graph);
graphScroll.appendChild(graph);

let syncing=false;

tableWrap.addEventListener("scroll",()=>{
  tableWrap.classList.toggle("scrolled",tableWrap.scrollLeft>40);
  if(syncing)return;
  syncing=true;
  graphScroll.scrollLeft=tableWrap.scrollLeft;
  syncing=false;
});

graphScroll.addEventListener("scroll",()=>{
  if(syncing)return;
  syncing=true;
  tableWrap.scrollLeft=graphScroll.scrollLeft;
  syncing=false;
});

/* =========================================================
   UPDATE PIPELINE (UNCHANGED)
========================================================= */
function update(){
  renderHeader();
  renderHabits();
  renderGraph();
}

/* =========================================================
   INIT
========================================================= */
loadHabits();
update();
