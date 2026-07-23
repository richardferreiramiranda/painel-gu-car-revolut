/* ==========================================================================
   SECOND BRAIN · GU CAR REVOLUT — interface cognitiva ficticia (self-contained)
   Sem backend. Roda direto no GitHub Pages / file://.
   Reais de verdade: (1) tela LIVE de extracao simulada em tempo real
   e (2) gerador de lista final em .txt a partir do campo numerico.
   ========================================================================== */

/* ----- elementos ----- */
const neuralCanvas = document.querySelector("#neuralCanvas");
const nctx = neuralCanvas.getContext("2d");

const bootScreen = document.querySelector("#bootScreen");
const bootText = document.querySelector("#bootText");
const bootBar = document.querySelector("#bootBar");
const shell = document.querySelector("#shell");

const clockEl = document.querySelector("#clock");
const yearEl = document.querySelector("#year");

const genQty = document.querySelector("#genQty");
const genGo = document.querySelector("#genGo");
const genHint = document.querySelector("#genHint");

const procCard = document.querySelector(".card.progress");
const procState = document.querySelector("#procState");
const procName = document.querySelector("#procName");
const procDetail = document.querySelector("#procDetail");
const barFill = document.querySelector("#barFill");
const barPct = document.querySelector("#barPct");
const barCount = document.querySelector("#barCount");

const liveFeed = document.querySelector("#liveFeed");
const consoleEl = document.querySelector("#console");
const moduleGrid = document.querySelector("#moduleGrid");

/* ==========================================================================
   BANCO DE DADOS FICTICIO — pecas automotivas
   ========================================================================== */
const pecas = [
  "Farol", "Lanterna", "Retrovisor", "Parachoque", "Amortecedor",
  "Pastilha de Freio", "Disco de Freio", "Bomba de Agua", "Radiador",
  "Filtro de Ar", "Vela de Ignicao", "Correia Dentada", "Coxim do Motor",
  "Bieleta", "Bandeja de Suspensao", "Terminal de Direcao", "Kit Embreagem",
  "Bobina de Ignicao", "Sensor de Fase", "Bico Injetor", "Alternador",
  "Motor de Partida", "Junta do Cabecote", "Valvula Termostatica",
  "Cilindro Mestre", "Rolamento de Roda", "Junta Homocinetica", "Cabo de Vela",
];
const posicoes = [
  "Dianteiro Esquerdo", "Dianteiro Direito", "Dianteira",
  "Traseiro Esquerdo", "Traseiro Direito", "Traseira", "",
];
const carros = [
  "Gol G5", "Onix 1.4", "HB20 1.6", "Civic G9", "Corolla 2015", "Palio Fire",
  "Uno Way", "Strada 1.4", "Saveiro Cross", "Ka SE", "Fiesta 1.6", "Cruze LT",
  "Compass 2.0", "Renegade 1.8", "Toro Volcano", "Sandero 1.0", "Kwid Zen",
  "Mobi Like", "Argo Drive", "Polo TSI", "Nivus Highline", "Tracker Premier",
];
const corredores = ["A", "B", "C", "D", "E", "F", "G"];
const clipTipos = ["Criar Clip", "Incluir Clip"];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const pad = (n, s) => String(n).padStart(s, "0");

function gerarProduto(indice) {
  const peca = pick(pecas);
  const posicao = Math.random() < 0.55 ? " " + pick(posicoes) : "";
  const carro = pick(carros);
  const nome = `${peca}${posicao} ${carro}`.replace(/\s+/g, " ").trim();
  return {
    indice,
    nome,
    gvi: "GVI-" + rand(1000, 9999),
    codigo: "MLB" + rand(100000000, 999999999),
    estoque: rand(0, 42),
    localizacao: `Corredor ${pick(corredores)} · Prat. ${rand(1, 9)} · Box ${rand(1, 45)}`,
    clip: pick(clipTipos),
  };
}

/* ==========================================================================
   CONSOLE
   ========================================================================== */
function addConsole(text) {
  const p = document.createElement("p");
  p.innerHTML = `<span>&rsaquo;</span> ${text}`;
  consoleEl.appendChild(p);
  while (consoleEl.children.length > 10) consoleEl.removeChild(consoleEl.firstElementChild);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

/* ==========================================================================
   TELA LIVE
   ========================================================================== */
function resetLive() {
  liveFeed.innerHTML = "";
}
function addLiveItem(p) {
  const row = document.createElement("div");
  row.className = "live-item";

  const name = document.createElement("span");
  name.className = "li-name";
  name.textContent = `${pad(p.indice, 3)} · ${p.nome}`;

  const meta = document.createElement("div");
  meta.className = "li-meta";
  meta.innerHTML =
    `<span class="chip gvi">${p.gvi}</span>` +
    `<span class="chip clip">${p.clip}</span>` +
    `<span class="chip">estoque ${p.estoque} un</span>` +
    `<span class="chip loc">${p.localizacao}</span>`;

  row.append(name, meta);
  liveFeed.insertBefore(row, liveFeed.firstChild);
  while (liveFeed.children.length > 40) liveFeed.removeChild(liveFeed.lastChild);
}

/* ==========================================================================
   MOTOR FICTICIO DE EXTRACAO
   ========================================================================== */
let activeTimer = null;
let jobIsActive = false;
let ultimaLista = [];

function setProgress(current, total, statusText) {
  const percent = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
  barFill.style.width = `${percent}%`;
  barPct.textContent = `${percent}%`;
  barCount.textContent = `${current} / ${total}`;
  if (statusText) procDetail.textContent = statusText;
}

function pararJob() {
  if (activeTimer) clearInterval(activeTimer);
  activeTimer = null;
  jobIsActive = false;
}

function runExtraction({ nome, statusText = "Processando", total, download = false, arquivo = "fila_videos_com_localizacao.txt" }) {
  pararJob();
  resetLive();
  ultimaLista = [];
  jobIsActive = true;

  procCard.classList.add("is-running");
  procState.textContent = "em execução";
  procName.textContent = nome;
  addConsole(`iniciando: ${nome} (${total} itens)`);
  setProgress(0, total, `${statusText} 1 de ${total}`);

  let atual = 0;
  const passo = Math.max(1, Math.round(total / 6));
  activeTimer = setInterval(() => {
    atual += 1;
    const produto = gerarProduto(atual);
    ultimaLista.push(produto);
    addLiveItem(produto);
    if (atual <= 2 || atual % passo === 0) addConsole(`extraído: ${produto.nome} | ${produto.gvi}`);
    setProgress(atual, total, `${statusText} ${atual} de ${total}`);

    if (atual >= total) {
      pararJob();
      procCard.classList.remove("is-running");
      procState.textContent = "concluído";
      procDetail.textContent = `Fila pronta com ${total} produtos.`;
      addConsole(`base pronta: ${total} produtos na fila final`);
      if (download) {
        downloadTxt(arquivo, buildTxt(ultimaLista));
        addConsole(`arquivo gerado: ${arquivo}`);
        if (genHint) genHint.innerHTML = `Baixado: <b>${arquivo}</b> — ${total} produtos.`;
      }
    }
  }, 240);
}

const runProfiles = {
  sync: { nome: "Sincronizar cérebro", total: 30 },
  extract: { nome: "Extrair produtos do Mercado Livre", total: 40 },
  bling: { nome: "Localizar no Bling", total: 50, download: true },
};

/* ==========================================================================
   .TXT
   ========================================================================== */
function buildTxt(itens) {
  const L = [];
  L.push("========================================================");
  L.push("  FILA DE VIDEOS COM LOCALIZACAO - GU CAR REVOLUT");
  L.push("========================================================");
  L.push(`  Gerado em     : ${new Date().toLocaleString("pt-BR")}`);
  L.push(`  Total produtos: ${itens.length}`);
  L.push("========================================================");
  L.push("");
  itens.forEach((p) => {
    L.push(`${pad(p.indice, 3)} | ${p.nome}`);
    L.push(`      Codigo do anuncio : ${p.codigo}`);
    L.push(`      GVI / SKU         : ${p.gvi}`);
    L.push(`      Precisa de        : ${p.clip}`);
    L.push(`      Estoque Bling     : ${p.estoque} un`);
    L.push(`      Localizacao       : ${p.localizacao}`);
    L.push("--------------------------------------------------------");
  });
  L.push("");
  L.push(`Fim da fila - ${itens.length} produtos.`);
  return L.join("\r\n");
}
function downloadTxt(nome, conteudo) {
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function lerQuantidade() {
  let q = parseInt(genQty?.value, 10);
  if (!Number.isFinite(q)) q = 30;
  q = Math.max(1, Math.min(500, q));
  if (genQty) genQty.value = q;
  return q;
}
function gerarListaFinal() {
  const q = lerQuantidade();
  if (genHint) genHint.innerHTML = `Gerando <b>${q}</b> produtos…`;
  runExtraction({
    nome: `Gerar lista final (${q} produtos)`,
    statusText: "Extraindo produto",
    total: q,
    download: true,
  });
}

/* ==========================================================================
   MODULOS
   ========================================================================== */
const modulos = [
  { ico: "FX", nome: "Fluxo Completo", desc: "Clip + GVI + Bling", total: 24 },
  { ico: "ML", nome: "Links e GVI", desc: "lista completa de anúncios", total: 60 },
  { ico: "CL", nome: "Criar Clip", desc: "menu dos três pontinhos", total: 34 },
  { ico: "LK", nome: "Clip por Link", desc: "verifica links coletados", total: 28 },
  { ico: "ST", nome: "Estoque", desc: "depósito e variações", total: 40 },
  { ico: "BG", nome: "Bling Locator", desc: "GVI e localização", total: 50 },
  { ico: "IMG", nome: "Imagens", desc: "planilha + Mercado Livre", total: 24 },
];
function montarModulos() {
  moduleGrid.innerHTML = "";
  modulos.forEach((m) => {
    const el = document.createElement("div");
    el.className = "module";
    el.innerHTML =
      `<div class="module-ico">${m.ico}</div>` +
      `<strong>${m.nome}</strong>` +
      `<small>${m.desc}</small>` +
      `<span class="m-state">● ativo</span>`;
    el.addEventListener("click", () =>
      runExtraction({ nome: m.nome, statusText: "Processando", total: m.total })
    );
    moduleGrid.appendChild(el);
  });
}

/* ==========================================================================
   CANVAS NEURAL (fundo)
   ========================================================================== */
let nodes = [];
let W = 0;
let H = 0;
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  neuralCanvas.width = Math.floor(W * dpr);
  neuralCanvas.height = Math.floor(H * dpr);
  neuralCanvas.style.width = `${W}px`;
  neuralCanvas.style.height = `${H}px`;
  nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const alvo = Math.round((W * H) / 22000);
  nodes = Array.from({ length: Math.max(28, Math.min(90, alvo)) }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
  }));
}
function drawNeural() {
  nctx.clearRect(0, 0, W, H);
  for (const n of nodes) {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < 0 || n.x > W) n.vx *= -1;
    if (n.y < 0 || n.y > H) n.vy *= -1;
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.hypot(dx, dy);
      if (d < 130) {
        nctx.strokeStyle = `rgba(52, 226, 255, ${0.14 * (1 - d / 130)})`;
        nctx.lineWidth = 1;
        nctx.beginPath();
        nctx.moveTo(nodes[i].x, nodes[i].y);
        nctx.lineTo(nodes[j].x, nodes[j].y);
        nctx.stroke();
      }
    }
  }
  for (const n of nodes) {
    nctx.fillStyle = "rgba(155, 107, 255, 0.75)";
    nctx.beginPath();
    nctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
    nctx.fill();
  }
  requestAnimationFrame(drawNeural);
}

/* ==========================================================================
   RELOGIO + CONTADORES
   ========================================================================== */
function tickClock() {
  if (clockEl) clockEl.textContent = new Date().toLocaleTimeString("pt-BR");
}
function countUp(el) {
  const alvo = parseInt(el.dataset.count, 10) || 0;
  const dur = 1200;
  const t0 = performance.now();
  function frame(t) {
    const p = Math.min(1, (t - t0) / dur);
    const val = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
    el.textContent = val.toLocaleString("pt-BR");
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ==========================================================================
   BOOT
   ========================================================================== */
const bootMsgs = [
  "inicializando núcleo cognitivo…",
  "carregando índice sináptico…",
  "conectando neurônios de extração…",
  "sincronizando memória de produtos…",
  "núcleo pronto.",
];
function runBoot() {
  let i = 0;
  let pct = 0;
  const timer = setInterval(() => {
    pct = Math.min(100, pct + rand(9, 22));
    bootBar.style.width = `${pct}%`;
    const idx = Math.min(bootMsgs.length - 1, Math.floor((pct / 100) * bootMsgs.length));
    if (idx !== i) {
      i = idx;
      bootText.textContent = bootMsgs[idx];
    }
    if (pct >= 100) {
      clearInterval(timer);
      setTimeout(revelarApp, 450);
    }
  }, 320);
}
function revelarApp() {
  bootScreen.classList.add("is-gone");
  shell.hidden = false;
  document.querySelectorAll(".stat-value[data-count]").forEach(countUp);
  addConsole("núcleo cognitivo on-line");
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */
document.querySelectorAll("button[data-run]").forEach((b) => {
  b.addEventListener("click", () => {
    const p = runProfiles[b.dataset.run];
    if (p) runExtraction({ nome: p.nome, statusText: "Processando", total: p.total, download: Boolean(p.download) });
  });
});

document.querySelectorAll(".stepper[data-step]").forEach((b) => {
  b.addEventListener("click", () => {
    genQty.value = Math.max(1, Math.min(500, lerQuantidade() + Number(b.dataset.step)));
    marcarQuick();
  });
});

function marcarQuick() {
  const v = String(lerQuantidade());
  document.querySelectorAll(".gen-quick button[data-qty]").forEach((b) => {
    b.classList.toggle("is-on", b.dataset.qty === v);
  });
}
document.querySelectorAll(".gen-quick button[data-qty]").forEach((b) => {
  b.addEventListener("click", () => {
    genQty.value = b.dataset.qty;
    marcarQuick();
  });
});
if (genQty) genQty.addEventListener("input", marcarQuick);

if (genGo) genGo.addEventListener("click", gerarListaFinal);
if (genQty) genQty.addEventListener("keydown", (e) => { if (e.key === "Enter") gerarListaFinal(); });

window.addEventListener("resize", resizeCanvas);

/* ==========================================================================
   START
   ========================================================================== */
if (yearEl) yearEl.textContent = new Date().getFullYear();
montarModulos();
marcarQuick();
resizeCanvas();
drawNeural();
tickClock();
setInterval(tickClock, 1000);
runBoot();
