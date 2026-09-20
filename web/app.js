const PARAMS = [
  { group: "Estructura", id: "nAgents", label: "Número de agentes", kind: "count", min: 30, max: 1000, step: 10, value: 240 },
  { group: "Estructura", id: "steps", label: "Iteraciones máximas", kind: "count", min: 100, max: 20000, step: 100, value: 3000 },
  { group: "Estructura", id: "seed", label: "Semilla", kind: "count", min: 1, max: 999999, step: 1, value: 123 },
  { group: "Estructura", id: "speed", label: "Velocidad visual", kind: "count", min: 1, max: 120, step: 1, value: 18 },
  { group: "Estructura", id: "stepsPerFrame", label: "Pasos por frame", kind: "count", min: 1, max: 20, step: 1, value: 1 },

  { group: "Visualización y diagnóstico", id: "showConfidence", label: "Mostrar vecindad ε", value: 0.00 },
  { group: "Visualización y diagnóstico", id: "selectedAgent", label: "Agente destacado", kind: "count", min: 1, max: 1000, step: 1, value: 1 },
  { group: "Visualización y diagnóstico", id: "showMovementTrails", label: "Mostrar trazas grises", value: 0.00 },
  { group: "Visualización y diagnóstico", id: "showPoleArrows", label: "Mostrar flechas polos", value: 1.00 },

  { group: "Micro: tolerancia e inmovilidad", id: "epsilonMean", label: "Apertura local / tolerancia ε", value: 0.30 },
  { group: "Micro: tolerancia e inmovilidad", id: "epsilonHeterogeneity", label: "Heterogeneidad de ε", value: 0.30 },
  { group: "Micro: tolerancia e inmovilidad", id: "alpha", label: "Inmovilidad α", value: 0.10 },
  { group: "Micro: tolerancia e inmovilidad", id: "mu", label: "Susceptibilidad μ", value: 0.60 },
  { group: "Micro: tolerancia e inmovilidad", id: "lambda", label: "Anclaje λ", value: 0.10 },
  { group: "Micro: tolerancia e inmovilidad", id: "noise", label: "Ruido", value: 0.10 },

  { group: "Tolerancia adaptativa", id: "radicalToleranceLoss", label: "Cierre por radicalidad", value: 0.40 },
  { group: "Tolerancia adaptativa", id: "massToleranceLoss", label: "Inercia de masa", value: 0.20 },

  { group: "Polos permanentes", id: "poleAx", label: "Polo A x", value: 0.00 },
  { group: "Polos permanentes", id: "poleAy", label: "Polo A y", value: 1.00 },
  { group: "Polos permanentes", id: "poleBx", label: "Polo B x", value: 1.00 },
  { group: "Polos permanentes", id: "poleBy", label: "Polo B y", value: 0.00 },
  { group: "Polos permanentes", id: "poleStrength", label: "Fuerza polos", value: 0.70 },
  { group: "Polos permanentes", id: "poleRadius", label: "Radio polos", value: 0.70 },

  { group: "Eventos aleatorios", id: "eventProbability", label: "Frecuencia eventos", value: 0.70 },
  { group: "Eventos aleatorios", id: "eventStrength", label: "Fuerza evento", value: 0.80 },
  { group: "Eventos aleatorios", id: "eventRadius", label: "Radio evento", value: 0.40 },
  { group: "Eventos aleatorios", id: "eventDuration", label: "Duración evento", value: 0.40 },
  { group: "Eventos aleatorios", id: "eventDecay", label: "Fatiga/decaimiento", value: 0.50 },
  { group: "Eventos aleatorios", id: "eventReactance", label: "Reactancia evento", value: 0.20 },
  { group: "Eventos aleatorios", id: "counterEvent", label: "Contraevento", value: 0.40 },

  { group: "Clusters con masa", id: "clusterStrength", label: "Fuerza masa cluster", value: 0.40 },
  { group: "Clusters con masa", id: "clusterDetectRadius", label: "Radio detección cluster", value: 0.10 },
  { group: "Clusters con masa", id: "clusterGravityRadius", label: "Radio gravedad cluster", value: 0.60 },
  { group: "Clusters con masa", id: "clusterMassExponent", label: "Exponente masa", value: 0.70 },
  { group: "Clusters con masa", id: "clusterMinSize", label: "Tamaño mínimo cluster", kind: "count", min: 3, max: 1000, step: 1, value: 20 },
  { group: "Clusters con masa", id: "clusterSelfAttraction", label: "Autoatracción cluster", value: 0.10 },
  { group: "Clusters con masa", id: "clusterPoleCoupling", label: "Atracción polo-masa", value: 0.70 },

  { group: "Auditor JDJ y rebote", id: "auditThreshold", label: "Umbral JDJ", value: 0.60 },
  { group: "Auditor JDJ y rebote", id: "auditBalanceThreshold", label: "Umbral 50/50", value: 0.70 },
  { group: "Auditor JDJ y rebote", id: "auditPatience", label: "Paciencia auditor", value: 0.20 },
  { group: "Auditor JDJ y rebote", id: "centerRebound", label: "Fuerza centro", value: 0.50 },
];

const state = {
  controls: new Map(),
  running: false,
  rng: null,
  model: null,
  lastTimestamp: 0,
  accumulator: 0,
  pendingReset: false,
};
const RESET_PARAMS = new Set(['nAgents','seed','epsilonMean','epsilonHeterogeneity','alpha','mu','lambda']);

const mainCanvas = document.getElementById("mainCanvas");
const polCanvas = document.getElementById("polCanvas");
const eventCanvas = document.getElementById("eventCanvas");
const forceCanvas = document.getElementById("forceCanvas");
const ctx = mainCanvas.getContext("2d");
const polCtx = polCanvas.getContext("2d");
const eventCtx = eventCanvas.getContext("2d");
const forceCtx = forceCanvas.getContext("2d");

const stats = {
  t: document.getElementById("timeStat"),
  pol: document.getElementById("polStat"),
  jdj: document.getElementById("jdjStat"),
  balance: document.getElementById("balanceStat"),
  audit: document.getElementById("auditStat"),
  events: document.getElementById("eventsStat"),
  clusters: document.getElementById("clustersStat"),
  epsilon: document.getElementById("epsilonStat"),
};

function buildControls() {
  const root = document.getElementById("controlsRoot");
  const groups = {};
  for (const p of PARAMS) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }
  for (const [group, params] of Object.entries(groups)) {
    const section = document.createElement("details");
    section.className = "control-section";
    section.open = ['Estructura','Micro: tolerancia e inmovilidad','Polos permanentes'].includes(group);
    section.innerHTML = `<summary>${group}</summary>`;
    for (const p of params) {
      const row = document.createElement("label");
      row.className = "control-row";
      if (p.kind === "count") {
        row.innerHTML = `<span>${p.label}</span><output>${p.value}</output><input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}" />`;
      } else {
        row.innerHTML = `<span>${p.label}</span><output>${p.value.toFixed(2)}</output><input type="range" min="0" max="1" step="0.01" value="${p.value}" list="scaleTicks" />`;
      }
      const input = row.querySelector("input");
      input.setAttribute('aria-label', p.label);
      input.id = p.id;
      input.title = RESET_PARAMS.has(p.id) ? 'Requiere Reiniciar para regenerar los agentes.' : 'Se aplica en vivo; los eventos existentes conservan sus atributos.';
      const out = row.querySelector("output");
      input.addEventListener("input", () => {
        out.textContent = p.kind === "count" ? input.value : Number(input.value).toFixed(2);
        if (RESET_PARAMS.has(p.id)) state.pendingReset = true;
        updateConfig();
        document.getElementById('configNotice').textContent = state.pendingReset
          ? 'Hay cambios de población pendientes: pulsa Reiniciar para aplicarlos.'
          : 'Cambio aplicado. Los eventos ya creados conservan sus atributos.';
      });
      section.appendChild(row);
      state.controls.set(p.id, { param: p, input });
    }
    root.appendChild(section);
  }
  const datalist = document.createElement("datalist");
  datalist.id = "scaleTicks";
  for (let i = 0; i <= 10; i++) {
    const option = document.createElement("option");
    option.value = (i / 10).toFixed(1);
    datalist.appendChild(option);
  }
  document.body.appendChild(datalist);
  syncDependentControls();
}

function syncDependentControls() {
  const nControl = state.controls.get("nAgents");
  const clusterControl = state.controls.get("clusterMinSize");
  const selectedControl = state.controls.get("selectedAgent");
  if (!nControl || !clusterControl) return;
  const nAgents = Math.round(Number(nControl.input.value));
  clusterControl.input.max = String(nAgents);
  if (Number(clusterControl.input.value) > nAgents) {
    clusterControl.input.value = String(nAgents);
    clusterControl.input.closest(".control-row").querySelector("output").textContent = String(nAgents);
  }
  if (selectedControl) {
    selectedControl.input.max = String(nAgents);
    if (Number(selectedControl.input.value) > nAgents) {
      selectedControl.input.value = String(nAgents);
      selectedControl.input.closest(".control-row").querySelector("output").textContent = String(nAgents);
    }
  }
}

function raw(id) {
  return Number(state.controls.get(id).input.value);
}
function cfg() {
  return {
    nAgents: Math.round(raw("nAgents")),
    steps: Math.round(raw("steps")),
    seed: Math.round(raw("seed")),
    speed: Math.round(raw("speed")),
    stepsPerFrame: Math.round(raw("stepsPerFrame")),
    showConfidence: raw("showConfidence"),
    selectedAgent: Math.min(Math.max(1, Math.round(raw("selectedAgent"))), Math.round(raw("nAgents"))),
    showMovementTrails: raw("showMovementTrails"),
    showPoleArrows: raw("showPoleArrows"),
    epsilonMean: raw("epsilonMean"),
    epsilonHeterogeneity: raw("epsilonHeterogeneity"),
    alpha: raw("alpha"),
    mu: raw("mu"),
    lambda: raw("lambda"),
    noise: raw("noise"),
    radicalToleranceLoss: raw("radicalToleranceLoss"),
    massToleranceLoss: raw("massToleranceLoss"),
    poleA: [raw("poleAx"), raw("poleAy")],
    poleB: [raw("poleBx"), raw("poleBy")],
    poleStrength: raw("poleStrength"),
    poleRadius: Math.max(0.02, raw("poleRadius")),
    eventFrequency: raw("eventProbability"),
    eventStrength: raw("eventStrength"),
    eventRadius: Math.max(0.02, raw("eventRadius")),
    eventDuration: 20 + Math.round(180 * raw("eventDuration")),
    eventMeanGap: 30 + Math.round(970 * (1 - raw("eventProbability"))),
    eventDecay: raw("eventDecay"),
    eventReactance: raw("eventReactance"),
    counterEvent: raw("counterEvent"),
    clusterStrength: raw("clusterStrength"),
    clusterDetectRadius: Math.max(0.02, raw("clusterDetectRadius")),
    clusterGravityRadius: Math.max(0.02, raw("clusterGravityRadius")),
    clusterMassExponent: 0.5 + 1.5 * raw("clusterMassExponent"),
    clusterMinSize: Math.min(Math.round(raw("clusterMinSize")), Math.round(raw("nAgents"))),
    clusterSelfAttraction: raw("clusterSelfAttraction"),
    clusterPoleCoupling: raw("clusterPoleCoupling"),
    auditThreshold: raw("auditThreshold"),
    auditBalanceThreshold: raw("auditBalanceThreshold"),
    auditPatience: 1 + Math.round(119 * raw("auditPatience")),
    centerRebound: raw("centerRebound"),
    dt: 0.075,
    maxMove: 0.05,
  };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normal(mean = 0, sd = 1) {
  // Box–Muller (1958): m+s√(-2 ln U)cos(2πV). Ej.: m=.28,s=.15,Z=1 → .43.
  let u = 0, v = 0;
  while (u === 0) u = state.rng();
  while (v === 0) v = state.rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function hypot(x, y) { return Math.sqrt(x * x + y * y); }

function resetModel() {
  state.pendingReset = false;
  document.getElementById('configNotice').textContent = 'Población regenerada. Controles continuos: flechas del teclado = ±0.01.';
  const c = cfg();
  state.rng = mulberry32(c.seed);
  const agents = [];
  const nLeft = Math.floor(c.nAgents / 2);
  for (let i = 0; i < c.nAgents; i++) {
    const left = i < nLeft;
    const center = left ? [0.28, 0.70] : [0.73, 0.29];
    const spread = left ? [0.15, 0.14] : [0.14, 0.13];
    const x = clamp(normal(center[0], spread[0]), 0.02, 0.98);
    const y = clamp(normal(center[1], spread[1]), 0.02, 0.98);
    const eps0 = clamp(normal(c.epsilonMean, 0.25 * c.epsilonHeterogeneity), 0.02, 1);
    agents.push({
      x, y,
      previousX: x, previousY: y,
      anchorX: x, anchorY: y,
      eps0,
      eps: eps0,
      mu: clamp(normal(c.mu, 0.08), 0.02, 1),
      alpha: clamp(normal(c.alpha, 0.05), 0, 1),
      lambda: clamp(normal(c.lambda, 0.04), 0, 1),
      clusterId: -1,
    });
  }
  state.model = {
    cfg: c,
    agents,
    events: [],
    clusters: [],
    t: 0,
    nextEventAt: Math.round(state.rng() * c.eventMeanGap),
    highPolCount: 0,
    historyPol: [],
    historyEvent: [],
    historyForces: [],
    highlighted: Math.min(c.selectedAgent - 1, agents.length - 1),
  };
  pushMetrics({ local: 0, pole: 0, event: 0, cluster: 0, center: 0 });
  draw();
}

function updateConfig() {
  if (!state.model) return;
  syncDependentControls();
  const oldFrequency = state.model.cfg.eventFrequency;
  state.model.cfg = cfg();
  if (oldFrequency !== state.model.cfg.eventFrequency) {
    state.model.nextEventAt = state.model.t + Math.round(0.5 * state.model.cfg.eventMeanGap);
  }
  state.model.highlighted = Math.min(state.model.cfg.selectedAgent - 1, state.model.agents.length - 1);
}

function makeGrid(agents, cellSize) {
  const grid = new Map();
  const inv = 1 / cellSize;
  agents.forEach((a, i) => {
    const key = `${Math.floor(a.x * inv)},${Math.floor(a.y * inv)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  });
  return { grid, inv };
}
function nearby(spatial, x, y, r) {
  const out = [];
  const minX = Math.floor((x - r) * spatial.inv);
  const maxX = Math.floor((x + r) * spatial.inv);
  const minY = Math.floor((y - r) * spatial.inv);
  const maxY = Math.floor((y + r) * spatial.inv);
  for (let gx = minX; gx <= maxX; gx++) {
    for (let gy = minY; gy <= maxY; gy++) {
      const bucket = spatial.grid.get(`${gx},${gy}`);
      if (bucket) out.push(...bucket);
    }
  }
  return out;
}

function sideScore(a) {
  // Solo para clasificar el lado del agente ante eventos/contraeventos.
  // No es el JDJ: el JDJ usa poleDistanceMembership() con normalizacion sqrt(2).
  const c = state.model.cfg;
  const dA = hypot(a.x - c.poleA[0], a.y - c.poleA[1]);
  const dB = hypot(a.x - c.poleB[0], a.y - c.poleB[1]);
  const denom = dA + dB;
  return denom < 1e-9 ? 0.5 : clamp(dA / denom, 0, 1);
}
function poleDistanceMembership(a, c = state.model.cfg) {
  const dA = hypot(a.x - c.poleA[0], a.y - c.poleA[1]);
  const dB = hypot(a.x - c.poleB[0], a.y - c.poleB[1]);
  const maxDistance = Math.sqrt(2);
  return {
    a: clamp(1 - dA / maxDistance, 0, 1),
    b: clamp(1 - dB / maxDistance, 0, 1),
    dA,
    dB,
  };
}
function jdjMembership(a, c = state.model.cfg) {
  // Adaptacion del simulador: el JDJ original recibe Prob_0/Prob_1.
  // Aqui se generan A/B como similitud euclidea normalizada a los polos.
  const m = poleDistanceMembership(a, c);
  return { a: m.a, b: m.b };
}
function roundJdjValue(x) {
  return Math.round(clamp(x, 0, 1) * 100) / 100;
}
function jdjFromFrequencyTable(agents) {
  // JDJ = 2 sum_ij max(muA_i muB_j, muB_i muA_j)/n².
  // Agrupar pares idénticos es exacto; redondearlos antes altera la medida.
  // Un agente en el centro aporta 2*(.5*.5)=.5, incluyendo i=j.
  const n = agents.length;
  if (n === 0) return 0;
  const buckets = new Map();
  for (const agent of agents) {
    const m = jdjMembership(agent);
    const a = m.a;
    const b = m.b;
    const key = `${a}|${b}`;
    const current = buckets.get(key);
    if (current) {
      current.count++;
    } else {
      buckets.set(key, { a, b, count: 1 });
    }
  }
  const freq = Array.from(buckets.values()).map(row => ({
    a: row.a,
    b: row.b,
    f: row.count / n,
  }));
  let total = 0;
  for (let i = 0; i < freq.length; i++) {
    for (let j = 0; j < freq.length; j++) {
      const m = Math.max(freq[i].a * freq[j].b, freq[i].b * freq[j].a);
      const w = freq[i].f * freq[j].f;
      total += m * w;
    }
  }
  return 2 * total;
}
function jdjFrequencyRows(agents) {
  const n = agents.length;
  const buckets = new Map();
  for (const agent of agents) {
    const m = jdjMembership(agent);
    const a = roundJdjValue(m.a);
    const b = roundJdjValue(m.b);
    const key = `${a.toFixed(2)}|${b.toFixed(2)}`;
    const current = buckets.get(key);
    if (current) current.count++;
    else buckets.set(key, { a, b, count: 1 });
  }
  return Array.from(buckets.values())
    .map(row => ({ a: row.a, b: row.b, f: row.count / n, count: row.count }))
    .sort((r1, r2) => r2.count - r1.count);
}
function polarizationStats() {
  const agents = state.model.agents;
  if (agents.length === 0) return { p: 0, jdj: 0, social: 0, balance: 0, separation: 0, meanB: 0, dominant: null };
  const memberships = agents.map(a => jdjMembership(a));
  const meanB = memberships.reduce((s, m) => s + m.b, 0) / memberships.length;
  const balance = 4 * meanB * (1 - meanB);
  const positions = memberships.map(m => m.b);
  const mean = positions.reduce((a, b) => a + b, 0) / positions.length;
  const variance = positions.reduce((s, x) => s + (x - mean) ** 2, 0) / positions.length;
  const separation = clamp(4 * variance, 0, 1);
  const jdj = jdjFromFrequencyTable(agents);
  const rows = jdjFrequencyRows(agents);
  return { p: jdj, jdj, social: clamp(jdj * separation, 0, 1), balance, separation, meanB, dominant: rows[0] || null };
}

function detectClusters() {
  // Heurística propia de centros locales; no es DBSCAN. Ver formula.html#masa.
  // Centro=media; masa=(miembros/N)^γ. Ej.: 20/100 y γ=1 → masa .2.
  const m = state.model, c = m.cfg, agents = m.agents;
  for (const a of agents) a.clusterId = -1;
  const spatial = makeGrid(agents, c.clusterDetectRadius);
  const assigned = Array(agents.length).fill(false);
  const clusters = [];
  const r2 = c.clusterDetectRadius ** 2;
  const density = agents.map((a, i) => {
    let count = 0;
    for (const j of nearby(spatial, a.x, a.y, c.clusterDetectRadius)) {
      const dx = a.x - agents[j].x, dy = a.y - agents[j].y;
      if (dx * dx + dy * dy <= r2) count++;
    }
    return { i, count };
  }).sort((a, b) => b.count - a.count);

  for (const seed of density) {
    if (assigned[seed.i] || seed.count < c.clusterMinSize) continue;
    let cx = agents[seed.i].x;
    let cy = agents[seed.i].y;
    let members = [];

    for (let iter = 0; iter < 5; iter++) {
      members = [];
      for (const j of nearby(spatial, cx, cy, c.clusterDetectRadius)) {
        if (assigned[j]) continue;
        const dx = cx - agents[j].x, dy = cy - agents[j].y;
        if (dx * dx + dy * dy <= r2) members.push(j);
      }
      if (members.length < c.clusterMinSize) break;
      let nx = 0, ny = 0;
      for (const idx of members) { nx += agents[idx].x; ny += agents[idx].y; }
      nx /= members.length; ny /= members.length;
      if (hypot(nx - cx, ny - cy) < 0.002) {
        cx = nx; cy = ny;
        break;
      }
      cx = nx; cy = ny;
    }

    members = [];
    for (const j of nearby(spatial, cx, cy, c.clusterDetectRadius)) {
      if (assigned[j]) continue;
      const dx = cx - agents[j].x, dy = cy - agents[j].y;
      if (dx * dx + dy * dy <= r2) members.push(j);
    }

    if (members.length >= c.clusterMinSize) {
      let x = 0, y = 0;
      for (const idx of members) { x += agents[idx].x; y += agents[idx].y; }
      x /= members.length; y /= members.length;
      const massShare = members.length / agents.length;
      const mass = Math.pow(massShare, c.clusterMassExponent);
      const id = clusters.length;
      for (const idx of members) {
        agents[idx].clusterId = id;
        assigned[idx] = true;
      }
      clusters.push({ id, x, y, members: new Set(members), size: members.length, mass, massShare });
    }
  }
  m.clusters = clusters;
}

function eventAmp(e, t) {
  // a(t)=2^(-edad/H): a los H pasos queda 1/2. Ventana temporal propia.
  if (t < e.start || t >= e.start + e.duration) return 0;
  const halfLife = 1 + 299 * (1 - e.decay);
  return Math.pow(2, -(t - e.start) / halfLife);
}
function maybeEvents() {
  const m = state.model, c = m.cfg;
  m.events = m.events.filter(e => m.t < e.start + e.duration);
  if (c.eventFrequency <= 0) return;
  const activePrimary = m.events.some(e => !e.counter && eventAmp(e, m.t) > 0);
  if (!activePrimary && m.t >= m.nextEventAt) {
    const strength = clamp(c.eventStrength * (0.65 + 0.7 * state.rng()), 0, 1);
    const e = { x: state.rng(), y: state.rng(), start: m.t, duration: c.eventDuration, strength, radius: c.eventRadius, decay: c.eventDecay, reactance: c.eventReactance, counter: false };
    m.events.push(e);
    if (state.rng() < c.counterEvent) {
      m.events.push({ x: 1 - e.x, y: 1 - e.y, start: m.t + 3, duration: Math.round(0.65 * e.duration), strength: 0.55 * strength, radius: e.radius, decay: e.decay, reactance: e.reactance, counter: true });
    }
    const jitter = 0.65 + 0.7 * state.rng();
    m.nextEventAt = m.t + Math.max(8, Math.round(c.eventMeanGap * jitter));
  }
}

function poleForce(a, c) {
  const dax = c.poleA[0] - a.x, day = c.poleA[1] - a.y;
  const dbx = c.poleB[0] - a.x, dby = c.poleB[1] - a.y;
  const poleSharpness = 1 + 6 * c.poleStrength;
  // Softmax estable: restar el máximo conserva wA+wB=1 incluso con radio .02.
  // Antes, +1e-9 dominaba los pesos minúsculos y creaba un destino falso (0,0).
  // Referencia matemática: Blanchard, Higham & Higham, DOI 10.1093/imanum/draa038.
  const zA = -poleSharpness * (dax * dax + day * day) / (2 * c.poleRadius ** 2);
  const zB = -poleSharpness * (dbx * dbx + dby * dby) / (2 * c.poleRadius ** 2);
  const shift = Math.max(zA, zB);
  const sA = Math.exp(zA - shift), sB = Math.exp(zB - shift);
  const denomPoles = sA + sB;
  const wA = sA / denomPoles;
  const wB = sB / denomPoles;
  const poleTargetX = wA * c.poleA[0] + wB * c.poleB[0];
  const poleTargetY = wA * c.poleA[1] + wB * c.poleB[1];
  const poleCommitment = Math.abs(wA - wB);
  const poleMagnitude = c.poleStrength * (0.35 + 0.65 * poleCommitment);
  return {
    x: poleMagnitude * (poleTargetX - a.x),
    y: poleMagnitude * (poleTargetY - a.y),
    targetX: poleTargetX,
    targetY: poleTargetY,
    wA,
    wB,
  };
}

function clusterForceEnabled(c) {
  return c.clusterStrength > 0 || c.clusterSelfAttraction > 0 || c.clusterPoleCoupling > 0;
}

function clusterDetectionEnabled(c) {
  return clusterForceEnabled(c) || c.massToleranceLoss > 0;
}

function step() {
  const m = state.model, c = m.cfg, agents = m.agents;
  maybeEvents();
  if (clusterDetectionEnabled(c)) detectClusters();
  else {
    for (const a of agents) a.clusterId = -1;
    m.clusters = [];
  }
  const spatial = makeGrid(agents, Math.max(c.epsilonMean, c.clusterDetectRadius, 0.05));
  const statsPol = polarizationStats();
  m.highPolCount = statsPol.p >= c.auditThreshold && statsPol.balance >= c.auditBalanceThreshold ? m.highPolCount + 1 : 0;
  const forceMeans = { local: 0, pole: 0, event: 0, cluster: 0, center: 0 };
  // Todas las fuerzas leen el estado t de la misma ronda (actualización síncrona).
  // La cuadrícula espacial se construyó con esas posiciones; escribir antes
  // de terminar mezclaría tiempos y perdería vecinos. Guardamos solo el resultado.
  const nextPositions = [];

  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    // Registro del cálculo real, sin recalcular fuerzas ni consumir sorteos.
    const explain = i === (m.highlighted ?? 0);
    const neighbors = explain ? [] : null;
    a.previousX = a.x; a.previousY = a.y;
    const radicality = hypot(a.x - 0.5, a.y - 0.5) / Math.sqrt(0.5);
    // Hipótesis geométrica propia: ε=ε0(1-cierre*r)(1-inercia*M), acotada.
    // Ej.: .3*(1-.4*.5)*(1-.2*.2)=.2304. No es una ley psicológica.
    const ownCluster = m.clusters.find(cl => cl.id === a.clusterId);
    const massInertia = ownCluster ? ownCluster.mass : 0;
    a.eps = clamp(a.eps0 * (1 - c.radicalToleranceLoss * radicality) * (1 - c.massToleranceLoss * massInertia), 0.01, 1);

    let localX = 0, localY = 0, count = 0;
    // Confianza acotada (HK, 2002), adaptada: L=media(vecinos sin i)-posición.
    // En (.4,.5), un vecino (.6,.5) aporta L=(.2,0), no un salto inmediato.
    for (const j of nearby(spatial, a.x, a.y, a.eps)) {
      if (j === i) continue;
      const b = agents[j];
      const d = hypot(a.x - b.x, a.y - b.y);
      if (d <= a.eps) {
        localX += b.x; localY += b.y; count++;
        if (explain) neighbors.push(j + 1);
      }
    }
    if (count) { localX = localX / count - a.x; localY = localY / count - a.y; }

    const pf = poleForce(a, c);
    let poleX = pf.x;
    let poleY = pf.y;
    if (ownCluster && c.clusterPoleCoupling > 0) {
      const cpf = poleForce({ x: ownCluster.x, y: ownCluster.y }, c);
      const massGain = c.clusterPoleCoupling * (0.35 + 0.65 * ownCluster.mass);
      poleX += massGain * cpf.x;
      poleY += massGain * cpf.y;
    }

    let eventX = 0, eventY = 0;
    for (const e of m.events) {
      const amp = eventAmp(e, m.t);
      if (!amp) continue;
      const dx = e.x - a.x, dy = e.y - a.y, d = Math.max(hypot(dx, dy), 0.02);
      const k = Math.exp(-(d * d) / (2 * e.radius * e.radius));
      const attract = amp * e.strength * k;
      eventX += attract * dx;
      eventY += attract * dy;
      const eventSide = hypot(e.x - c.poleB[0], e.y - c.poleB[1]) < hypot(e.x - c.poleA[0], e.y - c.poleA[1]) ? 1 : 0;
      const agentSide = sideScore(a) >= 0.5 ? 1 : 0;
      if (eventSide !== agentSide) {
        eventX -= amp * e.reactance * k * dx / d;
        eventY -= amp * e.reactance * k * dy / d;
      }
    }

    let clusterX = 0, clusterY = 0;
    // Hipótesis de masa: Σ h*S*M*exp(-d²/(2ρ²))*(centro-u)/(d²+b²).
    // b evita singularidad; no se atribuye esta gravedad a una ley social.
    for (const cl of m.clusters) {
      const dx = cl.x - a.x, dy = cl.y - a.y;
      const d = Math.max(hypot(dx, dy), 0.01);
      const d2 = d * d;
      const reach = Math.exp(-d2 / (2 * c.clusterGravityRadius * c.clusterGravityRadius));
      const softening = 0.02 + 0.18 * c.clusterGravityRadius;
      const gravity = c.clusterStrength * cl.mass * reach / (d2 + softening * softening);
      const selfFactor = cl.members.has(i) ? c.clusterSelfAttraction : 1;
      clusterX += selfFactor * gravity * dx;
      clusterY += selfFactor * gravity * dy;
    }

    let centerX = 0, centerY = 0;
    if (m.highPolCount >= c.auditPatience) {
      centerX = c.centerRebound * (0.5 - a.x);
      centerY = c.centerRebound * (0.5 - a.y);
    }

    const anchorX = a.lambda * (a.anchorX - a.x);
    // Anclaje aditivo, inspirado en persistencia FJ, no FJ literal.
    // F=L+P+E+C+R+λ(u0-u); v=dt*μ*F si ||F||>α, después ruido y límites.
    // Ej.: F=(.19,0), dt=.075, μ=.6 → v=(.00855,0). Ver formula.html#final.
    const anchorY = a.lambda * (a.anchorY - a.y);
    const totalX = localX + poleX + eventX + clusterX + centerX + anchorX;
    const totalY = localY + poleY + eventY + clusterY + centerY + anchorY;
    const forceNorm = hypot(totalX, totalY);
    let moveX = 0, moveY = 0;
    if (forceNorm > a.alpha) {
      moveX = c.dt * a.mu * totalX;
      moveY = c.dt * a.mu * totalY;
    }
    const directed = explain ? [moveX, moveY] : null;
    let noiseX = 0, noiseY = 0;
    if (c.noise > 0) {
      const noiseScale = 0.012 * c.noise;
      noiseX = normal(0, noiseScale);
      noiseY = normal(0, noiseScale);
      moveX += noiseX;
      moveY += noiseY;
    }
    const stepLen = hypot(moveX, moveY);
    if (stepLen > c.maxMove) {
      moveX *= c.maxMove / stepLen;
      moveY *= c.maxMove / stepLen;
    }
    nextPositions.push([clamp(a.x + moveX, 0, 1), clamp(a.y + moveY, 0, 1)]);
    if (explain) {
      // Arrays nuevos: los pasos posteriores no deben alterar esta fotografía.
      m.movement = {
        agent: i + 1, t: m.t, from: [a.x, a.y], to: [...nextPositions[i]],
        eps0: a.eps0, eps: a.eps, radicality, mass: massInertia,
        closure: c.radicalToleranceLoss, inertia: c.massToleranceLoss,
        neighbors, group: ownCluster ? {size: ownCluster.size, center: [ownCluster.x, ownCluster.y]} : null,
        forces: [
          ["Vecinos parecidos", localX, localY],
          ["Polo sobre la persona", pf.x, pf.y],
          ["Aporte polo–grupo", poleX - pf.x, poleY - pf.y],
          ["Eventos y reactancia (neto)", eventX, eventY],
          ["Atracción de grupos", clusterX, clusterY],
          ["Auditor hacia el centro", centerX, centerY],
          ["Anclaje inicial", anchorX, anchorY]
        ],
        total: [totalX, totalY], norm: forceNorm, alpha: a.alpha,
        dt: c.dt, mu: a.mu, directed, noise: [noiseX, noiseY],
        noiseScale: 0.012 * c.noise, stepLen, maxMove: c.maxMove,
        factor: stepLen > c.maxMove ? c.maxMove / stepLen : 1,
        limited: [moveX, moveY], beforeClip: [a.x + moveX, a.y + moveY]
      };
    }

    forceMeans.local += hypot(localX, localY);
    forceMeans.pole += hypot(poleX, poleY);
    forceMeans.event += hypot(eventX, eventY);
    forceMeans.cluster += hypot(clusterX, clusterY);
    forceMeans.center += hypot(centerX, centerY);
  }
  agents.forEach((a, i) => { [a.x, a.y] = nextPositions[i]; });
  for (const k of Object.keys(forceMeans)) forceMeans[k] /= agents.length;
  m.t++;
  pushMetrics(forceMeans);
}

function pushMetrics(forceMeans) {
  const m = state.model;
  const ps = polarizationStats();
  const eventIntensity = Math.min(1, m.events.reduce((s, e) => s + eventAmp(e, m.t) * e.strength, 0));
  m.historyPol.push(ps.p);
  m.historyEvent.push(eventIntensity);
  m.historyForces.push(forceMeans);
  if (m.historyPol.length > 900) { m.historyPol.shift(); m.historyEvent.shift(); m.historyForces.shift(); }
}

function sx(x) { return 70 + x * 760; }
function sy(y) { return 830 - y * 760; }
function drawCanvasLabel(text, x, y, options = {}) {
  const font = options.font || "18px Arial";
  const padX = options.padX ?? 6;
  const padY = options.padY ?? 4;
  const margin = options.margin ?? 8;
  ctx.save();
  ctx.font = font;
  const width = ctx.measureText(text).width;
  const height = options.height || 22;
  const bx = clamp(x, margin, 900 - width - padX * 2 - margin);
  const by = clamp(y, margin + height, 900 - padY * 2 - margin);
  ctx.fillStyle = options.background || "rgba(255,255,255,0.78)";
  ctx.strokeStyle = options.border || "rgba(0,0,0,0.18)";
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by - height, width + padX * 2, height + padY, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = options.color || "#111";
  ctx.fillText(text, bx + padX, by - 5);
  ctx.restore();
}
let lastExplanationKey = null;
let lastExplanationTrace = null;
function renderMovementExplanation() {
  const box = document.getElementById("movementDetails");
  const m = state.model;
  if (!box || !m) return;
  const r = m.movement;
  const selected = (m.highlighted ?? 0) + 1;
  const key = `${selected}:${state.pendingReset}`;
  if (lastExplanationTrace === r && lastExplanationKey === key) return;
  lastExplanationTrace = r;
  lastExplanationKey = key;
  if (!r || r.agent !== selected) {
    box.textContent = `Agente ${selected} seleccionado. Pulsa «Avanzar 1 ronda y explicar» para registrar su siguiente movimiento. No se inventa un ejemplo ni se reutiliza el cálculo de otra persona.`;
    return;
  }
  const f = n => n.toFixed(6);
  const v = p => `(${f(p[0])}; ${f(p[1])})`;
  const moved = [r.to[0] - r.from[0], r.to[1] - r.from[1]];
  const direction = (n, positive, negative) => Math.abs(n) < 1e-12 ? "sin cambio" : n > 0 ? positive : negative;
  // Solo texto fijo y números internos; no se insertan entradas del usuario.
  box.innerHTML = `
    <h4>Agente ${r.agent} · ronda ${r.t} → ${r.t + 1}</h4>
    <p><b>De ${v(r.from)} a ${v(r.to)}.</b> En x: ${direction(moved[0], "derecha", "izquierda")}; en y: ${direction(moved[1], "arriba", "abajo")}.</p>
    <p class="control-notice">Fotografía del último paso calculado para esta persona. Los controles actuales pueden haber cambiado después. Se muestran 6 decimales; el motor no redondea estos cálculos.${state.pendingReset ? " Hay atributos pendientes de reiniciar." : ""}</p>
    <details open><summary>1. ¿A quién escuchó?</summary>
      <p>Su tolerancia inicial ${f(r.eps0)} se ajustó así: ε = limitar[${f(r.eps0)} × (1 − ${f(r.closure)} × ${f(r.radicality)}) × (1 − ${f(r.inertia)} × ${f(r.mass)}), 0.01, 1] = <b>${f(r.eps)}</b>.</p>
      <p>Escuchó a ${r.neighbors.length} vecinos a distancia euclídea ≤ ε. Se promedian sus posiciones y se resta la posición propia.${r.group ? ` Grupo propio: ${r.group.size} personas, centro ${v(r.group.center)}, masa ${f(r.mass)}.` : " No se le asignó un grupo."}</p>
      <details><summary>Identificadores de los vecinos</summary><p>${r.neighbors.join(", ") || "Ninguno: la fuerza local es cero."}</p></details>
    </details>
    <details open><summary>2. ¿Qué empujó y hacia dónde?</summary>
      <p>Cada fila es una aportación antes de velocidad, ruido y límites. x positiva: derecha; y positiva: arriba. Un valor negativo apunta al lado contrario. Se suman por coordenada, no sus magnitudes.</p>
      <div class="trace-scroll"><table class="legend-table"><thead><tr><th>Aportación</th><th>x</th><th>y</th></tr></thead><tbody>
      ${r.forces.map(([name,x,y]) => `<tr><td>${name}</td><td>${f(x)}</td><td>${f(y)}</td></tr>`).join("")}
      <tr><th>Total F</th><th>${f(r.total[0])}</th><th>${f(r.total[1])}</th></tr></tbody></table></div>
      <p>«Polo–grupo» es el añadido calculado en el centro del grupo; no incluye de nuevo la fuerza polar individual. Eventos muestra el saldo de atracción y reactancia, no su magnitud por separado.</p>
    </details>
    <details open><summary>3. De fuerzas a movimiento</summary>
      <ol><li><b>Umbral:</b> longitud de F = ${f(r.norm)}; α = ${f(r.alpha)}. ${r.norm > r.alpha ? "Supera α: hay respuesta dirigida." : "No supera α: respuesta dirigida cero; aún puede haber ruido."}</li>
      <li><b>Respuesta dirigida:</b> ${r.norm > r.alpha ? `${f(r.dt)} × ${f(r.mu)} × ${v(r.total)}` : "(0; 0)"} = ${v(r.directed)}. dt es el paso numérico y μ la susceptibilidad individual.</li>
      <li><b>Ruido sorteado:</b> ${v(r.noise)}, con desviación ${f(r.noiseScale)} por eje. Sumado a la respuesta: ${v([r.directed[0]+r.noise[0],r.directed[1]+r.noise[1]])}.</li>
      <li><b>Límite por ronda:</b> longitud ${f(r.stepLen)}, máximo ${f(r.maxMove)}. Multiplicador ${f(r.factor)} → desplazamiento ${v(r.limited)}.</li>
      <li><b>Nueva posición:</b> ${v(r.from)} + ${v(r.limited)} = ${v(r.beforeClip)}. Tras limitar cada coordenada a [0, 1]: <b>${v(r.to)}</b>.</li></ol>
      <p>Desplazamiento realmente realizado: ${v(moved)}. Todas las personas leen el mismo estado inicial de la ronda y se actualizan juntas.</p>
    </details>
    <p><a href="formula.html#final">Ecuaciones y ejemplo sencillo</a> · <a href="guide.html#significados">Qué significan estas cantidades</a>. Esta explicación verifica operaciones; no demuestra que sean leyes sociales.</p>`;
}

function explainOneStep() {
  state.running = false;
  state.accumulator = 0;
  updateConfig();
  if (state.model.t < state.model.cfg.steps) step();
  else document.getElementById("configNotice").textContent = "Se alcanzó el máximo de rondas. Auméntalo para continuar o reinicia.";
  draw();
}

function draw() {
  renderMovementExplanation();
  if (!state.model) return;
  drawMain();
  drawLineChart(polCtx, state.model.historyPol, "X = t", "Y = JDJ", "#1f77b4", { autoZoom: true });
  drawLineChart(eventCtx, state.model.historyEvent, "X = t", "Y = Intensidad eventos", "#2ca02c");
  drawForces();
}
function drawMain() {
  const m = state.model, c = m.cfg;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 900, 900);
  ctx.strokeStyle = "#e8e8e8"; ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const p = 70 + i * 76;
    ctx.beginPath(); ctx.moveTo(p, 70); ctx.lineTo(p, 830); ctx.moveTo(70, p); ctx.lineTo(830, p); ctx.stroke();
  }
  ctx.strokeStyle = "#222"; ctx.strokeRect(70, 70, 760, 760);
  ctx.fillStyle = "#111"; ctx.font = "28px Arial"; ctx.fillText("Dimensión actitudinal 1 (X)", 285, 884);
  ctx.save(); ctx.translate(28, 570); ctx.rotate(-Math.PI / 2); ctx.fillText("Dimensión actitudinal 2 (Y)", 0, 0); ctx.restore();
  drawJdjAxis();
  drawPole(c.poleA, "Polo A permanente", "#1f77b4");
  drawPole(c.poleB, "Polo B permanente", "#ff7f0e");
  for (const e of m.events) if (eventAmp(e, m.t) > 0) drawEvent(e);
  drawClusterFields();
  if (c.showPoleArrows >= 0.5) drawPoleVectors();
  if (c.showConfidence >= 0.5) drawConfidence(m.agents[m.highlighted], m.highlighted);
  if (c.showMovementTrails >= 0.5) {
    ctx.strokeStyle = "rgba(70,70,70,0.30)";
    for (const a of m.agents) {
      const dx = (a.x - a.previousX) * 18, dy = (a.y - a.previousY) * 18;
      if (Math.abs(dx) + Math.abs(dy) < 0.001) continue;
      ctx.beginPath(); ctx.moveTo(sx(a.previousX), sy(a.previousY)); ctx.lineTo(sx(a.previousX + dx), sy(a.previousY + dy)); ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(40,40,40,0.62)"; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 1.6;
  for (const a of m.agents) { ctx.beginPath(); ctx.arc(sx(a.x), sy(a.y), 4.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (c.showConfidence >= 0.5) drawSelectedAgent(m.agents[m.highlighted]);
  const ps = polarizationStats();
  ctx.fillStyle = "rgba(31,119,180,0.82)"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2; roundRect(ctx, 84, 685, 470, 135, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#0b0b0b"; ctx.font = "23px Arial";
  const activeEvents = m.events.filter(e => eventAmp(e, m.t) > 0).length;
  ctx.fillText(`t = ${String(m.t).padStart(3, "0")}`, 98, 713);
  ctx.fillText(`JDJ = ${ps.jdj.toFixed(3)}`, 98, 743);
  ctx.fillText(`separación = ${ps.separation.toFixed(3)}`, 98, 773);
  ctx.fillText(`eventos activos = ${activeEvents}; próximo ≈ t ${m.nextEventAt}`, 98, 803);
  stats.t.textContent = String(m.t);
  stats.pol.textContent = ps.jdj.toFixed(3);
  stats.jdj.textContent = ps.separation.toFixed(3);
  stats.balance.textContent = ps.balance.toFixed(3);
  stats.audit.textContent = m.highPolCount >= c.auditPatience ? "centro activo" : "inactivo";
  stats.events.textContent = String(activeEvents);
  stats.clusters.textContent = String(m.clusters.length);
  const selected = m.agents[m.highlighted];
  stats.epsilon.textContent = c.showConfidence >= 0.5 && selected ? `${m.highlighted + 1}: ${selected.eps.toFixed(3)}` : "off";
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawJdjAxis() {
  const c = state.model.cfg;
  ctx.save();
  ctx.strokeStyle = "rgba(20,20,20,0.42)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(sx(c.poleA[0]), sy(c.poleA[1]));
  ctx.lineTo(sx(c.poleB[0]), sy(c.poleB[1]));
  ctx.stroke();
  drawCanvasLabel("referencia A-B", sx(0.50) - 50, sy(0.50) - 12, { font: "17px Arial", background: "rgba(255,255,255,0.62)", border: "rgba(0,0,0,0.08)" });
  ctx.restore();
}
function drawPole(p, label, color) {
  const r = state.model.cfg.poleRadius * 760;
  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), r, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.28;
  ctx.setLineDash([8, 7]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  const px = sx(p[0]);
  const py = sy(p[1]);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 23, 0, Math.PI * 2); ctx.fill();
  const labelX = p[0] < 0.5 ? px + 14 : px - 205;
  const labelY = p[1] > 0.5 ? py + 32 : py - 36;
  drawCanvasLabel(label, labelX, labelY, { font: "20px Arial", background: "rgba(255,255,255,0.84)", border: color, height: 25 });
}
function star(c, x, y, r1, r2, n) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 === 0 ? r1 : r2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i === 0) c.moveTo(px, py); else c.lineTo(px, py); } c.closePath(); }
function drawEvent(e) {
  const amp = eventAmp(e, state.model.t), x = sx(e.x), y = sy(e.y), color = e.counter ? "#9467bd" : "#2ca02c";
  ctx.save();
  ctx.globalAlpha = 0.10 + 0.18 * amp;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, e.radius * 760, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.40;
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, e.radius * 760, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = color; star(ctx, x, y, 16 + 24 * amp, 7 + 12 * amp, 5); ctx.fill();
  ctx.fillStyle = "#111"; ctx.font = "19px Arial"; ctx.fillText(e.counter ? "Contraevento" : "Evento", x - 45, y - 27);
}
function drawClusterFields() {
  const m = state.model, c = m.cfg;
  if (!clusterForceEnabled(c)) return;
  ctx.save();
  for (const cl of m.clusters) {
    const visibleStrength = Math.max(c.clusterStrength, c.clusterSelfAttraction, c.clusterPoleCoupling);
    const alpha = clamp(0.04 + 0.55 * cl.massShare * visibleStrength, 0.03, 0.24);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#7b51a8";
    ctx.beginPath(); ctx.arc(sx(cl.x), sy(cl.y), c.clusterGravityRadius * 760, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#7b51a8";
    const coreRadius = 7 + 52 * Math.sqrt(cl.massShare);
    ctx.beginPath(); ctx.arc(sx(cl.x), sy(cl.y), coreRadius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.90;
    ctx.fillStyle = "#111";
    ctx.font = "14px Arial";
    ctx.fillText(`masa n=${cl.size}`, sx(cl.x) + coreRadius + 4, sy(cl.y) + 4);
  }
  ctx.restore();
}
function drawPoleVectors() {
  const m = state.model, c = m.cfg;
  if (c.poleStrength <= 0.05) return;
  const stride = Math.max(1, Math.ceil(m.agents.length / 60));
  ctx.save();
  ctx.strokeStyle = "rgba(255,127,14,0.50)";
  ctx.fillStyle = "rgba(255,127,14,0.62)";
  ctx.lineWidth = 1.8;
  for (let i = 0; i < m.agents.length; i += stride) {
    const a = m.agents[i];
    const pf = poleForce(a, c);
    const x1 = sx(a.x), y1 = sy(a.y);
    const x2 = x1 + pf.x * 120;
    const y2 = y1 - pf.y * 120;
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) continue;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * Math.cos(ang - 0.45), y2 - 7 * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - 7 * Math.cos(ang + 0.45), y2 - 7 * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function drawSelectedAgent(a) {
  if (!a) return;
  ctx.save();
  ctx.strokeStyle = "#f2c94c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(sx(a.x), sy(a.y), 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function drawConfidence(a, index) {
  if (!a) return;
  const r = a.eps * 760;
  ctx.save();
  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(sx(a.x), sy(a.y), r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#111";
  ctx.font = "18px Arial";
  ctx.fillText(`ε local agente ${index + 1}: radio de escucha, no fuerza`, sx(a.x) - 108, sy(a.y) + r + 24);
}
function selectAgentFromCanvas(event) {
  if (!state.model) return;
  const rect = mainCanvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * (mainCanvas.width / rect.width);
  const py = (event.clientY - rect.top) * (mainCanvas.height / rect.height);
  const x = (px - 70) / 760;
  const y = (830 - py) / 760;
  if (x < 0 || x > 1 || y < 0 || y > 1) return;
  let best = -1;
  let bestD2 = Infinity;
  for (let i = 0; i < state.model.agents.length; i++) {
    const a = state.model.agents[i];
    const dx = a.x - x, dy = a.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) { bestD2 = d2; best = i; }
  }
  if (best < 0) return;
  state.model.highlighted = best;
  const selected = state.controls.get("selectedAgent");
  const show = state.controls.get("showConfidence");
  if (selected) {
    selected.input.value = String(best + 1);
    selected.input.closest(".control-row").querySelector("output").textContent = String(best + 1);
  }
  if (show && Number(show.input.value) < 0.5) {
    show.input.value = "1";
    show.input.closest(".control-row").querySelector("output").textContent = "1.0";
  }
  updateConfig();
}
// Cada historial incluye t=0 y guarda hasta 900 muestras consecutivas.
// Ej.: en t=1000, las 900 muestras empiezan en 101, no en 0.
function historyStart(t, length) { return Math.max(0, t - Math.max(0, length - 1)); }
function drawLineChart(c, values, xLabel, yLabel, color, options = {}) {
  c.fillStyle = "#fff"; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
  const clean = values.filter(v => Number.isFinite(v));
  const rawMin = clean.length ? Math.min(...clean) : 0;
  const rawMax = clean.length ? Math.max(...clean) : 1;
  const mean = clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : 0;
  const sd = clean.length ? Math.sqrt(clean.reduce((s, v) => s + (v - mean) ** 2, 0) / clean.length) : 0;
  const upper = Math.max(1, rawMax);
  let yMin = 0, yMax = upper, zoomed = false;
  if (options.autoZoom && clean.length > 2 && rawMax - rawMin < 0.20) {
    const pad = Math.max(0.015, (rawMax - rawMin) * 0.35, sd * 1.25);
    yMin = clamp(rawMin - pad, 0, upper);
    yMax = clamp(rawMax + pad, 0, upper);
    if (yMax - yMin < 0.06) {
      const mid = (yMin + yMax) / 2;
      yMin = clamp(mid - 0.03, 0, upper);
      yMax = clamp(mid + 0.03, 0, upper);
    }
    zoomed = true;
  }
  const yRange = Math.max(1e-9, yMax - yMin);
  c.strokeStyle = "#eee"; for (let i = 0; i <= 10; i++) {
    const y = 260 - i * 22.5;
    const label = yMin + yRange * i / 10;
    c.beginPath(); c.moveTo(55, y); c.lineTo(590, y); c.stroke();
    c.fillStyle = "#555"; c.font = "11px Arial"; c.fillText(label.toFixed(2), 18, y + 4);
  }
  c.strokeStyle = "#eee"; c.fillStyle = "#555"; c.font = "11px Arial";
  const tMax = state.model ? state.model.t : values.length;
  const tMin = historyStart(tMax, values.length);
  for (let i = 0; i <= 5; i++) {
    const x = 55 + i * 107;
    c.beginPath(); c.moveTo(x, 35); c.lineTo(x, 260); c.stroke();
    c.fillText(String(Math.round(tMin + (tMax - tMin) * i / 5)), x - 8, 276);
  }
  c.strokeStyle = "#333"; c.strokeRect(55, 35, 535, 225);
  c.fillStyle = "#111"; c.font = "16px Arial"; c.fillText(xLabel, 285, 292); c.save(); c.translate(18, 220); c.rotate(-Math.PI / 2); c.fillText(yLabel, 0, 0); c.restore();
  if (options.autoZoom && clean.length) {
    c.fillStyle = "#333"; c.font = "12px Arial";
    c.fillText(`min=${rawMin.toFixed(3)} max=${rawMax.toFixed(3)} σ=${sd.toFixed(3)}${zoomed ? " · zoom visual" : ""}`, 300, 24);
  }
  c.strokeStyle = color; c.lineWidth = 3; c.beginPath();
  values.forEach((v, i) => {
    const x = 55 + (i / Math.max(1, values.length - 1)) * 535;
    const y = 260 - ((clamp(v, yMin, yMax) - yMin) / yRange) * 225;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  });
  c.stroke();
}
function drawForces() {
  const vals = state.model.historyForces;
  forceCtx.fillStyle = "#fff"; forceCtx.fillRect(0, 0, forceCanvas.width, forceCanvas.height);
  forceCtx.strokeStyle = "#333"; forceCtx.strokeRect(55, 30, 535, 200);
  const keys = [["pole", "#ff7f0e"], ["event", "#2ca02c"], ["cluster", "#9467bd"], ["center", "#555"]];
  const max = Math.max(0.001, ...vals.flatMap(v => keys.map(([k]) => v[k] || 0)));
  forceCtx.strokeStyle = "#eee"; forceCtx.fillStyle = "#555"; forceCtx.font = "11px Arial";
  for (let i = 0; i <= 5; i++) {
    const y = 230 - i * 40;
    forceCtx.beginPath(); forceCtx.moveTo(55, y); forceCtx.lineTo(590, y); forceCtx.stroke();
    forceCtx.fillText((max * i / 5).toFixed(2), 22, y + 4);
  }
  const tMax = state.model ? state.model.t : vals.length;
  const tMin = historyStart(tMax, vals.length);
  for (let i = 0; i <= 5; i++) {
    const x = 55 + i * 107;
    forceCtx.beginPath(); forceCtx.moveTo(x, 30); forceCtx.lineTo(x, 230); forceCtx.stroke();
    forceCtx.fillText(String(Math.round(tMin + (tMax - tMin) * i / 5)), x - 8, 244);
  }
  keys.forEach(([k, color], idx) => {
    forceCtx.strokeStyle = color; forceCtx.lineWidth = 2; forceCtx.beginPath();
    vals.forEach((v, i) => { const x = 55 + (i / Math.max(1, vals.length - 1)) * 535, y = 230 - ((v[k] || 0) / max) * 200; if (i === 0) forceCtx.moveTo(x, y); else forceCtx.lineTo(x, y); });
    forceCtx.stroke(); forceCtx.fillStyle = color; forceCtx.font = "13px Arial"; forceCtx.fillText(k, 70 + idx * 85, 20);
  });
  forceCtx.fillStyle = "#111"; forceCtx.font = "16px Arial"; forceCtx.fillText("X = t", 285, 252); forceCtx.save(); forceCtx.translate(18, 195); forceCtx.rotate(-Math.PI / 2); forceCtx.fillText("Y = fuerza media", 0, 0); forceCtx.restore();
}
function tick(ts) {
  if (!state.lastTimestamp) state.lastTimestamp = ts;
  const dt = ts - state.lastTimestamp; state.lastTimestamp = ts;
  const m = state.model;
  if (state.running && m && m.t < m.cfg.steps) {
    state.accumulator += dt;
    const frameMs = 1000 / Math.max(1, m.cfg.speed);
    while (state.accumulator >= frameMs) {
      for (let i = 0; i < m.cfg.stepsPerFrame && m.t < m.cfg.steps; i++) step();
      state.accumulator -= frameMs;
    }
  }
  draw(); requestAnimationFrame(tick);
}
document.getElementById("startBtn").addEventListener("click", () => { updateConfig(); state.running = true; });
document.getElementById("pauseBtn").addEventListener("click", () => { state.running = false; });
document.getElementById("explainBtn").addEventListener("click", explainOneStep);
document.getElementById("resetBtn").addEventListener("click", () => { state.running = false; state.accumulator = 0; resetModel(); });
mainCanvas.style.cursor = "crosshair";
mainCanvas.addEventListener("click", selectAgentFromCanvas);
mainCanvas.addEventListener("pointerdown", selectAgentFromCanvas);

buildControls();
resetModel();
requestAnimationFrame(tick);
