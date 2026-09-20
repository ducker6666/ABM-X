/*
 * Motor científico del laboratorio de dinámica de opinión.
 *
 * Esta parte no dibuja nada: solo implementa la ecuación documentada en
 * formula.html y en src/integrated_model.py. Separar modelo e interfaz permite
 * comprobar que un botón o un color no cambien accidentalmente la teoría.
 * La interfaz usa una sola composición integrada. Se conservan funciones
 * clásicas únicamente para pruebas de regresión. La composición NO se presenta
 * como una teoría publicada íntegramente: cada término tiene una fuente y la
 * forma de unirlos es una decisión explícita documentada en formula.html.
 *
 * Regla integrada por agente i (actualización síncrona):
 *
 * x_i(t+1) = clip[x_i + {eta(G_i + P_i + E_i) + R_i}/k_i].
 *
 * G_i agrega contactos; P_i agrega los polos permanentes A/B; E_i agrega
 * eventos temporales; R_i es el recentrado del auditor; k_i es resistencia
 * por extremidad. Cada término y un ejemplo numérico están en formula.html.
 * Las funciones HK/FJ/DW que aparecen más abajo se conservan solo como
 * controles de regresión y ya no son opciones de la interfaz.
 */

(function attachABMXModel(globalScope) {
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

  function positionFromMemberships(membershipA, membershipB) {
    /*
     * Contrato de entrada: A y B son grados de pertenencia observados, no
     * distancias. Por eso no se inventa una triangulacion: la posicion es
     * exactamente (A,B). La distancia euclidea se calcula despues.
     *
     * Ejemplo del CSV inspeccionado: A=6/7 y B=1/7 -> (x,y)=(6/7,1/7).
     */
    if (![membershipA, membershipB].every(value => Number.isFinite(value) && value >= 0 && value <= 1)) {
      throw new Error("A y B deben ser números entre 0 y 1");
    }
    return [membershipA, membershipB];
  }

  function agentFromMemberships(membershipA, membershipB, metadata = {}) {
    const [x, y] = positionFromMemberships(membershipA, membershipB);
    return {
      ...metadata,
      membershipA,
      membershipB,
      x,
      y,
      anchorX: x,
      anchorY: y,
      previousX: x,
      previousY: y,
    };
  }

  function parseCsvRows(text) {
    // Lector RFC 4180 minimo: respeta comas y saltos de linea entre comillas.
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const character = text[i];
      if (quoted) {
        if (character === '"' && text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          field += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ",") {
        row.push(field);
        field = "";
      } else if (character === "\n") {
        row.push(field.replace(/\r$/, ""));
        if (row.some(value => value !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += character;
      }
    }
    row.push(field.replace(/\r$/, ""));
    if (row.some(value => value !== "")) rows.push(row);
    if (quoted) throw new Error("CSV no válido: falta cerrar una comilla");
    return rows;
  }

  function parseMembershipCsv(text) {
    const rows = parseCsvRows(String(text).replace(/^\uFEFF/, ""));
    if (rows.length < 2) throw new Error("El CSV debe contener cabecera y al menos una fila");
    const headers = rows[0].map(value => value.trim().toLowerCase());
    const indexA = headers.indexOf("a");
    const indexB = headers.indexOf("b");
    const indexId = headers.indexOf("id");
    if (indexA < 0 || indexB < 0) throw new Error('El CSV necesita columnas llamadas "A" y "B"');
    return rows.slice(1).map((values, index) => {
      const rawA = values[indexA]?.trim();
      const rawB = values[indexB]?.trim();
      if (!rawA || !rawB) throw new Error(`Fila ${index + 2}: A y B no pueden estar vacíos`);
      const membershipA = Number(rawA);
      const membershipB = Number(rawB);
      try {
        positionFromMemberships(membershipA, membershipB);
      } catch (error) {
        throw new Error(`Fila ${index + 2}: ${error.message}`);
      }
      return {
        membershipA,
        membershipB,
        sourceId: indexId >= 0 ? values[indexId] : String(index + 1),
      };
    });
  }

  function initializeFromMemberships(rows) {
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("No hay filas A/B para inicializar");
    return rows.map(row => agentFromMemberships(row.membershipA, row.membershipB, {
      sourceId: row.sourceId,
    }));
  }

  function oppositePosition(position) {
    /* Reflexion respecto a M=(0.5,0.5): C=2M-E=(1-x,1-y). */
    if (!Array.isArray(position) || position.length !== 2) throw new Error("La posición debe tener dos coordenadas");
    return position.map(value => {
      if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error("La posición debe pertenecer a [0,1]²");
      return 1 - value;
    });
  }

  function validateConfig(config) {
    if (!Number.isFinite(config.epsilon) || config.epsilon < 0) {
      throw new Error("epsilon debe ser un número no negativo");
    }
    for (const key of ["signalAWeight", "signalBWeight"]) {
      if (!Number.isFinite(config[key]) || config[key] < 0 || config[key] > 10) {
        throw new Error(`${key} debe pertenecer a [0,10]`);
      }
    }
    for (const key of ["signalAReach", "signalBReach"]) {
      if (config[key] !== undefined && (!Number.isFinite(config[key]) || config[key] <= 0 || config[key] > 1)) {
        throw new Error(`${key} debe pertenecer a (0,1]`);
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
      let membershipA;
      let membershipB;
      if (scenario === "uniform") {
        membershipA = random();
        membershipB = random();
      } else if (scenario === "central") {
        membershipA = clamp(normal(random, 0.5, 0.10), 0, 1);
        membershipB = clamp(normal(random, 0.5, 0.10), 0, 1);
      } else if (scenario === "two_groups") {
        const first = i < Math.floor(nAgents / 2);
        membershipA = clamp(normal(random, first ? 0.75 : 0.25, 0.09), 0, 1);
        membershipB = clamp(normal(random, first ? 0.25 : 0.75, 0.09), 0, 1);
      } else {
        throw new Error("escenario inicial desconocido");
      }
      // En la población sintética A y B se sortean por separado. Esto es un
      // escenario nulo reproducible: permite ambivalencia (A y B altos) y
      // desvinculación (A y B bajos) sin inventarlas en los datos importados.
      // Un CSV siempre conserva exactamente los valores A/B observados.
      agents.push(agentFromMemberships(membershipA, membershipB));
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
    if (config.phase === "integrated") {
      const permanent = [Boolean(config.signalAPermanent), Boolean(config.signalBPermanent)];
      const windowed = [
        config.signalAWeight * (permanent[0] ? 1 : activeInterval(t, config.signalAStart, config.signalADuration)),
        config.signalBWeight * (permanent[1] ? 1 : activeInterval(t, config.signalBStart, config.signalBDuration)),
      ];
      if (!config.fatigueEnabled) return windowed;
      // Decaimiento de atención: m_k(t)=m_k exp[-lambda(t-s_k)] dentro
      // de su ventana. Es la discretización más simple del término de pérdida
      // de atención -c h(t) descrito por Schweitzer et al. (2020).
      return [
        permanent[0] ? windowed[0] : windowed[0] * Math.exp(-config.fatigueDecay * Math.max(0, t - config.signalAStart)),
        permanent[1] ? windowed[1] : windowed[1] * Math.exp(-config.fatigueDecay * Math.max(0, t - config.signalBStart)),
      ];
    }
    if (config.phase !== "temporal") return [config.signalAWeight, config.signalBWeight];
    return [
      config.signalAWeight * activeInterval(t, config.signalAStart, config.signalADuration),
      config.signalBWeight * activeInterval(t, config.signalBStart, config.signalBDuration),
    ];
  }

  function activeEventWeight(event, t, fatigueEnabled = true, fatigueDecay = 0) {
    // Un evento declarado solo existe dentro de [inicio, inicio+duracion).
    // Si se activa la pérdida de atención, su intensidad cae exponencialmente.
    if (!activeInterval(t, event.start, event.duration)) return 0;
    const decay = fatigueEnabled ? Math.exp(-fatigueDecay * (t - event.start)) : 1;
    return event.intensity * decay;
  }

  function validatePhasedConfig(config, nAgents) {
    validateConfig(config);
    const phases = new Set(["integrated", "hk", "dw", "fj", "network", "temporal"]);
    if (!phases.has(config.phase)) throw new Error("modelo desconocido");
    if (!(config.compromiseRate > 0 && config.compromiseRate <= 0.5)) {
      throw new Error("mu debe pertenecer a (0, 0.5]");
    }
    if (!(config.interactionsPerAgent > 0)) throw new Error("los contactos por agente deben ser positivos");
    if (!(config.anchorWeight >= 0 && config.anchorWeight <= 1)) throw new Error("g debe pertenecer a [0,1]");
    if (!Number.isInteger(config.networkDegree) || config.networkDegree < 2 || config.networkDegree % 2 !== 0) {
      throw new Error("el grado de red debe ser un entero par mayor o igual que 2");
    }
    if (["integrated", "network", "temporal"].includes(config.phase) && config.networkDegree >= nAgents) {
      throw new Error("el grado de red debe ser menor que el número de agentes");
    }
    if (!(config.networkRewiring >= 0 && config.networkRewiring <= 1)) throw new Error("beta debe pertenecer a [0,1]");
    if (config.phase === "integrated") {
      if (!(config.socialRate >= 0 && config.socialRate <= 1)) throw new Error("eta debe pertenecer a [0,1]");
      if (!(config.homophilyScale > 0)) throw new Error("BH debe ser positivo");
      if (!(config.commitmentStrength >= 0)) throw new Error("s debe ser no negativo");
      if (!(config.centerStrength >= 0 && config.centerStrength <= 1)) throw new Error("alpha debe pertenecer a [0,1]");
      if (!(config.auditorThreshold >= 0 && config.auditorThreshold <= 1)) throw new Error("el umbral JDJ debe pertenecer a [0,1]");
      if (!(config.auditorMinDispersion >= 0)) throw new Error("la dispersión mínima debe ser no negativa");
      if (!(config.fatigueDecay >= 0)) throw new Error("lambda debe ser no negativo");
      if (!(config.noiseProbability >= 0 && config.noiseProbability <= 1)) throw new Error("la probabilidad de ruido debe pertenecer a [0,1]");
      if (!(config.noiseRadius >= 0 && config.noiseRadius <= 1)) throw new Error("el radio de ruido debe pertenecer a [0,1]");
      if (!(config.immobileShare >= 0 && config.immobileShare <= 1)) throw new Error("la fracción inmóvil debe pertenecer a [0,1]");
    }
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

  function radicality(agent) {
    // Adaptación 2D declarada del |50-O_i|/50 de Duggins (2017).
    // La esquina del cuadrado está a sqrt(1/2) del centro; dividir por esa
    // distancia deja r_i entre 0 (centro) y 1 (esquina).
    return clamp(distance([agent.x, agent.y], [0.5, 0.5]) / Math.sqrt(0.5), 0, 1);
  }

  function socialImpactCoefficient(opinionDistance, tolerance, homophilyScale, reactanceEnabled) {
    /*
     * Zhang, Hu y Zhang (2025), ecuaciones 2--3:
     *   D(d)=1-d/BT si d<2BT; D(d)=-1 en otro caso
     *   q(d)=D(d) exp(-d/BH)
     * q>0 aproxima opiniones; q<0 las separa. En nuestra extensión vectorial
     * d es euclídea y q multiplica el vector (x_j-x_i).
     */
    const contrast = opinionDistance < 2 * tolerance
      ? 1 - opinionDistance / Math.max(tolerance, 1e-12)
      : -1;
    const signed = reactanceEnabled ? contrast : Math.max(0, contrast);
    return signed * Math.exp(-opinionDistance / homophilyScale);
  }

  function boundedNoise(agent, radius, random) {
    // Ruido local de Pineda, Toral y Hernandez-Garcia (2013): con cierta
    // probabilidad se sustituye la interacción por un salto aleatorio acotado
    // alrededor de la opinión actual. Esta es su extensión componente a
    // componente en [0,1]^2.
    return {
      ...agent,
      x: clamp(agent.x + (2 * random() - 1) * radius, 0, 1),
      y: clamp(agent.y + (2 * random() - 1) * radius, 0, 1),
      previousX: agent.x,
      previousY: agent.y,
    };
  }

  function assignImmobility(agents, share, seed) {
    // Los agentes inmóviles son agentes obstinados: conservan su opinión.
    // La semilla hace reproducible qué individuos pertenecen a esa fracción.
    const random = mulberry32(seed);
    return agents.map(agent => ({ ...agent, immobile: random() < share }));
  }

  function weightedSourceDisplacement(agent, sources) {
    /*
     * Media DeGroot con peso propio 1. Una fuente de intensidad w aporta
     * w(target-agent); dividir por 1+sum(w) conserva el punto propio en la
     * media y hace que una intensidad mayor produzca un paso mayor acotado.
     */
    let x = 0;
    let y = 0;
    let mass = 0;
    for (const source of sources) {
      const [position, weight, reach] = source;
      if (weight > 0 && distance([agent.x, agent.y], position) <= reach) {
        x += weight * (position[0] - agent.x);
        y += weight * (position[1] - agent.y);
        mass += weight;
      }
    }
    return [x / (1 + mass), y / (1 + mass)];
  }

  function integratedStep(agents, config, runtime) {
    /*
     * Composición auditable (no una teoría publicada como conjunto):
     *
     * x_i(t+1)=clip[x_i + {eta(G_i+P_i+E_i)+R_i}/k_i]
     * k_i=1+s r_i.
     *
     * G_i suma influencia de contactos; por eso un grupo con más miembros
     * aporta más términos ("masa" social) sin introducir gravedad newtoniana.
     * P_i contiene los polos obstinados y E_i los eventos temporales. R_i es
     * la decisión del auditor: solo existe si JDJ y dispersión superan los
     * umbrales declarados.
     */
    const beforeJdj = jdjEuclidean(agents, config);
    const beforeDispersion = dispersion(agents);
    const auditorActive = Boolean(config.auditorEnabled)
      && beforeJdj >= config.auditorThreshold
      && beforeDispersion >= config.auditorMinDispersion;
    const [weightA, weightB] = signalWeights(config, runtime.t);
    const old = agents.map(agent => ({ ...agent }));

    const next = old.map((agent, i) => {
      if (agent.immobile) {
        return { ...agent, previousX: agent.x, previousY: agent.y };
      }
      if (config.noiseEnabled && runtime.random() < config.noiseProbability) {
        return boundedNoise(agent, config.noiseRadius, runtime.random);
      }

      const candidates = runtime.network
        ? [...runtime.network[i]]
        : old.map((_, index) => index).filter(index => index !== i);
      let peerX = 0;
      let peerY = 0;
      for (const j of candidates) {
        const d = distance([agent.x, agent.y], [old[j].x, old[j].y]);
        const q = socialImpactCoefficient(d, config.epsilon, config.homophilyScale, config.reactanceEnabled);
        peerX += q * (old[j].x - agent.x);
        peerY += q * (old[j].y - agent.y);
      }
      const peerDenominator = Math.max(1, candidates.length);
      peerX /= peerDenominator;
      peerY /= peerDenominator;

      // Una señal de intensidad m equivale al peso de m fuentes obstinadas
      // iguales dentro de su alcance rho. Los eventos temporales usan la misma
      // operación; cambia únicamente su ventana de actividad.
      const poleSources = [
        [config.signalA, weightA, config.signalAReach ?? config.epsilon],
        [config.signalB, weightB, config.signalBReach ?? config.epsilon],
      ];
      const eventSources = [];
      for (const event of runtime.events ?? []) {
        eventSources.push([
          event.position,
          activeEventWeight(event, runtime.t, config.fatigueEnabled, config.fatigueDecay),
          event.reach,
        ]);
      }
      const [poleX, poleY] = weightedSourceDisplacement(agent, poleSources);
      const [eventX, eventY] = weightedSourceDisplacement(agent, eventSources);

      const commitment = config.adaptiveCommitment
        ? 1 + config.commitmentStrength * radicality(agent)
        : 1;
      const centerX = auditorActive ? config.centerStrength * (0.5 - agent.x) : 0;
      const centerY = auditorActive ? config.centerStrength * (0.5 - agent.y) : 0;
      // Suma final por coordenada. El ruido y la inmovilidad se resuelven en
      // las ramas anteriores; aqui actuan a la vez grupo, polos, eventos y
      // recentrado, antes de dividir por la resistencia.
      const deltaX = (config.socialRate * (peerX + poleX + eventX) + centerX) / commitment;
      const deltaY = (config.socialRate * (peerY + poleY + eventY) + centerY) / commitment;
      return {
        ...agent,
        x: clamp(agent.x + deltaX, 0, 1),
        y: clamp(agent.y + deltaY, 0, 1),
        previousX: agent.x,
        previousY: agent.y,
      };
    });
    const activeEvents = (runtime.events ?? []).filter(event => (
      activeEventWeight(event, runtime.t, config.fatigueEnabled, config.fatigueDecay) > 0
    )).length;
    return { agents: next, auditorActive, activeEvents, jdjBefore: beforeJdj, dispersionBefore: beforeDispersion };
  }

  function advance(agents, config, runtime) {
    validatePhasedConfig(config, agents.length);
    const before = agents.map(agent => ({ ...agent }));
    let next;
    let diagnostics = { auditorActive: false };
    if (config.phase === "integrated") {
      diagnostics = integratedStep(agents, config, runtime);
      next = diagnostics.agents;
    } else if (config.phase === "hk") next = step(agents, config);
    else if (config.phase === "dw") next = deffuantRound(agents, config, runtime.random, runtime.t);
    else if (config.phase === "fj") next = friedkinJohnsenStep(agents, config, null, runtime.t);
    else next = friedkinJohnsenStep(agents, config, runtime.network, runtime.t);
    return {
      agents: next,
      meanMove: meanDisplacement(before, next),
      auditorActive: diagnostics.auditorActive,
      activeEvents: diagnostics.activeEvents ?? 0,
    };
  }

  function axisProjection(agent, config) {
    // Solo color y exportación geométrica. OBSOLETA para calcular JDJ.
    const ax = config.signalA[0];
    const ay = config.signalA[1];
    const dx = config.signalB[0] - ax;
    const dy = config.signalB[1] - ay;
    return clamp(((agent.x - ax) * dx + (agent.y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
  }

  function euclideanMemberships(agent) {
    // Polos fijos: A=(1,0), B=(0,1). No normalizar la suma de pertenencias.
    if (![agent.x, agent.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) {
      throw new Error("JDJ requiere posiciones en [0,1]²");
    }
    return { a: 1 - distance([agent.x, agent.y], [1, 0]) / Math.SQRT2,
      b: 1 - distance([agent.x, agent.y], [0, 1]) / Math.SQRT2 };
  }

  function jdjEuclideanDetails(agents) {
    // El producto y el máximo son los operadores de Guevara et al. (2020).
    // El factor 2 es una normalización operativa declarada: hace que una
    // división dura 50/50 entre A y B tome el valor 1.
    if (agents.length === 0) {
      return { value: 0, pairSum: 0, totalPairs: 0, meanPair: 0, meanMembershipA: 0 };
    }
    const memberships = agents.map(euclideanMemberships);
    let total = 0;
    for (const first of memberships) {
      for (const second of memberships) {
        total += Math.max(first.a * second.b, first.b * second.a);
      }
    }
    const totalPairs = agents.length * agents.length;
    return {
      value: 2 * total / totalPairs,
      pairSum: total,
      totalPairs,
      meanPair: total / totalPairs,
      meanMembershipA: memberships.reduce((sum, membership) => sum + membership.a, 0) / agents.length,
    };
  }

  function jdjEuclidean(agents, config) {
    return jdjEuclideanDetails(agents, config).value;
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
    const jdjDetails = jdjEuclideanDetails(agents, config);
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
      jdj: jdjDetails.value,
      jdjPairSum: jdjDetails.pairSum,
      jdjTotalPairs: jdjDetails.totalPairs,
      jdjMeanMembershipA: jdjDetails.meanMembershipA,
    };
  }

  const api = {
    activeInterval,
    activeEventWeight,
    advance,
    assignImmobility,
    agentFromMemberships,
    axisProjection,
    buildSmallWorldNetwork,
    boundedNoise,
    boundedTarget,
    clamp,
    connectedComponents,
    deffuantPairUpdate,
    deffuantRound,
    dispersion,
    distance,
    friedkinJohnsenStep,
    initialize,
    integratedStep,
    jdjEuclidean,
    euclideanMemberships,
    jdjEuclideanDetails,
    meanDisplacement,
    mulberry32,
    oppositePosition,
    parseMembershipCsv,
    positionFromMemberships,
    radicality,
    signalWeights,
    socialImpactCoefficient,
    step,
    summarize,
    uniqueOpinionCount,
    validateConfig,
    validatePhasedConfig,
    weightedSourceDisplacement,
    initializeFromMemberships,
  };

  globalScope.ABMXModel = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
}(typeof window !== "undefined" ? window : globalThis));
