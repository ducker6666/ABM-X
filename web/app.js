"use strict";

const Model = window.ABMXModel;
const state = {
  agents: [],
  t: 0,
  running: false,
  selected: 0,
  lastFrame: 0,
  accumulator: 0,
  history: [],
  random: null,
  network: null,
  lastMeanMove: 0,
  lastAudit: false,
};

const MODEL_INFO = {
  integrated: {
    label: "MODELO INTEGRADO",
    title: "Influencia social, señales y control auditable",
    description: "Los contactos, polos, compromiso, ruido y auditor pueden actuar a la vez; cada término se calcula por separado.",
    badges: ["Red social", "Grupos con masa", "Reactancia", "Auditor visible"],
    readingTitle: "“Gravedad” significa influencia agregada, no física.",
    readingText: "Un grupo grande pesa más porque contiene más voces. El tamaño del anillo muestra cuántas personas hay; no se aplica una ley de gravitación.",
  },
  hk: {
    label: "CONTROL HK",
    title: "HK: promedio simultáneo de toda la vecindad",
    description: "Es el control teórico. Puede producir un único punto porque todos los agentes conectados calculan exactamente el mismo promedio.",
    badges: ["Euclídea", "Síncrona", "Todos los cercanos", "Sin anclaje"],
    readingTitle: "Que aparezca un solo punto no es un error de dibujo.",
    readingText: "En HK, varios agentes pueden ocupar exactamente la misma coordenada. El lienzo superpone sus círculos y parecen uno solo.",
  },
  dw: {
    label: "DEFFUANT–WEISBUCH",
    title: "Deffuant–Weisbuch: encuentros parciales y aleatorios",
    description: "Solo una muestra de parejas se encuentra por ronda y cada contacto recorre una fracción μ de la distancia.",
    badges: ["Euclídea", "Parejas", "Compromiso parcial", "Estocástica"],
    readingTitle: "La velocidad ahora tiene una interpretación explícita.",
    readingText: "μ controla cuánto cambia una persona por encuentro y el número de contactos controla cuántas oportunidades de cambio hay por ronda.",
  },
  fj: {
    label: "FRIEDKIN–JOHNSEN",
    title: "Friedkin–Johnsen: memoria de la opinión inicial",
    description: "Cada agente conserva el peso g de su posición inicial y asigna 1−g al promedio social aceptado.",
    badges: ["Euclídea", "Síncrona", "Todos los cercanos", "Con anclaje"],
    readingTitle: "El desacuerdo puede persistir sin añadir ruido.",
    readingText: "Las anclas iniciales diferentes impiden que el consenso exacto sea automático. La combinación con confianza acotada está declarada como adaptación.",
  },
  network: {
    label: "FJ SOBRE RED",
    title: "Anclaje inicial sobre una red social",
    description: "Cada punto escucha únicamente a contactos conectados y cercanos en opinión. Esta es la vista predeterminada más lenta.",
    badges: ["Euclídea", "Síncrona", "Red sintética", "Con anclaje"],
    readingTitle: "La red limita quién puede influir.",
    readingText: "El anclaje conserva parte de la opinión inicial. Los clusters, el color y el JDJ solo describen: no empujan a nadie.",
  },
  temporal: {
    label: "RED Y SEÑALES TEMPORALES",
    title: "Red y señales activas en intervalos observables",
    description: "La red y el anclaje se mantienen; cada señal se enciende y apaga en el intervalo declarado.",
    badges: ["Euclídea", "Red sintética", "Con anclaje", "Señales temporales"],
    readingTitle: "La señal no decae mediante una curva inventada.",
    readingText: "Su intensidad es constante mientras está activa y cero fuera del intervalo. Los tiempos deberán vincularse a eventos reales en una aplicación empírica.",
  },
};

const elements = {
  mainCanvas: document.getElementById("mainCanvas"),
  metricsCanvas: document.getElementById("metricsCanvas"),
  followersCanvas: document.getElementById("followersCanvas"),
  start: document.getElementById("startBtn"),
  pause: document.getElementById("pauseBtn"),
  step: document.getElementById("stepBtn"),
  reset: document.getElementById("resetBtn"),
  export: document.getElementById("exportBtn"),
  status: document.getElementById("runStatus"),
};

const ctx = elements.mainCanvas.getContext("2d");
const metricsCtx = elements.metricsCanvas.getContext("2d");
const followersCtx = elements.followersCanvas.getContext("2d");

function numberValue(id) {
  return Number(document.getElementById(id).value);
}

function checkedValue(id) {
  return document.getElementById(id).checked;
}

function config() {
  return {
    phase: document.getElementById("phase").value,
    epsilon: numberValue("epsilon"),
    signalA: [numberValue("signalAx"), numberValue("signalAy")],
    signalB: [numberValue("signalBx"), numberValue("signalBy")],
    signalAWeight: numberValue("signalAWeight"),
    signalBWeight: numberValue("signalBWeight"),
    compromiseRate: numberValue("compromiseRate"),
    interactionsPerAgent: numberValue("interactionsPerAgent"),
    anchorWeight: numberValue("anchorWeight"),
    networkDegree: numberValue("networkDegree"),
    networkRewiring: numberValue("networkRewiring"),
    signalAStart: numberValue("signalAStart"),
    signalADuration: numberValue("signalADuration"),
    signalBStart: numberValue("signalBStart"),
    signalBDuration: numberValue("signalBDuration"),
    socialRate: numberValue("socialRate"),
    homophilyScale: numberValue("homophilyScale"),
    reactanceEnabled: checkedValue("reactanceEnabled"),
    adaptiveCommitment: checkedValue("adaptiveCommitment"),
    commitmentStrength: numberValue("commitmentStrength"),
    auditorEnabled: checkedValue("auditorEnabled"),
    auditorThreshold: numberValue("auditorThreshold"),
    auditorMinDispersion: numberValue("auditorMinDispersion"),
    centerStrength: numberValue("centerStrength"),
    noiseEnabled: checkedValue("noiseEnabled"),
    noiseProbability: numberValue("noiseProbability"),
    noiseRadius: numberValue("noiseRadius"),
    immobileShare: numberValue("immobileShare"),
    fatigueEnabled: checkedValue("fatigueEnabled"),
    fatigueDecay: numberValue("fatigueDecay"),
  };
}

function clusterThreshold() {
  return numberValue("clusterThreshold");
}

function updateControlOutputs() {
  for (const input of document.querySelectorAll("input[type=range]")) {
    const output = document.querySelector(`[data-output-for="${input.id}"]`);
    if (!output) continue;
    const decimals = input.step.includes(".") ? Math.max(1, input.step.split(".")[1].length) : 0;
    output.textContent = Number(input.value).toFixed(decimals);
  }
}

function resetModel() {
  state.running = false;
  const c = config();
  const nAgents = Math.round(numberValue("nAgents"));
  const seed = Math.round(numberValue("seed"));
  try {
    Model.validatePhasedConfig(c, nAgents);
  } catch (error) {
    setStatus(`Configuración no válida: ${error.message}`);
    return;
  }
  state.t = 0;
  state.selected = 0;
  state.accumulator = 0;
  state.lastMeanMove = 0;
  state.lastAudit = false;
  state.random = Model.mulberry32(seed + 104729);
  state.agents = Model.initialize(
    nAgents,
    seed,
    document.getElementById("scenario").value,
  );
  state.agents = Model.assignImmobility(state.agents, c.phase === "integrated" ? c.immobileShare : 0, seed + 65537);
  state.network = ["integrated", "network", "temporal"].includes(c.phase)
    ? Model.buildSmallWorldNetwork(nAgents, c.networkDegree, c.networkRewiring, seed + 7919)
    : null;
  state.history = [];
  recordMetrics();
  updateModelCopy();
  setStatus(`Preparado: ${MODEL_INFO[c.phase].label.toLowerCase()}, t = 0.`);
  draw();
}

function setStatus(message) {
  elements.status.textContent = message;
  elements.start.disabled = state.running;
  elements.pause.disabled = !state.running;
}

function executeStep() {
  if (state.t >= Math.round(numberValue("maxSteps"))) {
    state.running = false;
    setStatus("Finalizado: se alcanzó el número máximo de iteraciones.");
    return;
  }
  const result = Model.advance(state.agents, config(), {
    random: state.random,
    network: state.network,
    t: state.t,
  });
  state.agents = result.agents;
  state.lastMeanMove = result.meanMove;
  state.lastAudit = result.auditorActive;
  state.t += 1;
  recordMetrics();
}

function recordMetrics() {
  const summary = Model.summarize(state.agents, config(), clusterThreshold());
  state.history.push({
    t: state.t,
    ...summary,
    meanMove: state.lastMeanMove,
    uniqueOpinions: Model.uniqueOpinionCount(state.agents),
  });
  if (state.history.length > 1200) state.history.shift();
}

function start() {
  state.running = true;
  const phase = config().phase;
  const timing = phase === "dw" ? "encuentros aleatorios parciales" : "actualización síncrona";
  setStatus(`En ejecución: ${MODEL_INFO[phase].label.toLowerCase()}, ${timing}.`);
}

function updateModelCopy() {
  const info = MODEL_INFO[config().phase];
  document.getElementById("modelLabel").textContent = info.label;
  document.getElementById("phaseTitle").textContent = info.title;
  document.getElementById("phaseDescription").textContent = info.description;
  document.getElementById("readingTitle").textContent = info.readingTitle;
  document.getElementById("readingText").textContent = info.readingText;
  document.getElementById("scopeBadges").innerHTML = info.badges.map(text => `<span>${text}</span>`).join("");
}

function pause() {
  state.running = false;
  setStatus(`Pausado en t = ${state.t}.`);
}

function animate(timestamp) {
  if (state.running) {
    const speed = numberValue("speed");
    const interval = 1000 / speed;
    state.accumulator += Math.min(100, timestamp - state.lastFrame);
    let safety = 0;
    while (state.accumulator >= interval && state.running && safety < 20) {
      executeStep();
      state.accumulator -= interval;
      safety += 1;
    }
    draw();
  }
  state.lastFrame = timestamp;
  requestAnimationFrame(animate);
}

function sx(x) { return 72 + x * 696; }
function sy(y) { return 768 - y * 696; }

function draw() {
  drawOpinionSpace();
  drawMetricHistory();
  drawFollowerHistory();
  updateStats();
}

function drawOpinionSpace() {
  const c = config();
  ctx.clearRect(0, 0, 840, 840);
  ctx.fillStyle = "#fbfaf7";
  ctx.fillRect(0, 0, 840, 840);

  ctx.strokeStyle = "#e5e0d7";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const p = 72 + i * 69.6;
    ctx.beginPath();
    ctx.moveTo(p, 72); ctx.lineTo(p, 768);
    ctx.moveTo(72, p); ctx.lineTo(768, p);
    ctx.stroke();
  }
  ctx.strokeStyle = "#2b2925";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(72, 72, 696, 696);

  ctx.fillStyle = "#4c4841";
  ctx.font = "16px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Dimensión actitudinal 1", 420, 816);
  ctx.save();
  ctx.translate(22, 420);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Dimensión actitudinal 2", 0, 0);
  ctx.restore();

  drawSelectedNetwork();
  drawAxis(c);
  const [activeA, activeB] = Model.signalWeights(c, state.t);
  drawSignal(c.signalA, activeA, "A", "#176b87", c.epsilon, activeA > 0);
  drawSignal(c.signalB, activeB, "B", "#c45134", c.epsilon, activeB > 0);

  if (document.getElementById("showTrails").checked) {
    ctx.strokeStyle = "rgba(43,41,37,.22)";
    ctx.lineWidth = 1;
    for (const agent of state.agents) {
      ctx.beginPath();
      ctx.moveTo(sx(agent.previousX), sy(agent.previousY));
      ctx.lineTo(sx(agent.x), sy(agent.y));
      ctx.stroke();
    }
  }

  drawClusterMasses();

  for (const agent of state.agents) {
    const score = Model.axisProjection(agent, c);
    ctx.fillStyle = mixColor([23, 107, 135], [196, 81, 52], score, 0.76);
    ctx.strokeStyle = "rgba(32,30,27,.62)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(sx(agent.x), sy(agent.y), 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const selected = state.agents[state.selected];
  if (selected && document.getElementById("showNeighborhood").checked) {
    ctx.strokeStyle = "rgba(24,22,20,.78)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(sx(selected.x), sy(selected.y), c.epsilon * 696, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(sx(selected.x), sy(selected.y), 6.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const latest = state.history[state.history.length - 1];
  ctx.fillStyle = "rgba(255,255,255,.88)";
  ctx.strokeStyle = "#cfc8bd";
  ctx.lineWidth = 1;
  roundRect(ctx, 89, 660, 258, 88, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#27231f";
  ctx.textAlign = "left";
  ctx.font = "600 17px system-ui";
  ctx.fillText(`t = ${state.t}`, 106, 689);
  ctx.font = "14px system-ui";
  ctx.fillText(`clusters = ${latest.clusters}  ·  dispersión = ${latest.dispersion.toFixed(3)}`, 106, 716);
  ctx.fillText(`movimiento medio = ${latest.meanMove.toFixed(4)}`, 106, 739);
}

function drawSelectedNetwork() {
  if (!state.network || !document.getElementById("showNeighborhood").checked) return;
  const selected = state.agents[state.selected];
  if (!selected) return;
  ctx.save();
  ctx.strokeStyle = "rgba(49, 93, 105, .26)";
  ctx.lineWidth = 1.4;
  for (const neighborIndex of state.network[state.selected]) {
    const neighbor = state.agents[neighborIndex];
    ctx.beginPath();
    ctx.moveTo(sx(selected.x), sy(selected.y));
    ctx.lineTo(sx(neighbor.x), sy(neighbor.y));
    ctx.stroke();
  }
  ctx.restore();
}

function drawClusterMasses() {
  if (!document.getElementById("showClusterMass").checked) return;
  const groups = Model.connectedComponents(state.agents, clusterThreshold()).slice(0, 12);
  ctx.save();
  ctx.textAlign = "center";
  for (const group of groups) {
    if (group.length < 2) continue;
    const centerX = group.reduce((sum, index) => sum + state.agents[index].x, 0) / group.length;
    const centerY = group.reduce((sum, index) => sum + state.agents[index].y, 0) / group.length;
    const radius = Math.min(34, 7 + 1.8 * Math.sqrt(group.length));
    ctx.fillStyle = "rgba(71, 93, 98, .07)";
    ctx.strokeStyle = "rgba(47, 75, 82, .34)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx(centerX), sy(centerY), radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(35, 55, 59, .78)";
    ctx.font = "700 10px system-ui";
    ctx.fillText(`n=${group.length}`, sx(centerX), sy(centerY) - radius - 4);
  }
  ctx.restore();
}

function drawAxis(c) {
  ctx.save();
  ctx.strokeStyle = "rgba(55,51,46,.48)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.moveTo(sx(c.signalA[0]), sy(c.signalA[1]));
  ctx.lineTo(sx(c.signalB[0]), sy(c.signalB[1]));
  ctx.stroke();
  ctx.restore();
}

function drawSignal(point, weight, label, color, epsilon, active) {
  const x = sx(point[0]);
  const y = sy(point[1]);
  ctx.save();
  ctx.fillStyle = color.replace(")", ", .06)").replace("rgb", "rgba");
  ctx.strokeStyle = color;
  ctx.globalAlpha = active ? 0.24 : 0.06;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, epsilon * 696, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.globalAlpha = active ? 1 : 0.28;
  ctx.fillStyle = color;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.font = "700 14px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 5);
  ctx.fillStyle = "#2a2723";
  ctx.font = "600 13px system-ui";
  const offset = point[0] < 0.5 ? 70 : -70;
  const timed = ["integrated", "temporal"].includes(config().phase);
  const temporalState = timed ? (active ? "activa" : "apagada") : "constante";
  ctx.fillText(`Señal ${label} · ${temporalState} · peso ${weight.toFixed(2)}`, x + offset, y - 20);
  ctx.globalAlpha = 1;
}

function mixColor(first, second, ratio, alpha) {
  const rgb = first.map((value, index) => Math.round(value + (second[index] - value) * ratio));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function chartFrame(context, canvas, title, yLabel) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#2a2723";
  context.font = "600 16px system-ui";
  context.textAlign = "left";
  context.fillText(title, 18, 25);
  context.font = "12px system-ui";
  context.fillStyle = "#746e65";
  context.fillText(yLabel, 18, 45);
  context.strokeStyle = "#ded9d0";
  context.strokeRect(48, 58, canvas.width - 68, canvas.height - 88);
}

function drawSeries(context, values, canvas, color, min, max) {
  if (values.length < 2) return;
  const width = canvas.width - 68;
  const height = canvas.height - 88;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  values.forEach((value, index) => {
    const x = 48 + (index / (values.length - 1)) * width;
    const y = 58 + (1 - (value - min) / Math.max(max - min, 1e-12)) * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
}

function drawMetricHistory() {
  const canvas = elements.metricsCanvas;
  chartFrame(metricsCtx, canvas, "Medidas de salida", "No intervienen en la dinámica");
  drawSeries(metricsCtx, state.history.map(row => row.jdj), canvas, "#6d4ba3", 0, 1);
  drawSeries(metricsCtx, state.history.map(row => row.dispersion), canvas, "#1b7f79", 0, 0.5);
  metricsCtx.font = "12px system-ui";
  metricsCtx.fillStyle = "#6d4ba3";
  metricsCtx.fillText("— JDJ eje A–B (0–1)", 56, canvas.height - 12);
  metricsCtx.fillStyle = "#1b7f79";
  metricsCtx.fillText("— dispersión (0–0.5)", 220, canvas.height - 12);
}

function drawFollowerHistory() {
  const canvas = elements.followersCanvas;
  chartFrame(followersCtx, canvas, "Seguidores exactos de las señales", "Distancia ≤ 0.001, criterio publicado");
  const max = Math.max(1, ...state.history.flatMap(row => [row.followersA, row.followersB]));
  drawSeries(followersCtx, state.history.map(row => row.followersA), canvas, "#176b87", 0, max);
  drawSeries(followersCtx, state.history.map(row => row.followersB), canvas, "#c45134", 0, max);
  followersCtx.font = "12px system-ui";
  followersCtx.fillStyle = "#176b87";
  followersCtx.fillText("— señal A", 56, canvas.height - 12);
  followersCtx.fillStyle = "#c45134";
  followersCtx.fillText("— señal B", 145, canvas.height - 12);
}

function updateStats() {
  const latest = state.history[state.history.length - 1];
  if (!latest) return;
  const values = {
    timeStat: state.t,
    clusterStat: latest.clusters,
    dispersionStat: latest.dispersion.toFixed(4),
    jdjStat: latest.jdj.toFixed(4),
    auditStat: state.lastAudit ? "activo" : "inactivo",
    followerAStat: latest.followersA,
    followerBStat: latest.followersB,
    rmsdAStat: latest.rmsdA.toFixed(3),
    rmsdBStat: latest.rmsdB.toFixed(3),
    movementStat: latest.meanMove.toFixed(5),
    uniqueStat: latest.uniqueOpinions,
  };
  for (const [id, value] of Object.entries(values)) document.getElementById(id).textContent = value;
}

function exportCsv() {
  const c = config();
  const rows = ["agent,model,time,x,y,initial_x,initial_y,projection_A_B,immobile,auditor_active"];
  state.agents.forEach((agent, index) => {
    rows.push(`${index + 1},${c.phase},${state.t},${agent.x},${agent.y},${agent.anchorX},${agent.anchorY},${Model.axisProjection(agent, c)},${Boolean(agent.immobile)},${state.lastAudit}`);
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `abmx_${c.phase}_seed-${Math.round(numberValue("seed"))}_t-${state.t}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

for (const input of document.querySelectorAll("input[type=range]")) {
  input.addEventListener("input", updateControlOutputs);
}
for (const input of document.querySelectorAll("[data-reset-model]")) {
  input.addEventListener("change", resetModel);
}
for (const input of document.querySelectorAll("[data-redraw]")) {
  input.addEventListener("change", draw);
}

elements.start.addEventListener("click", start);
elements.pause.addEventListener("click", pause);
elements.step.addEventListener("click", () => { state.running = false; executeStep(); setStatus(`Paso manual completado: t = ${state.t}.`); draw(); });
elements.reset.addEventListener("click", resetModel);
elements.export.addEventListener("click", exportCsv);
elements.mainCanvas.addEventListener("click", event => {
  const rect = elements.mainCanvas.getBoundingClientRect();
  const clickX = (event.clientX - rect.left) * elements.mainCanvas.width / rect.width;
  const clickY = (event.clientY - rect.top) * elements.mainCanvas.height / rect.height;
  let best = 0;
  let bestDistance = Infinity;
  state.agents.forEach((agent, index) => {
    const d = Math.hypot(sx(agent.x) - clickX, sy(agent.y) - clickY);
    if (d < bestDistance) { bestDistance = d; best = index; }
  });
  state.selected = best;
  document.getElementById("selectedAgentLabel").textContent = String(best + 1);
  draw();
});

updateControlOutputs();
resetModel();
requestAnimationFrame(animate);
