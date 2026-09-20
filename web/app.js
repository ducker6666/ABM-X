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
  events: [],
  eventCounter: 0,
  lastMeanMove: 0,
  lastAudit: false,
  activeEvents: 0,
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
  randomEvent: document.getElementById("randomEventBtn"),
  counterEvent: document.getElementById("counterEventBtn"),
  eventLog: document.getElementById("eventLog"),
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
    phase: "integrated",
    epsilon: numberValue("epsilon"),
    signalA: [numberValue("signalAx"), numberValue("signalAy")],
    signalB: [numberValue("signalBx"), numberValue("signalBy")],
    signalAWeight: numberValue("signalAWeight"),
    signalBWeight: numberValue("signalBWeight"),
    signalAReach: numberValue("signalAReach"),
    signalBReach: numberValue("signalBReach"),
    signalAPermanent: checkedValue("signalAPermanent"),
    signalBPermanent: checkedValue("signalBPermanent"),
    // Constantes heredadas solo para que el validador común siga siendo
    // compatible con las pruebas de los modelos de control retirados de la UI.
    compromiseRate: 0.08,
    interactionsPerAgent: 0.5,
    anchorWeight: 0.85,
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
  state.activeEvents = 0;
  state.events = [];
  state.eventCounter = 0;
  state.random = Model.mulberry32(seed + 104729);
  state.agents = Model.initialize(
    nAgents,
    seed,
    document.getElementById("scenario").value,
  );
  state.agents = Model.assignImmobility(state.agents, c.immobileShare, seed + 65537);
  state.network = Model.buildSmallWorldNetwork(nAgents, c.networkDegree, c.networkRewiring, seed + 7919);
  state.history = [];
  recordMetrics();
  updateEventLog();
  setStatus("Preparado: modelo integrado, t = 0.");
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
    events: state.events,
    t: state.t,
  });
  state.agents = result.agents;
  state.lastMeanMove = result.meanMove;
  state.lastAudit = result.auditorActive;
  state.activeEvents = result.activeEvents;
  state.t += 1;
  recordMetrics();
  updateEventLog();
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
  setStatus("En ejecución: actualización síncrona del modelo integrado.");
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
  const statusA = c.signalAPermanent ? "permanente" : (activeA > 0 ? "activo" : "apagado");
  const statusB = c.signalBPermanent ? "permanente" : (activeB > 0 ? "activo" : "apagado");
  drawSignal(c.signalA, activeA, "A", "#176b87", c.signalAReach, activeA > 0, statusA);
  drawSignal(c.signalB, activeB, "B", "#c45134", c.signalBReach, activeB > 0, statusB);
  drawEvents(c);

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

function drawSignal(point, weight, label, color, reach, active, status) {
  const x = sx(point[0]);
  const y = sy(point[1]);
  ctx.save();
  ctx.fillStyle = color.replace(")", ", .06)").replace("rgb", "rgba");
  ctx.strokeStyle = color;
  ctx.globalAlpha = active ? 0.24 : 0.06;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, reach * 696, 0, Math.PI * 2);
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
  ctx.fillText(`Polo ${label} · ${status} · intensidad ${weight.toFixed(2)}/10`, x + offset, y - 20);
  ctx.globalAlpha = 1;
}

function drawEvents(c) {
  for (const event of state.events) {
    const weight = Model.activeEventWeight(event, state.t, c.fatigueEnabled, c.fatigueDecay);
    const active = weight > 0;
    const x = sx(event.position[0]);
    const y = sy(event.position[1]);
    ctx.save();
    ctx.globalAlpha = active ? 0.22 : 0.06;
    ctx.fillStyle = event.kind === "counter" ? "#9b5f39" : "#6d4ba3";
    ctx.strokeStyle = event.kind === "counter" ? "#9b5f39" : "#6d4ba3";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, event.reach * 696, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.28;
    ctx.fillStyle = event.kind === "counter" ? "#9b5f39" : "#6d4ba3";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "700 11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(event.label, x, y + 4);
    ctx.fillStyle = "#2a2723";
    ctx.font = "600 12px system-ui";
    const offset = event.position[0] < 0.5 ? 82 : -82;
    const eventStatus = active ? "activo" : (state.t < event.start ? "pendiente" : "finalizado");
    ctx.fillText(`${event.kind === "counter" ? "Contraevento" : "Evento"} ${event.label} · ${eventStatus} · ${weight.toFixed(2)}/10`, x + offset, y + 28);
    ctx.restore();
  }
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
  chartFrame(followersCtx, canvas, "Coincidencias exactas con los polos", "Distancia ≤ 0.001; diagnóstico estricto");
  const max = Math.max(1, ...state.history.flatMap(row => [row.followersA, row.followersB]));
  drawSeries(followersCtx, state.history.map(row => row.followersA), canvas, "#176b87", 0, max);
  drawSeries(followersCtx, state.history.map(row => row.followersB), canvas, "#c45134", 0, max);
  followersCtx.font = "12px system-ui";
  followersCtx.fillStyle = "#176b87";
  followersCtx.fillText("— polo A", 56, canvas.height - 12);
  followersCtx.fillStyle = "#c45134";
  followersCtx.fillText("— polo B", 145, canvas.height - 12);
}

function updateStats() {
  const latest = state.history[state.history.length - 1];
  if (!latest) return;
  const values = {
    timeStat: state.t,
    eventStat: state.events.filter(event => Model.activeEventWeight(
      event, state.t, config().fatigueEnabled, config().fatigueDecay,
    ) > 0).length,
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

function addEvent(kind) {
  const intensity = numberValue("eventIntensity");
  const reach = numberValue("eventReach");
  const duration = Math.round(numberValue("eventDuration"));
  state.eventCounter += 1;
  const position = kind === "counter"
    ? [...config().signalB]
    : [state.random(), state.random()];
  const prefix = kind === "counter" ? "C" : "E";
  state.events.push({
    label: `${prefix}${state.eventCounter}`,
    kind,
    position,
    intensity,
    reach,
    start: state.t,
    duration,
  });
  updateEventLog();
  setStatus(`${kind === "counter" ? "Contraevento" : "Evento aleatorio"} añadido en t = ${state.t}.`);
  draw();
}

function updateEventLog() {
  if (state.events.length === 0) {
    elements.eventLog.textContent = "Todavía no se ha añadido ningún evento.";
    return;
  }
  const c = config();
  elements.eventLog.innerHTML = state.events.map(event => {
    const weight = Model.activeEventWeight(event, state.t, c.fatigueEnabled, c.fatigueDecay);
    const status = weight > 0 ? `activo · intensidad actual ${weight.toFixed(2)}/10` : (state.t < event.start ? "pendiente" : "finalizado");
    return `<div><strong>${event.label}</strong> · t=${event.start}–${event.start + event.duration - 1} · ${status}</div>`;
  }).join("");
}

function updateScheduleVisibility() {
  for (const pole of ["A", "B"]) {
    const permanent = checkedValue(`signal${pole}Permanent`);
    document.getElementById(`signal${pole}Schedule`).hidden = permanent;
  }
}

function exportCsv() {
  const c = config();
  const rows = ["agent,model,time,x,y,initial_x,initial_y,projection_A_B,immobile,auditor_active,active_events"];
  state.agents.forEach((agent, index) => {
    rows.push(`${index + 1},${c.phase},${state.t},${agent.x},${agent.y},${agent.anchorX},${agent.anchorY},${Model.axisProjection(agent, c)},${Boolean(agent.immobile)},${state.lastAudit},${state.activeEvents}`);
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
for (const input of document.querySelectorAll("[data-schedule-toggle]")) {
  input.addEventListener("change", updateScheduleVisibility);
}
for (const input of document.querySelectorAll("[data-redraw]")) {
  input.addEventListener("change", draw);
}

elements.start.addEventListener("click", start);
elements.pause.addEventListener("click", pause);
elements.step.addEventListener("click", () => { state.running = false; executeStep(); setStatus(`Paso manual completado: t = ${state.t}.`); draw(); });
elements.reset.addEventListener("click", resetModel);
elements.export.addEventListener("click", exportCsv);
elements.randomEvent.addEventListener("click", () => addEvent("random"));
elements.counterEvent.addEventListener("click", () => addEvent("counter"));
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
  draw();
});

updateControlOutputs();
updateScheduleVisibility();
resetModel();
requestAnimationFrame(animate);
