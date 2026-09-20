/* Control y representación del simulador. La dinámica vive en model.js. */
"use strict";

const M = window.Phase1Model;
const $ = (selector) => document.querySelector(selector);

const elements = {
  agents: $("#agents"),
  epsilon: $("#epsilon"),
  epsilonValue: $("#epsilon-value"),
  steps: $("#steps"),
  seed: $("#seed"),
  scenario: $("#scenario"),
  initialize: $("#initialize"),
  start: $("#start"),
  pause: $("#pause"),
  step: $("#step"),
  reset: $("#reset"),
  export: $("#export"),
  status: $("#status"),
  populationCanvas: $("#population-chart"),
  historyCanvas: $("#history-chart"),
  tableBody: $("#history-table tbody"),
};

let config;
let initialOpinions = [];
let opinions = [];
let history = [];
let metrics = [];
let timer = null;
let dirty = false;

function readConfig() {
  const next = {
    nAgents: Number(elements.agents.value),
    epsilon: Number(elements.epsilon.value),
    maxSteps: Number(elements.steps.value),
    seed: Number(elements.seed.value),
    scenario: elements.scenario.value,
    clusterThreshold: 0.05,
  };
  M.validateConfig(next);
  return next;
}

function setStatus(message, kind = "neutral") {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind;
}

function stopTimer() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  elements.start.disabled = false;
  elements.pause.disabled = true;
}

function initialize() {
  stopTimer();
  try {
    config = readConfig();
    dirty = false;
    initialOpinions = M.initializeOpinions(config);
    opinions = initialOpinions.slice();
    history = [opinions.slice()];
    metrics = [M.summarize(opinions, 0, 0, config.clusterThreshold)];
    setStatus("Estado inicial reproducible creado.", "ok");
    render();
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function advance() {
  if (!config) initialize();
  const last = metrics.at(-1);
  if (last.time >= config.maxSteps) {
    stopTimer();
    setStatus("Se alcanzó el máximo de pasos.", "ok");
    return;
  }

  const result = M.step(opinions, config.epsilon);
  opinions = result.opinions;
  const nextTime = last.time + 1;
  history.push(opinions.slice());
  metrics.push(M.summarize(opinions, nextTime, result.maxDisplacement, config.clusterThreshold));
  render();

  if (result.maxDisplacement <= 1e-10) {
    stopTimer();
    setStatus(`Convergencia numérica alcanzada en t=${nextTime}.`, "ok");
  } else {
    setStatus(`Simulación en t=${nextTime}.`, "neutral");
  }
}

function start() {
  if (timer !== null) return;
  if (dirty) initialize();
  elements.start.disabled = true;
  elements.pause.disabled = false;
  timer = window.setInterval(advance, 90);
}

function reset() {
  stopTimer();
  if (dirty) return initialize();
  if (!initialOpinions.length) return initialize();
  opinions = initialOpinions.slice();
  history = [opinions.slice()];
  metrics = [M.summarize(opinions, 0, 0, config.clusterThreshold)];
  setStatus("Vuelta al estado inicial; la semilla no ha cambiado.", "ok");
  render();
}

function resizeCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(220, Math.floor(rect.height));
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height };
}

function canvasTheme() {
  const style = getComputedStyle(document.documentElement);
  return {
    ink: style.getPropertyValue("--ink").trim(),
    muted: style.getPropertyValue("--muted").trim(),
    line: style.getPropertyValue("--line").trim(),
    accent: style.getPropertyValue("--accent").trim(),
    second: style.getPropertyValue("--second").trim(),
    paper: style.getPropertyValue("--paper").trim(),
  };
}

function drawAxes(context, width, height, xLabel) {
  const theme = canvasTheme();
  context.clearRect(0, 0, width, height);
  context.fillStyle = theme.paper;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = theme.line;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(44, height - 36);
  context.lineTo(width - 18, height - 36);
  context.stroke();
  context.fillStyle = theme.muted;
  context.font = "12px system-ui";
  context.fillText("0", 40, height - 16);
  context.fillText("1", width - 22, height - 16);
  context.fillText(xLabel, width / 2 - 36, height - 16);
}

function drawPopulation() {
  const { context, width, height } = resizeCanvas(elements.populationCanvas);
  const theme = canvasTheme();
  drawAxes(context, width, height, "opinión x");
  const usable = width - 62;

  opinions.forEach((value, index) => {
    const x = 44 + value * usable;
    const row = index % 9;
    const y = height - 54 - row * 17;
    context.beginPath();
    context.arc(x, y, 4.2, 0, Math.PI * 2);
    context.fillStyle = value < 0.5 ? theme.accent : theme.second;
    context.globalAlpha = 0.76;
    context.fill();
  });
  context.globalAlpha = 1;
}

function drawHistory() {
  const { context, width, height } = resizeCanvas(elements.historyCanvas);
  const theme = canvasTheme();
  context.clearRect(0, 0, width, height);
  context.fillStyle = theme.paper;
  context.fillRect(0, 0, width, height);

  const left = 44;
  const right = width - 18;
  const top = 20;
  const bottom = height - 36;
  context.strokeStyle = theme.line;
  context.strokeRect(left, top, right - left, bottom - top);

  const lastTime = Math.max(1, metrics.at(-1).time);
  function plot(key, color) {
    context.beginPath();
    metrics.forEach((row, index) => {
      const x = left + (row.time / lastTime) * (right - left);
      const y = bottom - row[key] * (bottom - top);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.strokeStyle = color;
    context.lineWidth = 2.2;
    context.stroke();
  }
  plot("jdj_product_normalized", theme.accent);
  plot("normalized_variance", theme.second);
  context.font = "12px system-ui";
  context.fillStyle = theme.accent;
  context.fillText("JDJ producto normalizado", left + 8, top + 16);
  context.fillStyle = theme.second;
  context.fillText("Varianza normalizada", left + 8, top + 33);
  context.fillStyle = theme.muted;
  context.fillText("tiempo", width / 2 - 18, height - 12);
}

function updateCards() {
  const current = metrics.at(-1);
  document.querySelectorAll("[data-metric]").forEach((node) => {
    const key = node.dataset.metric;
    const value = current[key];
      node.textContent = Number.isInteger(value) ? String(value) : Number(value).toFixed(4);
  });
  $("#epsilon-card").textContent = config.epsilon.toFixed(4);
}

function updateTable() {
  const selected = metrics.length <= 8
    ? metrics
    : [metrics[0], ...metrics.slice(-7)];
  elements.tableBody.replaceChildren(...selected.map((row) => {
    const tr = document.createElement("tr");
    ["time", "mean", "normalized_variance", "jdj_product_normalized", "clusters"]
      .forEach((key) => {
        const td = document.createElement("td");
        td.textContent = Number.isInteger(row[key]) ? row[key] : Number(row[key]).toFixed(4);
        tr.append(td);
      });
    return tr;
  }));
}

function render() {
  if (!metrics.length) return;
  drawPopulation();
  drawHistory();
  updateCards();
  updateTable();
}

function exportCsv() {
  if (!metrics.length) return;
  const keys = Object.keys(metrics[0]);
  const rows = [keys.join(","), ...metrics.map((row) => keys.map((key) => row[key]).join(","))];
  const blob = new Blob([`${rows.join("\n")}\n`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `fase1_seed-${config.seed}_epsilon-${config.epsilon}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

elements.epsilon.addEventListener("input", () => {
  elements.epsilonValue.textContent = Number(elements.epsilon.value).toFixed(2);
  dirty = true;
  setStatus("Configuración modificada; se aplicará al reiniciar o avanzar.");
});
[
  elements.agents,
  elements.steps,
  elements.seed,
  elements.scenario,
].forEach((control) => control.addEventListener("change", () => {
  dirty = true;
  setStatus("Configuración modificada; se aplicará al reiniciar o avanzar.");
}));
elements.initialize.addEventListener("click", initialize);
elements.start.addEventListener("click", start);
elements.pause.addEventListener("click", stopTimer);
elements.step.addEventListener("click", () => {
  stopTimer();
  if (dirty) initialize();
  advance();
});
elements.reset.addEventListener("click", reset);
elements.export.addEventListener("click", exportCsv);
window.addEventListener("resize", render);

initialize();
