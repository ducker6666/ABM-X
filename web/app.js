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
  importedMemberships: null,
  importedFileName: "",
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
  addEventPair: document.getElementById("addEventPairBtn"),
  populationSource: document.getElementById("populationSource"),
  membershipCsv: document.getElementById("membershipCsv"),
  eventMode: document.getElementById("eventMode"),
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

function levelToUnit(id) {
  // Escala visible 0--10 -> distancia interna 0--1.
  return numberValue(id) / 10;
}

function levelToRate(id) {
  // Escala visible 0--10 -> paso maximo 0--0.10 por ronda.
  return numberValue(id) / 100;
}

function percentToUnit(id) {
  return numberValue(id) / 100;
}

function config() {
  return {
    phase: "integrated",
    epsilon: levelToUnit("epsilon"),
    // El contrato A/B fija los extremos: pertenencia completa a A o a B.
    signalA: [1, 0],
    signalB: [0, 1],
    signalAWeight: numberValue("signalAWeight"),
    signalBWeight: numberValue("signalBWeight"),
    signalAReach: levelToUnit("signalAReach"),
    signalBReach: levelToUnit("signalBReach"),
    signalAPermanent: true,
    signalBPermanent: true,
    // Constantes heredadas solo para que el validador común siga siendo
    // compatible con las pruebas de los modelos de control retirados de la UI.
    compromiseRate: 0.08,
    interactionsPerAgent: 0.5,
    anchorWeight: 0.85,
    networkDegree: numberValue("networkDegree"),
    networkRewiring: percentToUnit("networkRewiring"),
    signalAStart: 0,
    signalADuration: Number.MAX_SAFE_INTEGER,
    signalBStart: 0,
    signalBDuration: Number.MAX_SAFE_INTEGER,
    socialRate: levelToRate("socialRate"),
    homophilyScale: levelToUnit("homophilyScale"),
    reactanceEnabled: checkedValue("reactanceEnabled"),
    adaptiveCommitment: checkedValue("adaptiveCommitment"),
    commitmentStrength: numberValue("commitmentStrength"),
    auditorEnabled: checkedValue("auditorEnabled"),
    auditorThreshold: percentToUnit("auditorThreshold"),
    auditorMinDispersion: numberValue("auditorMinDispersion"),
    centerStrength: levelToRate("centerStrength"),
    noiseEnabled: checkedValue("noiseEnabled"),
    noiseProbability: percentToUnit("noiseProbability"),
    noiseRadius: levelToUnit("noiseRadius"),
    immobileShare: percentToUnit("immobileShare"),
    fatigueEnabled: checkedValue("fatigueEnabled"),
    fatigueDecay: percentToUnit("fatigueDecay"),
  };
}

function clusterThreshold() {
  return levelToUnit("clusterThreshold");
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
  const useCsv = elements.populationSource.value === "csv";
  if (useCsv && !state.importedMemberships) {
    setStatus("Selecciona un CSV con columnas A y B para iniciar.");
    return;
  }
  const nAgents = useCsv ? state.importedMemberships.length : Math.round(numberValue("nAgents"));
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
  state.agents = useCsv
    ? Model.initializeFromMemberships(state.importedMemberships)
    : Model.initialize(nAgents, seed, document.getElementById("scenario").value);
  state.agents = Model.assignImmobility(state.agents, c.immobileShare, seed + 65537);
  state.network = Model.buildSmallWorldNetwork(nAgents, c.networkDegree, c.networkRewiring, seed + 7919);
  state.history = [];
  recordMetrics();
  updateEventLog();
  setStatus(useCsv
    ? `Preparado: ${nAgents} agentes importados de ${state.importedFileName}.`
    : "Preparado: población A/B sintética, t = 0.");
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
  ctx.fillText("Grado de pertenencia A", 420, 816);
  ctx.save();
  ctx.translate(22, 420);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Grado de pertenencia B", 0, 0);
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
  metricsCtx.fillText("— JDJ proyectado* (0–1)", 56, canvas.height - 12);
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
  // Se muestra el mismo numerador usado por el motor, no una explicación
  // aproximada: JDJ = clip(2 * suma(h_ij) / N², 0, 1).
  const pairSum = latest.jdjPairSum.toFixed(2);
  const totalPairs = latest.jdjTotalPairs.toLocaleString("es-ES");
  document.getElementById("jdjFormulaStat").textContent = `2×${pairSum}/${totalPairs}`;
  document.getElementById("jdjLiveFormula").textContent = `2 × ${pairSum} ÷ ${totalPairs} = ${latest.jdj.toFixed(4)}`;
}

function randomEventSpecification() {
  const maximum = Math.round(numberValue("maxSteps"));
  if (state.t >= maximum) throw new Error("La simulación ya alcanzó su duración máxima");
  const start = state.t + Math.floor(state.random() * (maximum - state.t));
  const remaining = maximum - start;
  return {
    position: [state.random(), state.random()],
    start,
    intensity: 0.5 + Math.floor(state.random() * 20) / 2,
    reach: (0.5 + Math.floor(state.random() * 20) / 2) / 10,
    duration: 1 + Math.floor(state.random() * remaining),
  };
}

function manualEventSpecification() {
  const position = [numberValue("eventX"), numberValue("eventY")];
  Model.oppositePosition(position); // valida el cuadrado [0,1]^2
  const start = Math.round(numberValue("eventStart"));
  const intensity = numberValue("eventIntensity");
  const reach = levelToUnit("eventReach");
  const duration = Math.round(numberValue("eventDuration"));
  const maximum = Math.round(numberValue("maxSteps"));
  if (![start, intensity, reach, duration].every(Number.isFinite)
      || start < 0 || start >= maximum || duration < 1
      || intensity < 0 || intensity > 10 || reach <= 0 || reach > 1) {
    throw new Error("Revisa inicio, duración, intensidad y área del evento");
  }
  return { position, start, intensity, reach, duration };
}

function addEventPair() {
  let specification;
  try {
    specification = elements.eventMode.value === "random"
      ? randomEventSpecification()
      : manualEventSpecification();
  } catch (error) {
    setStatus(`Evento no válido: ${error.message}`);
    return;
  }
  state.eventCounter += 1;
  const counterPosition = Model.oppositePosition(specification.position);
  state.events.push(
    { label: `E${state.eventCounter}`, kind: "event", ...specification },
    { label: `C${state.eventCounter}`, kind: "counter", ...specification, position: counterPosition },
  );
  updateEventLog();
  const mode = elements.eventMode.value === "random" ? "aleatorio reproducible" : "manual";
  setStatus(`Par ${state.eventCounter} añadido en modo ${mode}; el contraevento está exactamente enfrente.`);
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
    const point = `(${event.position[0].toFixed(2)}, ${event.position[1].toFixed(2)})`;
    return `<div><strong>${event.label}</strong> · posición ${point} · t=${event.start}–${event.start + event.duration - 1} · I=${event.intensity.toFixed(1)}/10 · área=${(event.reach * 10).toFixed(1)}/10 · ${status}</div>`;
  }).join("");
}

function updatePopulationVisibility() {
  const useCsv = elements.populationSource.value === "csv";
  document.getElementById("syntheticPopulationFields").hidden = useCsv;
  document.getElementById("csvPopulationFields").hidden = !useCsv;
}

function updateEventModeVisibility() {
  const manual = elements.eventMode.value === "manual";
  document.getElementById("manualEventFields").hidden = !manual;
  document.getElementById("randomEventFields").hidden = manual;
}

async function loadMembershipCsv() {
  const file = elements.membershipCsv.files[0];
  if (!file) return;
  try {
    const rows = Model.parseMembershipCsv(await file.text());
    if (rows.length <= numberValue("networkDegree")) {
      throw new Error("el archivo necesita más filas que el número de contactos de la red");
    }
    state.importedMemberships = rows;
    state.importedFileName = file.name;
    document.getElementById("csvStatus").textContent = `${rows.length} filas válidas. Se usará (x,y)=(A,B) sin alterar los valores.`;
    resetModel();
  } catch (error) {
    state.importedMemberships = null;
    state.importedFileName = "";
    document.getElementById("csvStatus").textContent = `No se pudo cargar: ${error.message}`;
    setStatus(`CSV no válido: ${error.message}`);
  }
}

function exportCsv() {
  const c = config();
  const rows = ["agent,source_id,model,time,A,B,initial_A,initial_B,distance_to_A,distance_to_B,projection_A_B,immobile,auditor_active,active_events"];
  state.agents.forEach((agent, index) => {
    const sourceId = String(agent.sourceId ?? "").replaceAll('"', '""');
    const distanceA = Model.distance([agent.x, agent.y], c.signalA);
    const distanceB = Model.distance([agent.x, agent.y], c.signalB);
    rows.push(`${index + 1},"${sourceId}",${c.phase},${state.t},${agent.x},${agent.y},${agent.anchorX},${agent.anchorY},${distanceA},${distanceB},${Model.axisProjection(agent, c)},${Boolean(agent.immobile)},${state.lastAudit},${state.activeEvents}`);
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
elements.addEventPair.addEventListener("click", addEventPair);
elements.populationSource.addEventListener("change", () => { updatePopulationVisibility(); resetModel(); });
elements.membershipCsv.addEventListener("change", loadMembershipCsv);
elements.eventMode.addEventListener("change", updateEventModeVisibility);
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
updatePopulationVisibility();
updateEventModeVisibility();
resetModel();
requestAnimationFrame(animate);
