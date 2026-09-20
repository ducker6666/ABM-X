/*
 * Motor científico por fases.
 *
 * Esta parte no dibuja nada: solo implementa la ecuación documentada en
 * formula.html y en src/paper1_model.py. Separar modelo e interfaz permite
 * comprobar que un botón o un color no cambien accidentalmente la teoría.
 * `step` conserva exactamente el control HK del Paper 1. `advance` añade, de
 * una en una, las capas DW, FJ, red y señales temporales documentadas.
 *
 * Regla por agente i (actualización síncrona):
 *
 * x_i(t+1) = [Σ_{j∈N_i} x_j + I_A m_A R_A + I_B m_B R_B]
 *              / [|N_i| + I_A m_A + I_B m_B]
 *
 * N_i contiene al propio i y a todos los agentes cuya distancia euclídea es
 * como máximo epsilon. I_A/I_B valen 1 si la señal también está a distancia
 * epsilon o menos. Esta regla sigue HK y el modelo de señales constantes.
 *
 * Ejemplo infantil: dos personas opinan 0.2 y 0.3; una señal situada en 0.1
 * cuenta como dos voces. El promedio es (0.2+0.3+2*0.1)/4 = 0.175.
 */

(function attachPaper1Model(globalScope) {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6D2B79F5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(random, mean, standardDeviation) {
    let u = 0;
    let v = 0;
    while (u === 0) u = random();
    while (v === 0) v = random();
    return mean + standardDeviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function validateConfig(config) {
    if (!Number.isFinite(config.epsilon) || config.epsilon < 0) {
      throw new Error("epsilon debe ser un número no negativo");
    }
    for (const key of ["signalAWeight", "signalBWeight"]) {
      if (!Number.isFinite(config[key]) || config[key] < 0) {
        throw new Error(`${key} debe ser no negativo`);
      }
    }
    for (const key of ["signalA", "signalB"]) {
      const point = config[key];
      if (!Array.isArray(point) || point.length !== 2 || point.some(value => value < 0 || value > 1)) {
        throw new Error(`${key} debe pertenecer a [0,1]²`);
      }
    }
    if (distance(config.signalA, config.signalB) < 1e-12) {
      throw new Error("las señales A y B deben estar separadas");
    }
  }

  function initialize(nAgents, seed, scenario = "uniform") {
    if (!Number.isInteger(nAgents) || nAgents < 1) throw new Error("nAgents debe ser positivo");
    const random = mulberry32(seed);
    const agents = [];
    for (let i = 0; i < nAgents; i += 1) {
      let x;
      let y;
      if (scenario === "uniform") {
        x = random();
        y = random();
      } else if (scenario === "central") {
        x = clamp(normal(random, 0.5, 0.10), 0, 1);
        y = clamp(normal(random, 0.5, 0.10), 0, 1);
      } else if (scenario === "two_groups") {
        const first = i < Math.floor(nAgents / 2);
        x = clamp(normal(random, first ? 0.25 : 0.75, 0.09), 0, 1);
        y = clamp(normal(random, first ? 0.75 : 0.25, 0.09), 0, 1);
      } else {
        throw new Error("escenario inicial desconocido");
      }
      // anchorX/anchorY son x_i(0): la opinion inicial que usa FJ.
      agents.push({ x, y, anchorX: x, anchorY: y, previousX: x, previousY: y });
    }
    return agents;
  }

  function step(agents, config) {
    validateConfig(config);
    const old = agents.map(agent => [agent.x, agent.y]);
    return old.map((opinion, i) => {
      let sumX = 0;
      let sumY = 0;
      let denominator = 0;
      for (const other of old) {
        if (distance(opinion, other) <= config.epsilon) {
          sumX += other[0];
          sumY += other[1];
          denominator += 1;
        }
      }

      if (distance(opinion, config.signalA) <= config.epsilon) {
        sumX += config.signalAWeight * config.signalA[0];
        sumY += config.signalAWeight * config.signalA[1];
        denominator += config.signalAWeight;
      }
      if (distance(opinion, config.signalB) <= config.epsilon) {
        sumX += config.signalBWeight * config.signalB[0];
        sumY += config.signalBWeight * config.signalB[1];
        denominator += config.signalBWeight;
      }

      return {
        x: clamp(sumX / denominator, 0, 1),
        y: clamp(sumY / denominator, 0, 1),
        anchorX: agents[i].anchorX ?? old[i][0],
        anchorY: agents[i].anchorY ?? old[i][1],
        previousX: old[i][0],
        previousY: old[i][1],
      };
    });
  }

  function activeInterval(t, start, duration) {
    // Indicador rectangular: 1 dentro de [start, start+duration), 0 fuera.
    return t >= start && t < start + duration ? 1 : 0;
  }

  function signalWeights(config, t) {
    if (config.phase !== "temporal") return [config.signalAWeight, config.signalBWeight];
    return [
      config.signalAWeight * activeInterval(t, config.signalAStart, config.signalADuration),
      config.signalBWeight * activeInterval(t, config.signalBStart, config.signalBDuration),
    ];
  }

  function validatePhasedConfig(config, nAgents) {
    validateConfig(config);
    const phases = new Set(["hk", "dw", "fj", "network", "temporal"]);
    if (!phases.has(config.phase)) throw new Error("fase desconocida");
    if (!(config.compromiseRate > 0 && config.compromiseRate <= 0.5)) {
      throw new Error("mu debe pertenecer a (0, 0.5]");
    }
    if (!(config.interactionsPerAgent > 0)) throw new Error("los contactos por agente deben ser positivos");
    if (!(config.anchorWeight >= 0 && config.anchorWeight <= 1)) throw new Error("g debe pertenecer a [0,1]");
    if (!Number.isInteger(config.networkDegree) || config.networkDegree < 2 || config.networkDegree % 2 !== 0) {
      throw new Error("el grado de red debe ser un entero par mayor o igual que 2");
    }
    if (["network", "temporal"].includes(config.phase) && config.networkDegree >= nAgents) {
      throw new Error("el grado de red debe ser menor que el número de agentes");
    }
    if (!(config.networkRewiring >= 0 && config.networkRewiring <= 1)) throw new Error("beta debe pertenecer a [0,1]");
  }

  function buildSmallWorldNetwork(nAgents, degree, rewiring, seed) {
    if (nAgents < 3 || degree < 2 || degree % 2 !== 0 || degree >= nAgents) {
      throw new Error("la red requiere N>grado, con grado par y al menos 2");
    }
    const random = mulberry32(seed);
    const adjacency = Array.from({ length: nAgents }, () => new Set());
    const forwardEdges = [];
    for (let i = 0; i < nAgents; i += 1) {
      for (let offset = 1; offset <= degree / 2; offset += 1) {
        const j = (i + offset) % nAgents;
        adjacency[i].add(j);
        adjacency[j].add(i);
        forwardEdges.push([i, j]);
      }
    }
    for (const [i, oldJ] of forwardEdges) {
      if (random() >= rewiring || !adjacency[i].has(oldJ)) continue;
      const candidates = [];
      for (let node = 0; node < nAgents; node += 1) {
        if (node !== i && !adjacency[i].has(node)) candidates.push(node);
      }
      if (candidates.length === 0) continue;
      const newJ = candidates[Math.floor(random() * candidates.length)];
      adjacency[i].delete(oldJ);
      adjacency[oldJ].delete(i);
      adjacency[i].add(newJ);
      adjacency[newJ].add(i);
    }
    return adjacency;
  }

  function deffuantPairUpdate(first, second, mu) {
    // x_i' = x_i + mu(x_j-x_i); x_j' = x_j + mu(x_i-x_j).
    return [
      [first[0] + mu * (second[0] - first[0]), first[1] + mu * (second[1] - first[1])],
      [second[0] + mu * (first[0] - second[0]), second[1] + mu * (first[1] - second[1])],
    ];
  }

  function deffuantRound(agents, config, random, t) {
    const old = agents.map(agent => ({ ...agent }));
    const current = agents.map(agent => ({ ...agent, previousX: agent.x, previousY: agent.y }));
    const interactions = Math.max(1, Math.round(current.length * config.interactionsPerAgent));
    const [weightA, weightB] = signalWeights(config, t);
    const poolWeight = current.length + weightA + weightB;
    for (let contact = 0; contact < interactions; contact += 1) {
      const i = Math.floor(random() * current.length);
      const draw = random() * poolWeight;
      if (draw < current.length) {
        const j = Math.floor(draw);
        if (i === j) continue;
        const first = [current[i].x, current[i].y];
        const second = [current[j].x, current[j].y];
        if (distance(first, second) <= config.epsilon) {
          const [nextI, nextJ] = deffuantPairUpdate(first, second, config.compromiseRate);
          [current[i].x, current[i].y] = nextI;
          [current[j].x, current[j].y] = nextJ;
        }
      } else {
        const target = draw < current.length + weightA ? config.signalA : config.signalB;
        const own = [current[i].x, current[i].y];
        if (distance(own, target) <= config.epsilon) {
          current[i].x = own[0] + config.compromiseRate * (target[0] - own[0]);
          current[i].y = own[1] + config.compromiseRate * (target[1] - own[1]);
        }
      }
    }
    // previous representa el comienzo de la ronda, aunque un agente haya sido
    // elegido varias veces dentro de ella.
    return current.map((agent, i) => ({
      ...agent,
      x: clamp(agent.x, 0, 1),
      y: clamp(agent.y, 0, 1),
      previousX: old[i].x,
      previousY: old[i].y,
    }));
  }

  function boundedTarget(agents, index, config, adjacency, t) {
    const own = [agents[index].x, agents[index].y];
    const candidates = adjacency ? new Set([index, ...adjacency[index]]) : new Set(agents.map((_, i) => i));
    let sumX = 0;
    let sumY = 0;
    let denominator = 0;
    for (const j of candidates) {
      const other = [agents[j].x, agents[j].y];
      if (distance(own, other) <= config.epsilon) {
        sumX += other[0];
        sumY += other[1];
        denominator += 1;
      }
    }
    const [weightA, weightB] = signalWeights(config, t);
    if (distance(own, config.signalA) <= config.epsilon) {
      sumX += weightA * config.signalA[0]; sumY += weightA * config.signalA[1]; denominator += weightA;
    }
    if (distance(own, config.signalB) <= config.epsilon) {
      sumX += weightB * config.signalB[0]; sumY += weightB * config.signalB[1]; denominator += weightB;
    }
    return [sumX / denominator, sumY / denominator];
  }

  function friedkinJohnsenStep(agents, config, adjacency, t) {
    // Composición declarada: FJ conserva g de x_i(0); el blanco social T_i
    // usa confianza acotada y, si procede, solo vecinos de red.
    return agents.map((agent, i) => {
      const target = boundedTarget(agents, i, config, adjacency, t);
      const anchorX = agent.anchorX ?? agent.x;
      const anchorY = agent.anchorY ?? agent.y;
      return {
        ...agent,
        x: clamp(config.anchorWeight * anchorX + (1 - config.anchorWeight) * target[0], 0, 1),
        y: clamp(config.anchorWeight * anchorY + (1 - config.anchorWeight) * target[1], 0, 1),
        anchorX,
        anchorY,
        previousX: agent.x,
        previousY: agent.y,
      };
    });
  }

  function meanDisplacement(before, after) {
    if (before.length === 0) return 0;
    return before.reduce((sum, agent, i) => sum + distance([agent.x, agent.y], [after[i].x, after[i].y]), 0) / before.length;
  }

  function uniqueOpinionCount(agents, precision = 1e-6) {
    // Diagnostico numerico, no definicion sociologica de cluster.
    const keys = agents.map(agent => `${Math.round(agent.x / precision)},${Math.round(agent.y / precision)}`);
    return new Set(keys).size;
  }

  function advance(agents, config, runtime) {
    validatePhasedConfig(config, agents.length);
    const before = agents.map(agent => ({ ...agent }));
    let next;
    if (config.phase === "hk") next = step(agents, config);
    else if (config.phase === "dw") next = deffuantRound(agents, config, runtime.random, runtime.t);
    else if (config.phase === "fj") next = friedkinJohnsenStep(agents, config, null, runtime.t);
    else next = friedkinJohnsenStep(agents, config, runtime.network, runtime.t);
    return { agents: next, meanMove: meanDisplacement(before, next) };
  }

  function axisProjection(agent, config) {
    // Proyección escalar estándar sobre el segmento A--B. Es preprocesamiento
    // geométrico para JDJ, no una regla sociológica nueva.
    const ax = config.signalA[0];
    const ay = config.signalA[1];
    const dx = config.signalB[0] - ax;
    const dy = config.signalB[1] - ay;
    return clamp(((agent.x - ax) * dx + (agent.y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
  }

  function jdjProductAxis(agents, config) {
    // El producto y el máximo son los operadores de Guevara et al. (2020).
    // El factor 2 es una normalización operativa declarada: hace que una
    // división dura 50/50 entre A y B tome el valor 1.
    if (agents.length === 0) return 0;
    const memberships = agents.map(agent => {
      const s = axisProjection(agent, config);
      return { a: 1 - s, b: s };
    });
    let total = 0;
    for (const first of memberships) {
      for (const second of memberships) {
        total += Math.max(first.a * second.b, first.b * second.a);
      }
    }
    return clamp(2 * total / (agents.length * agents.length), 0, 1);
  }

  function dispersion(agents) {
    if (agents.length === 0) return 0;
    const cx = agents.reduce((sum, agent) => sum + agent.x, 0) / agents.length;
    const cy = agents.reduce((sum, agent) => sum + agent.y, 0) / agents.length;
    return agents.reduce((sum, agent) => sum + (agent.x - cx) ** 2 + (agent.y - cy) ** 2, 0) / agents.length;
  }

  function connectedComponents(agents, threshold = 0.05) {
    const unvisited = new Set(agents.map((_, index) => index));
    const components = [];
    while (unvisited.size > 0) {
      const seed = unvisited.values().next().value;
      unvisited.delete(seed);
      const component = [seed];
      const frontier = [seed];
      while (frontier.length > 0) {
        const i = frontier.pop();
        for (const j of Array.from(unvisited)) {
          if (distance([agents[i].x, agents[i].y], [agents[j].x, agents[j].y]) <= threshold) {
            unvisited.delete(j);
            frontier.push(j);
            component.push(j);
          }
        }
      }
      components.push(component.sort((a, b) => a - b));
    }
    return components.sort((a, b) => b.length - a.length || a[0] - b[0]);
  }

  function summarize(agents, config, clusterThreshold = 0.05) {
    const followersA = agents.filter(agent => distance([agent.x, agent.y], config.signalA) <= 1e-3).length;
    const followersB = agents.filter(agent => distance([agent.x, agent.y], config.signalB) <= 1e-3).length;
    const rmsd = signal => Math.sqrt(agents.reduce((sum, agent) => {
      const d = distance([agent.x, agent.y], signal);
      return sum + d * d;
    }, 0) / agents.length);
    return {
      dispersion: dispersion(agents),
      clusters: connectedComponents(agents, clusterThreshold).length,
      followersA,
      followersB,
      rmsdA: rmsd(config.signalA),
      rmsdB: rmsd(config.signalB),
      jdj: jdjProductAxis(agents, config),
    };
  }

  const api = {
    activeInterval,
    advance,
    axisProjection,
    buildSmallWorldNetwork,
    boundedTarget,
    clamp,
    connectedComponents,
    deffuantPairUpdate,
    deffuantRound,
    dispersion,
    distance,
    friedkinJohnsenStep,
    initialize,
    jdjProductAxis,
    meanDisplacement,
    mulberry32,
    signalWeights,
    step,
    summarize,
    uniqueOpinionCount,
    validateConfig,
    validatePhasedConfig,
  };

  globalScope.Paper1Model = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
}(typeof window !== "undefined" ? window : globalThis));
