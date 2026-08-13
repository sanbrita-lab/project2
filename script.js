);const SUPABASE_URL = "https://lsflbpscljvygperoyij.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vWb2bFOiBbxTaUPxl7nkGQ_L36dzJzd";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const timeSlots = ["Morning", "Afternoon", "Evening"];

const activities = [
  { icon:"🎬", name:"Cozy Cinema Date", category:"cozy", energy:"low", duration:"long", minutes:120, description:"Pick a movie neither of you has seen, get snacks, and debrief like extremely serious film critics." },
  { icon:"☕", name:"Coffee & Catch-Up", category:"low", energy:"low", duration:"short", minutes:45, description:"Make your favourite drink, get on a call, and talk about everything except work for 45 minutes." },
  { icon:"🎮", name:"Chaotic Game Night", category:"playful", energy:"high", duration:"medium", minutes:75, description:"Play an online game where winning matters way too much and absolutely nobody is allowed to be salty." },
  { icon:"🎨", name:"Draw Each Other", category:"creative", energy:"medium", duration:"medium", minutes:60, description:"Choose the same reference, draw each other, reveal at the same time, and prepare to be humbled." },
  { icon:"🍝", name:"Same Recipe Night", category:"romantic", energy:"medium", duration:"long", minutes:120, description:"Cook the same recipe together over video call, compare results, and eat together." },
  { icon:"💌", name:"Question Card Date", category:"deep", energy:"low", duration:"medium", minutes:60, description:"Take turns answering thoughtful questions about childhood, dreams, fears, memories and the future." },
  { icon:"🎧", name:"Playlist Swap", category:"romantic", energy:"low", duration:"short", minutes:45, description:"Make five-song mini playlists for each other and listen together while explaining every choice." },
  { icon:"🌍", name:"Imaginary Trip", category:"creative", energy:"medium", duration:"medium", minutes:60, description:"Pick a random city and plan a completely imaginary weekend there with a ridiculous budget." },
  { icon:"🛋️", name:"Parallel Play", category:"low", energy:"low", duration:"long", minutes:120, description:"Stay on call while doing your own thing. No pressure to perform. Just exist together." },
  { icon:"😂", name:"Couple Trivia", category:"playful", energy:"medium", duration:"short", minutes:45, description:"Write five questions each about yourselves and see who actually remembers the lore." },
  { icon:"📸", name:"Photo Memory Date", category:"deep", energy:"low", duration:"medium", minutes:60, description:"Choose old photos and tell each other the stories behind the ones the other person hasn't heard." },
  { icon:"🌙", name:"Late-Night Life Talk", category:"deep", energy:"low", duration:"long", minutes:120, description:"Phones down, lights low, and a proper conversation about life, plans, worries and hopes." }
];

let state = {
  me: {},
  partner: {},
  vibe: "cozy",
  energy: "low",
  duration: "short",
  currentDate: null
};

function loadState() {
  const saved = localStorage.getItem("ldrDatePlanner");
  if (saved) {
    try { state = {...state, ...JSON.parse(saved)}; } catch(e) {}
  }
}

function saveState() {
  localStorage.setItem("ldrDatePlanner", JSON.stringify(state));
}

function renderAvailability(person) {
  const container = document.getElementById(person + "Availability");
  container.innerHTML = "";

  days.forEach(day => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";

    const header = document.createElement("div");
    header.className = "day-header";
    header.innerHTML = `<span>${day}</span><span>${countSelected(person, day)} selected</span>`;
    dayDiv.appendChild(header);

    const options = document.createElement("div");
    options.className = "time-options";

    timeSlots.forEach(slot => {
      const selected = state[person][day]?.includes(slot);
      const btn = document.createElement("button");
      btn.className = "time-chip" + (selected ? " selected" : "");
      btn.textContent = slot;
      btn.onclick = () => toggleAvailability(person, day, slot);
      options.appendChild(btn);
    });

    dayDiv.appendChild(options);
    container.appendChild(dayDiv);
  });
}

function countSelected(person, day) {
  return state[person][day]?.length || 0;
}

function toggleAvailability(person, day, slot) {
  if (!state[person][day]) state[person][day] = [];
  const index = state[person][day].indexOf(slot);
  if (index >= 0) state[person][day].splice(index, 1);
  else state[person][day].push(slot);
  saveState();
  renderAvailability(person);
  renderOverlap();
}

function clearAvailability(person) {
  state[person] = {};
  saveState();
  renderAvailability(person);
  renderOverlap();
}

function getOverlap() {
  return days.flatMap(day => {
    const mine = state.me[day] || [];
    const theirs = state.partner[day] || [];
    return timeSlots.filter(slot => mine.includes(slot) && theirs.includes(slot)).map(slot => ({day, slot}));
  });
}

function renderOverlap() {
  const overlaps = getOverlap();
  const summary = document.getElementById("overlapSummary");
  if (!overlaps.length) {
    summary.textContent = "No shared windows yet — choose some availability above.";
    return;
  }
  const preview = overlaps.slice(0, 3).map(x => `${x.day} · ${x.slot}`).join("  •  ");
  summary.textContent = overlaps.length > 3 ? `${preview}  •  +${overlaps.length - 3} more` : preview;
}

function setChoices() {
  document.querySelectorAll(".choice").forEach(button => {
    button.addEventListener("click", () => {
      const group = button.dataset.group;
      document.querySelectorAll(`.choice[data-group="${group}"]`).forEach(b => b.classList.remove("selected"));
      button.classList.add("selected");
      state[group] = button.dataset.value;
      saveState();
    });
  });
}

function getDurationMinutes(duration) {
  return duration === "short" ? 45 : duration === "medium" ? 90 : 150;
}

function planDate() {
  const overlaps = getOverlap();
  let candidates = activities.filter(a =>
    (a.category === state.vibe || state.vibe === "low" && a.category === "low") &&
    a.energy === state.energy &&
    a.minutes <= getDurationMinutes(state.duration)
  );

  if (!candidates.length) {
    candidates = activities.filter(a => a.energy === state.energy && a.minutes <= getDurationMinutes(state.duration));
  }
  if (!candidates.length) candidates = activities;

  const activity = candidates[Math.floor(Math.random() * candidates.length)];
  const window = overlaps.length ? overlaps[Math.floor(Math.random() * overlaps.length)] : {day:"Your next free day", slot:"your chosen time"};

  const date = {
    day: window.day,
    slot: window.slot,
    ...activity,
    vibe: state.vibe
  };

  state.currentDate = date;
  saveState();
  renderResult(date);
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("result").scrollIntoView({behavior:"smooth", block:"center"});
}

function renderResult(date) {
  document.getElementById("resultDate").textContent = `${date.day} · ${date.slot}`;
  document.getElementById("resultTitle").textContent = date.name;
  document.getElementById("resultDescription").textContent = date.description;
  document.getElementById("resultDuration").textContent = date.minutes + " min";
  document.getElementById("resultEnergy").textContent = date.energy + " energy";
  document.getElementById("resultVibe").textContent = date.category;
}

function saveCurrentDate() {
  if (!state.currentDate) return;
  const saved = JSON.parse(localStorage.getItem("ldrJournal") || "[]");
  saved.unshift({
    title: state.currentDate.name,
    date: new Date().toISOString().slice(0,10),
    note: `${state.currentDate.day} · ${state.currentDate.slot} — planned ${state.currentDate.name}.`
  });
  localStorage.setItem("ldrJournal", JSON.stringify(saved));
  renderJournal();
  updateHero();
  alert("Date locked! It has been added to your journal.");
}

function addMemory() {
  const title = document.getElementById("memoryTitle").value.trim();
  const date = document.getElementById("memoryDate").value;
  const note = document.getElementById("memoryNote").value.trim();
  if (!title) return alert("Give this memory a title first.");

  const saved = JSON.parse(localStorage.getItem("ldrJournal") || "[]");
  saved.unshift({title, date: date || new Date().toISOString().slice(0,10), note});
  localStorage.setItem("ldrJournal", JSON.stringify(saved));

  document.getElementById("memoryTitle").value = "";
  document.getElementById("memoryDate").value = "";
  document.getElementById("memoryNote").value = "";
  renderJournal();
}

function renderJournal() {
  const container = document.getElementById("journalList");
  const saved = JSON.parse(localStorage.getItem("ldrJournal") || "[]");
  if (!saved.length) {
    container.innerHTML = `<p class="empty">Your date archive is waiting for its first entry.</p>`;
    return;
  }

  container.innerHTML = saved.map((item, index) => `
    <article class="journal-item">
      <div class="panel-title">
        <div>
          <p class="mini-label">${item.date || "DATE"}</p>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <button class="text-button" onclick="deleteMemory(${index})">Delete</button>
      </div>
      ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
    </article>
  `).join("");
}

function deleteMemory(index) {
  const saved = JSON.parse(localStorage.getItem("ldrJournal") || "[]");
  saved.splice(index, 1);
  localStorage.setItem("ldrJournal", JSON.stringify(saved));
  renderJournal();
  updateHero();
}

function updateHero() {
  const saved = JSON.parse(localStorage.getItem("ldrJournal") || "[]");
  if (saved.length) {
    document.getElementById("heroNextDate").textContent = saved[0].date;
    document.getElementById("heroNextActivity").textContent = saved[0].title;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({behavior:"smooth"});
}

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderAvailability("me");
  renderAvailability("partner");
  renderOverlap();
  setChoices();
  renderJournal();
  updateHero();
  document.getElementById("memoryDate").value = new Date().toISOString().slice(0,10);
  document.getElementById("activityGrid").innerHTML = activities.map(a => `
    <article class="activity-card">
      <div class="activity-icon">${a.icon}</div>
      <p class="activity-meta">${a.category.toUpperCase()} · ${a.energy.toUpperCase()} ENERGY · ${a.minutes} MIN</p>
      <h3>${a.name}</h3>
      <p>${a.description}</p>
    </article>
  `).join("");
});
