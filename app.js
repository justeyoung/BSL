// BSL practice: 12 timed slides per session. Runs entirely in the browser.

const SLIDES_PER_SESSION = 12;

// pronoun is null for "Me" (never gets the "dead" line). Cousin is treated as male.
const FAMILY = [
  { name: "Me", pronoun: null },
  { name: "Grandfather", pronoun: "He" },
  { name: "Grandmother", pronoun: "She" },
  { name: "Father", pronoun: "He" },
  { name: "Mother", pronoun: "She" },
  { name: "Brother", pronoun: "He" },
  { name: "Sister", pronoun: "She" },
  { name: "Auntie", pronoun: "She" },
  { name: "Uncle", pronoun: "He" },
  { name: "Cousin", pronoun: "He" },
  { name: "Son", pronoun: "He" },
  { name: "Daughter", pronoun: "She" },
];
const GREETINGS = ["Hello", "Good morning", "Good afternoon", "Good night"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEAD_CHANCE = 0.25; // per non-"Me" slide, so the count varies each session

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Every item in `all` at least once, padded with random picks up to `n`, shuffled.
function coverAll(all, n) {
  const picks = [...all];
  while (picks.length < n) picks.push(all[Math.floor(Math.random() * all.length)]);
  return shuffle(picks);
}

function generateSession() {
  const family = shuffle(FAMILY);
  const months = shuffle(MONTHS);
  const weekdays = coverAll(WEEKDAYS, SLIDES_PER_SESSION);
  const greetings = coverAll(GREETINGS, SLIDES_PER_SESSION);

  return family.map((member, i) => {
    const day = String(1 + Math.floor(Math.random() * 31)).padStart(2, "0");
    const date = `${weekdays[i]}, ${day} ${months[i]}`;
    const owner = member.pronoun ? `My ${member.name.toLowerCase()}\u2019s` : "My";
    const dead = member.pronoun && Math.random() < DEAD_CHANCE;
    return {
      member: member.name,
      greeting: greetings[i],
      birthday: `${owner} birthday is ${date}.`,
      dead: dead ? `${member.pronoun} is dead.` : null,
    };
  });
}

if (typeof module !== "undefined") module.exports = { generateSession, FAMILY, GREETINGS, MONTHS, WEEKDAYS };

// ---------- Browser UI ----------
if (typeof document !== "undefined") {
  const $ = (id) => document.getElementById(id);
  const screens = { setup: $("setup"), session: $("session"), end: $("end") };
  const secondsInput = $("seconds");
  const startBtn = $("start");
  const stopBtn = $("stop");
  const continueBtn = $("continue");
  const restartBtn = $("restart");

  let slides = [];
  let index = 0;
  let secondsPerSlide = 0;
  let deadline = 0;
  let ticker = null;

  function show(name) {
    for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  }

  function resetSetup() {
    secondsInput.value = "";
    startBtn.disabled = true;
    show("setup");
    secondsInput.focus();
  }

  function setRunning(running) {
    stopBtn.disabled = !running;
    continueBtn.disabled = running;
  }

  function renderSlide() {
    const slide = slides[index];
    const box = $("slide");
    box.replaceChildren();
    for (const text of [slide.greeting, slide.birthday, slide.dead]) {
      if (!text) continue;
      const p = document.createElement("p");
      p.textContent = text;
      box.appendChild(p);
    }
    $("count").textContent = `${index + 1} / ${slides.length}`;
  }

  function updateTimer() {
    const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    $("timer").textContent = `${left}s`;
    return left;
  }

  function beginSlide() {
    clearInterval(ticker);
    deadline = performance.now() + secondsPerSlide * 1000;
    renderSlide();
    updateTimer();
    setRunning(true);
    ticker = setInterval(() => {
      if (updateTimer() > 0) return;
      index += 1;
      if (index >= slides.length) return finish();
      beginSlide();
    }, 200);
  }

  function finish() {
    clearInterval(ticker);
    show("end");
    $("again").focus();
  }

  function startSession() {
    secondsPerSlide = parseInt(secondsInput.value, 10);
    if (!(secondsPerSlide >= 1)) return;
    slides = generateSession();
    index = 0;
    show("session");
    beginSlide();
  }

  secondsInput.addEventListener("input", () => {
    secondsInput.value = secondsInput.value.replace(/\D/g, "");
    startBtn.disabled = !(parseInt(secondsInput.value, 10) >= 1);
  });
  secondsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !startBtn.disabled) startSession();
  });
  startBtn.addEventListener("click", startSession);
  stopBtn.addEventListener("click", () => { clearInterval(ticker); setRunning(false); });
  continueBtn.addEventListener("click", beginSlide); // same slide, full countdown again
  restartBtn.addEventListener("click", () => { index = 0; beginSlide(); });
  $("again").addEventListener("click", resetSetup);
  window.addEventListener("pageshow", resetSetup);
  resetSetup();
}
