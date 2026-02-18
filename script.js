const sizeSelect = document.getElementById("sizeSelect");
const generateBtn = document.getElementById("generateBtn");
const closeBtn = document.getElementById("closeBtn");
const startCustomBtn = document.getElementById("startCustomBtn");
const runSimulationBtn = document.getElementById("runSimulationBtn");
const runStatsBtn = document.getElementById("runStatsBtn");
const simRuns = document.getElementById("simRuns");
const navToggle = document.getElementById("navToggle");
const primaryNav = document.getElementById("primaryNav");
const topbar = document.querySelector(".topbar");

const statusText = document.getElementById("statusText");
const turnText = document.getElementById("turnText");
const currentPrisonerText = document.getElementById("currentPrisonerText");
const outputLog = document.getElementById("outputLog");
const summaryText = document.getElementById("summaryText");
const matrix = document.getElementById("matrix");

let n = 100;
let permutation = [];
let openedInView = new Set();

const customState = {
  active: false,
  finished: false,
  prisoner: 1,
  attemptsUsed: 0,
  limit: 50,
  suggestedBox: null
};

function setMobileMenu(open) {
  if (!topbar || !navToggle) return;
  topbar.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
}

function initScrollReveal() {
  const selectors = [
    ".plain-section h2",
    ".plain-section p",
    ".plain-section li",
    ".setup-section .control-block",
    ".results-grid > div",
    ".footer-brand",
    ".footer-nav a",
    ".footer-copy-bottom"
  ];

  const elements = document.querySelectorAll(selectors.join(", "));
  elements.forEach((el, index) => {
    if (el.classList.contains("reveal-on-view")) return;
    el.classList.add("reveal-on-view");
    el.style.setProperty("--reveal-delay", `${Math.min(index * 18, 260)}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );

  elements.forEach((el) => observer.observe(el));
}

function playHeroIntroAnimation() {
  const heroItems = document.querySelectorAll(".hero-copy > *");
  heroItems.forEach((el, index) => {
    el.classList.add("reveal-on-view");
    el.style.setProperty("--reveal-delay", "0ms");
    el.classList.remove("is-visible");
    window.setTimeout(() => {
      el.classList.add("is-visible");
    }, 420 + index * 120);
  });
}

function updateCurrentPrisonerText() {
  if (!currentPrisonerText) return;
  if (!customState.active) {
    currentPrisonerText.textContent = "Current prisoner: -";
    return;
  }
  if (customState.finished) {
    currentPrisonerText.textContent = `Current prisoner: ${customState.prisoner}/${n} (finished)`;
    return;
  }
  currentPrisonerText.textContent = `Current prisoner: ${customState.prisoner}/${n}`;
}

function randomPermutation(size) {
  const arr = Array.from({ length: size }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function appendOutput(line) {
  if (outputLog.textContent === "No output yet.") {
    outputLog.textContent = line;
    return;
  }
  outputLog.textContent += `\n${line}`;
}

function resetOutput(msg = "No output yet.") {
  outputLog.textContent = msg;
}

function setSummary(text) {
  summaryText.textContent = text;
}

function resetSummary(msg = "No summary yet.") {
  summaryText.textContent = msg;
}

function updateTurnText() {
  updateCurrentPrisonerText();
  if (!customState.active || customState.finished) {
    turnText.textContent = "";
    return;
  }
  const left = customState.limit - customState.attemptsUsed;
  turnText.textContent =
    `You are now prisoner ${customState.prisoner}, searching for number ${customState.prisoner}. ` +
    `You have ${customState.limit} attempts per prisoner. Attempts left: ${left}.`;
}

function renderMatrix() {
  const side = Math.sqrt(n);
  matrix.style.gridTemplateColumns = `repeat(${side}, minmax(0, 1fr))`;
  matrix.innerHTML = "";

  for (let box = 1; box <= n; box++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    const isOpened = openedInView.has(box);
    if (isOpened) {
      cell.classList.add("opened");
    } else {
      cell.classList.add("closed");
    }
    if (
      customState.active &&
      !customState.finished &&
      customState.suggestedBox === box &&
      !isOpened
    ) {
      cell.classList.add("suggested");
    }

    const boxLabel = document.createElement("div");
    boxLabel.className = "box";
    boxLabel.textContent = `Box ${box}`;

    const valueLabel = document.createElement("div");
    valueLabel.className = "value";
    valueLabel.textContent = isOpened ? String(permutation[box - 1]) : "?";

    cell.appendChild(boxLabel);
    cell.appendChild(valueLabel);

    cell.addEventListener("click", () => onBoxClick(box));
    matrix.appendChild(cell);
  }
}

function generateNewMatrix() {
  n = Number(sizeSelect.value);
  permutation = randomPermutation(n);
  openedInView = new Set();
  customState.active = false;
  customState.finished = false;
  customState.prisoner = 1;
  customState.attemptsUsed = 0;
  customState.limit = Math.floor(n / 2);
  customState.suggestedBox = null;
  statusText.textContent = "New matrix generated.";
  updateTurnText();
  resetOutput();
  setSummary(
    `Mode: Idle\n` +
    `N = ${n}\n` +
    `Attempts per prisoner = ${Math.floor(n / 2)}\n` +
    `Matrix generated and ready.`
  );
  renderMatrix();
}

function closeAllBoxes() {
  openedInView = new Set();
  renderMatrix();
}

function onBoxClick(box) {
  if (!customState.active) {
    openedInView.add(box);
    renderMatrix();
    appendOutput(`Opened box ${box} -> found number ${permutation[box - 1]}`);
    return;
  }

  if (customState.finished) {
    return;
  }


  if (openedInView.has(box)) {
    appendOutput(
      `Prisoner ${customState.prisoner}: box ${box} is already open. Choose a different box.`
    );
    return;
  }

  customState.attemptsUsed += 1;
  openedInView.add(box);
  renderMatrix();

  const found = permutation[box - 1];
  appendOutput(
    `Prisoner ${customState.prisoner}, attempt ${customState.attemptsUsed}/${customState.limit}: opened box ${box} -> ${found}`
  );

  if (found === customState.prisoner) {
    appendOutput(`Prisoner ${customState.prisoner} found their number.`);
    if (customState.prisoner === n) {
      customState.finished = true;
      customState.suggestedBox = null;
      statusText.textContent = "Custom simulation success: all prisoners found their number.";
      turnText.textContent = "";
      appendOutput("All prisoners succeeded.");
      setSummary(
        `Mode: Custom\n` +
        `N = ${n}\n` +
        `Attempts per prisoner = ${customState.limit}\n` +
        `Result: SUCCESS (all prisoners found their numbers)`
      );
      return;
    }

    customState.prisoner += 1;
    customState.attemptsUsed = 0;
    customState.suggestedBox = customState.prisoner;
    closeAllBoxes();
    appendOutput(`Moving to prisoner ${customState.prisoner}. All boxes are closed again.`);
    setSummary(
      `Mode: Custom\n` +
      `N = ${n}\n` +
      `Current prisoner = ${customState.prisoner}\n` +
      `Attempts per prisoner = ${customState.limit}\n` +
      `Result: in progress`
    );
    updateTurnText();
    return;
  }

  if (customState.attemptsUsed >= customState.limit) {
    customState.finished = true;
    customState.suggestedBox = null;
    statusText.textContent = `Custom simulation failed: prisoner ${customState.prisoner} did not find their number.`;
    turnText.textContent = "";
    appendOutput("All prisoners failed.");
    setSummary(
      `Mode: Custom\n` +
      `N = ${n}\n` +
      `Attempts per prisoner = ${customState.limit}\n` +
      `Result: FAILED at prisoner ${customState.prisoner}`
    );
    return;
  }

  customState.suggestedBox = found;
  renderMatrix();
  updateTurnText();
}

function runSingleSimulation(size, detailed) {
  const perm = randomPermutation(size);
  const limit = Math.floor(size / 2);
  const logs = [];

  for (let prisoner = 1; prisoner <= size; prisoner++) {
    let currentBox = prisoner;
    let foundOwn = false;

    if (detailed) {
      logs.push(`Prisoner ${prisoner} started with box ${prisoner}.`);
      logs.push("Chain:");
    }

    for (let attempt = 1; attempt <= limit; attempt++) {
      const foundNumber = perm[currentBox - 1];
      if (detailed) {
        logs.push(`  ${attempt}) box ${currentBox} -> ${foundNumber}`);
      }

      if (foundNumber === prisoner) {
        foundOwn = true;
        if (detailed) {
          logs.push("  -> Prisoner found the number.");
          logs.push("");
        }
        break;
      }

      currentBox = foundNumber;
    }

    if (!foundOwn) {
      if (detailed) {
        logs.push("  -> Prisoner did not find the number.");
        logs.push("");
        logs.push("Prisoners failed.");
      }
      return { success: false, logs };
    }
  }

  if (detailed) {
    logs.push("Prisoners succeeded.");
  }
  return { success: true, logs };
}

function runSimulationMode() {
  const runs = Number(simRuns.value);
  if (!Number.isInteger(runs) || runs < 1 || runs > 100) {
    statusText.textContent = "Invalid runs value. Use 1 to 100.";
    setSummary("Simulation Mode: invalid runs value (use 1-100).");
    return;
  }

  customState.active = false;
  customState.finished = false;
  customState.suggestedBox = null;
  updateTurnText();

  n = Number(sizeSelect.value);
  const limit = Math.floor(n / 2);

  if (runs === 1) {
    const result = runSingleSimulation(n, true);
    statusText.textContent = result.success ? "Simulation Mode: success." : "Simulation Mode: failed.";
    resetOutput(result.logs.join("\n"));
    setSummary(
      `Mode: Simulation\n` +
      `N = ${n}\n` +
      `Runs = 1\n` +
      `Attempts per prisoner = ${limit}\n` +
      `Result: ${result.success ? "SUCCESS" : "FAILED"}`
    );
    return;
  }

  let successCount = 0;
  for (let i = 0; i < runs; i++) {
    const result = runSingleSimulation(n, false);
    if (result.success) successCount += 1;
  }

  const percent = (successCount / runs) * 100;
  statusText.textContent = `Simulation Mode complete: ${successCount}/${runs} successful.`;
  resetOutput(
    `In ${runs} simulations, ${successCount} were successful.\n` +
    `Attempts per prisoner: ${limit}.\n` +
    `Success rate: ${percent.toFixed(2)}%.`
  );
  setSummary(
    `Mode: Simulation\n` +
    `N = ${n}\n` +
    `Runs = ${runs}\n` +
    `Attempts per prisoner = ${limit}\n` +
    `Successful runs = ${successCount}\n` +
    `Failed runs = ${runs - successCount}\n` +
    `Success rate = ${percent.toFixed(2)}%`
  );
}

function runStatsMode() {
  customState.active = false;
  customState.finished = false;
  customState.suggestedBox = null;
  updateTurnText();

  n = Number(sizeSelect.value);

  let sumSuccessPer100 = 0;
  const batchLines = ["Simulating one hundred simulations of the prisoners dilemma:\n"];

  for (let batch = 1; batch <= 100; batch++) {
    let successful = 0;
    for (let i = 0; i < 100; i++) {
      const result = runSingleSimulation(n, false);
      if (result.success) successful += 1;
    }
    sumSuccessPer100 += successful;
    batchLines.push(`Batch ${batch}: Number of successful simulations in one hundred: ${successful}`);
  }

  const average = sumSuccessPer100 / 100;
  statusText.textContent = "Statistical Mode complete (10,000 simulations).";
  resetOutput(
    `${batchLines.join("\n")}\n\n` +
    `Average success in 100 runs: ${average.toFixed(2)}%.`
  );
  setSummary(
    `Mode: Statistical\n` +
    `N = ${n}\n` +
    `Total simulations = 10,000\n` +
    `Average successful simulations per 100 = ${average.toFixed(2)}\n` +
    `Estimated success rate = ${average.toFixed(2)}%`
  );
}

function startCustomMode() {
  n = Number(sizeSelect.value);
  permutation = randomPermutation(n);
  openedInView = new Set();

  customState.active = true;
  customState.finished = false;
  customState.prisoner = 1;
  customState.attemptsUsed = 0;
  customState.limit = Math.floor(n / 2);
  customState.suggestedBox = customState.prisoner;

  statusText.textContent = "Custom Simulation Mode started. Click boxes for the current prisoner.";
  resetOutput(
    `Custom Mode (N=${n}) started.\n` +
    `You are now prisoner 1, searching for number 1.\n` +
    `You have ${customState.limit} attempts per prisoner.\n` +
    "If one prisoner fails, all fail."
  );
  setSummary(
    `Mode: Custom\n` +
    `N = ${n}\n` +
    `Current prisoner = 1\n` +
    `Attempts per prisoner = ${customState.limit}\n` +
    `Result: in progress`
  );
  updateTurnText();
  renderMatrix();
}

generateBtn.addEventListener("click", generateNewMatrix);
closeBtn.addEventListener("click", closeAllBoxes);
startCustomBtn.addEventListener("click", startCustomMode);
runSimulationBtn.addEventListener("click", runSimulationMode);
runStatsBtn.addEventListener("click", runStatsMode);
sizeSelect.addEventListener("change", generateNewMatrix);

if (navToggle && primaryNav && topbar) {
  navToggle.addEventListener("click", () => {
    const isOpen = topbar.classList.contains("menu-open");
    setMobileMenu(!isOpen);
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMobileMenu(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      setMobileMenu(false);
    }
  });
}

window.addEventListener("load", () => {
  document.body.classList.remove("is-loading");
  document.body.classList.add("loaded");
  window.setTimeout(() => {
    initScrollReveal();
    playHeroIntroAnimation();
  }, 40);
});

generateNewMatrix();
