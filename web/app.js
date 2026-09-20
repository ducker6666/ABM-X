"use strict";

const Model = window.Paper1Model;
const state = {
  agents: [],
  t: 0,
  running: false,
  selected: 0,
  lastFrame: 0,
  accumulator: 0,
  history: [],
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

function config() {
  return {
    epsilon: numberValue("epsilon"),
    signalA: [numberValue("signalAx"), numberValue("signalAy")],
    signalB: [numberValue("signalBx"), numberValue("signalBy")],
    signalAWeight: numberValue("signalAWeight"),
    signalBWeight: numberValue("signalBWeight"),
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
  try {
    Model.validateConfig(config());
  } catch (error) {
    setStatus(`Configuración no válida: ${error.message}`);
    return;
  }
  state.t = 0;
  state.selected = 0;
  state.accumulator = 0;
  state.agents = Model.initialize(
    Math.round(numberValue("nAgents")),
    Math.round(numberValue("seed")),
    document.getElementById("scenario").value,
  );
  state.history = [];
  recordMetrics();
  setStatus("Preparado: la simulación está en t = 0.");
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
  state.agents = Model.step(state.agents, config());
  state.t += 1;
  recordMetrics();
}

function recordMetrics() {
  const summary = Model.summarize(state.agents, config(), clusterThreshold());
  state.history.push({ t: state.t, ...summary });
  if (state.history.length > 1200) state.history.shift();
}

function start() {
  state.running = true;
  setStatus("En ejecución. Todas las posiciones se actualizan de forma síncrona.");
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

  drawAxis(c);
  drawSignal(c.signalA, c.signalAWeight, "A", "#176b87", c.epsilon);
  drawSignal(c.signalB, c.signalBWeight, "B", "#c45134", c.epsilon);

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
  ctx.fillText(`JDJ exploratorio = ${latest.jdj.toFixed(3)}`, 106, 739);
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

function drawSignal(point, weight, label, color, epsilon) {
  const x = sx(point[0]);
  const y = sy(point[1]);
  ctx.save();
  ctx.fillStyle = color.replace(")", ", .06)").replace("rgb", "rgba");
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.24;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, epsilon * 696, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

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
  ctx.fillText(`Señal ${label} · peso ${weight}`, x + offset, y - 20);
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
    followerAStat: latest.followersA,
    followerBStat: latest.followersB,
    rmsdAStat: latest.rmsdA.toFixed(3),
    rmsdBStat: latest.rmsdB.toFixed(3),
  };
  for (const [id, value] of Object.entries(values)) document.getElementById(id).textContent = value;
}

function exportCsv() {
  const c = config();
  const rows = ["agent,x,y,projection_A_B"];
  state.agents.forEach((agent, index) => {
    rows.push(`${index + 1},${agent.x},${agent.y},${Model.axisProjection(agent, c)}`);
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `paper1_seed-${Math.round(numberValue("seed"))}_t-${state.t}.csv`;
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
