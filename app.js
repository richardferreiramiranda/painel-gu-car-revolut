const canvas = document.querySelector("#noiseCanvas");
const ctx = canvas.getContext("2d");
const typedCommand = document.querySelector("#typedCommand");
const consoleStream = document.querySelector("#consoleStream");
const bootLog = document.querySelector("#bootLog");
const saveState = document.querySelector("#saveState");
const lastSaved = document.querySelector("#lastSaved");
const flagInputs = [...document.querySelectorAll(".switch-list input")];

const storageKey = "guCarRevolutPanelState";
const apiBase = "http://127.0.0.1:8765";

const commands = [
  "run --scan-clips --active",
  "crawl --links --mercado-livre",
  "extract --stock --variations",
  "export --csv --txt --now",
  "arm --chrome-port 9222",
];

const streamLines = [
  "chrome debugger handshake confirmado",
  "listagem OMNI_ACTIVE localizada",
  "tres pontinhos: rotina de clique armada",
  "criando relatorio anuncios_precisam_clip_lista.csv",
  "estoque: deposito e variacoes em standby",
  "operador pode iniciar proximo processo",
];

let width = 0;
let height = 0;
let commandIndex = 0;
let charIndex = 0;
let deleting = false;
let lastOutputCount = null;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function saveStateNow(patch = {}) {
  const current = loadState();
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(storageKey, JSON.stringify(next));
  renderSaveState(next);
}

function renderSaveState(state = loadState()) {
  if (!lastSaved || !saveState) {
    return;
  }

  if (!state.updatedAt) {
    lastSaved.textContent = "sem checkpoint";
    saveState.textContent = "READY";
    return;
  }

  lastSaved.textContent = new Date(state.updatedAt).toLocaleString("pt-BR");
  saveState.textContent = "SYNCED";
}

function restoreFlags() {
  const state = loadState();

  if (!state.flags) {
    return;
  }

  flagInputs.forEach((input, index) => {
    if (typeof state.flags[index] === "boolean") {
      input.checked = state.flags[index];
    }
  });
}

function persistFlags() {
  saveStateNow({
    flags: flagInputs.map((input) => input.checked),
  });
}

function serializeConsole() {
  return [...consoleStream.querySelectorAll("p")]
    .slice(-8)
    .map((p) => p.innerHTML);
}

function restoreConsole() {
  const state = loadState();

  if (!state.console || !state.console.length) {
    return;
  }

  consoleStream.innerHTML = "";
  state.console.forEach((line) => {
    const p = document.createElement("p");
    p.innerHTML = line;
    consoleStream.appendChild(p);
  });
}

function addConsoleLine(text) {
  const p = document.createElement("p");
  p.innerHTML = `<span>&gt;</span> ${text}`;
  consoleStream.appendChild(p);

  while (consoleStream.children.length > 8) {
    consoleStream.removeChild(consoleStream.firstElementChild);
  }

  saveStateNow({
    console: serializeConsole(),
    lastCommand: text,
  });
}

async function callApi(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Falha ao comunicar com o motor local.");
  }

  return data;
}

function renderJobStatus(data) {
  const logs = data.logs || [];
  consoleStream.innerHTML = "";

  logs.slice(-8).forEach((line) => {
    const p = document.createElement("p");
    p.innerHTML = `<span>&gt;</span> ${line}`;
    consoleStream.appendChild(p);
  });

  if (
    data.outputs
    && data.outputs.csv_exists
    && data.outputs.total_anuncios !== lastOutputCount
  ) {
    lastOutputCount = data.outputs.total_anuncios;
    addConsoleLine(`base pronta: ${data.outputs.total_anuncios} anuncios no CSV`);
  }
}

async function refreshJobStatus() {
  try {
    const data = await callApi("/api/status");

    if (data.running || data.logs?.length) {
      renderJobStatus(data);
    }

    return data;
  } catch {
    return null;
  }
}

async function startListaGvi() {
  addConsoleLine("enviando comando para extrair lista completa + GVI...");

  try {
    const data = await callApi("/api/run/lista-gvi", {
      method: "POST",
    });

    addConsoleLine(data.message);
    refreshJobStatus();
  } catch (error) {
    addConsoleLine(`motor local offline ou ocupado: ${error.message}`);
  }
}

function abrirRelatorios() {
  window.open(`${apiBase}/outputs/links_anuncios.csv`, "_blank");
  window.open(`${apiBase}/outputs/links_anuncios.txt`, "_blank");
  addConsoleLine("abrindo relatorios links_anuncios.csv e links_anuncios.txt");
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawNoise() {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < 170; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = Math.random() * 0.18;
    ctx.fillStyle = `rgba(255, 0, 47, ${alpha})`;
    ctx.fillRect(x, y, Math.random() * 3 + 1, 1);
  }

  for (let i = 0; i < 36; i++) {
    const y = Math.random() * height;
    ctx.strokeStyle = `rgba(255, 0, 47, ${Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + Math.random() * 24 - 12);
    ctx.stroke();
  }

  requestAnimationFrame(drawNoise);
}

function typeLoop() {
  const current = commands[commandIndex];

  if (!deleting) {
    charIndex += 1;
    typedCommand.textContent = current.slice(0, charIndex);

    if (charIndex >= current.length) {
      deleting = true;
      setTimeout(typeLoop, 1200);
      return;
    }
  } else {
    charIndex -= 1;
    typedCommand.textContent = current.slice(0, charIndex);

    if (charIndex <= 0) {
      deleting = false;
      commandIndex = (commandIndex + 1) % commands.length;
    }
  }

  setTimeout(typeLoop, deleting ? 28 : 58);
}

function appendStreamLine() {
  const line = streamLines[Math.floor(Math.random() * streamLines.length)];
  addConsoleLine(line);
}

function pulseBootLog() {
  const lines = [...bootLog.querySelectorAll("p")];
  lines.forEach((line) => line.style.opacity = "0.58");

  const active = lines[Math.floor(Math.random() * lines.length)];
  if (active) {
    active.style.opacity = "1";
  }
}

document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    const texto = button.textContent.trim().toLowerCase();
    addConsoleLine(`comando recebido: ${texto}`);

    if (texto === "executar rotina" || texto === "ver base") {
      startListaGvi();
    }

    if (texto === "abrir relatorios") {
      abrirRelatorios();
    }
  });
});

flagInputs.forEach((input) => {
  input.addEventListener("change", persistFlags);
});

window.addEventListener("resize", resize);

restoreFlags();
restoreConsole();
renderSaveState();
resize();
drawNoise();
typeLoop();
saveStateNow({
  modules: [
    "Clip Hunter",
    "Stock Extractor",
    "Link Crawler",
    "GVI Locator",
    "Video Queue",
  ],
});
setInterval(appendStreamLine, 2200);
setInterval(pulseBootLog, 900);
setInterval(refreshJobStatus, 3000);
