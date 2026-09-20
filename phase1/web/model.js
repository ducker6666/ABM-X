/*
 * Motor científico de la web — Fase 1.
 *
 * Regla social implementada:
 *   N_i(t) = {j : |x_j(t) - x_i(t)| <= epsilon}
 *   x_i(t+1) = sum_{j in N_i(t)} x_j(t) / |N_i(t)|
 *
 * La actualización es síncrona e incluye al propio agente. Referencia:
 * Hegselmann y Krause (2002), https://www.jasss.org/5/3/2.html
 *
 * Este archivo no dibuja ni manipula la interfaz. Es un módulo puro para que
 * las mismas funciones puedan probarse con Node.js y usarse en el navegador.
 */
(function exposeModel(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Phase1Model = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildModel() {
  "use strict";

  const UINT32_SCALE = 4294967296;
  const SCENARIOS = new Set([
    "uniform",
    "central",
    "bipolar_balanced",
    "bipolar_unbalanced",
    "three_groups",
  ]);

  class XorShift32 {
    // Marsaglia (2003). Elección computacional; no es una hipótesis social.
    constructor(seed) {
      if (!Number.isInteger(seed) || seed < 1 || seed >= UINT32_SCALE) {
        throw new Error("La semilla debe estar entre 1 y 2^32 - 1");
      }
      this.state = seed >>> 0;
    }

    random() {
      let x = this.state;
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      this.state = x >>> 0;
      return this.state / UINT32_SCALE;
    }
  }

  function validateConfig(config) {
    if (!Number.isInteger(config.nAgents) || config.nAgents < 2) {
      throw new Error("El número de agentes debe ser al menos 2");
    }
    if (!(config.epsilon >= 0 && config.epsilon <= 1)) {
      throw new Error("epsilon debe estar en [0, 1]");
    }
    if (!Number.isInteger(config.maxSteps) || config.maxSteps < 1) {
      throw new Error("El número de pasos debe ser positivo");
    }
    if (!Number.isInteger(config.seed) || config.seed < 1 || config.seed >= UINT32_SCALE) {
      throw new Error("La semilla debe estar entre 1 y 2^32 - 1");
    }
    if (!SCENARIOS.has(config.scenario)) {
      throw new Error(`Escenario desconocido: ${config.scenario}`);
    }
    if (!(config.clusterThreshold > 0 && config.clusterThreshold <= 1)) {
      throw new Error("clusterThreshold debe estar en (0, 1]");
    }
  }

  function uniformInterval(rng, low, high) {
    return low + (high - low) * rng.random();
  }

  function initializeOpinions(config) {
    validateConfig(config);
    const rng = new XorShift32(config.seed);
    const values = [];
    const n = config.nAgents;
    const half = Math.floor(n / 2);
    const seventyPercent = Math.floor(0.70 * n + 0.5);
    const firstThird = Math.floor(n / 3);
    const secondThird = Math.floor((2 * n) / 3);

    for (let i = 0; i < n; i += 1) {
      if (config.scenario === "uniform") values.push(rng.random());
      else if (config.scenario === "central") {
        values.push(uniformInterval(rng, 0.45, 0.55));
      } else if (config.scenario === "bipolar_balanced") {
        values.push(i < half
          ? uniformInterval(rng, 0.10, 0.30)
          : uniformInterval(rng, 0.70, 0.90));
      } else if (config.scenario === "bipolar_unbalanced") {
        values.push(i < seventyPercent
          ? uniformInterval(rng, 0.10, 0.30)
          : uniformInterval(rng, 0.70, 0.90));
      } else {
        values.push(i < firstThird
          ? uniformInterval(rng, 0.10, 0.20)
          : i < secondThird
            ? uniformInterval(rng, 0.45, 0.55)
            : uniformInterval(rng, 0.80, 0.90));
      }
    }
    return values;
  }

  function validateOpinions(opinions) {
    if (!Array.isArray(opinions) || opinions.length === 0) {
      throw new Error("Se necesita al menos una opinión");
    }
    if (opinions.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) {
      throw new Error("Todas las opiniones deben estar en [0, 1]");
    }
  }

  function step(opinions, epsilon) {
    validateOpinions(opinions);
    if (!(epsilon >= 0 && epsilon <= 1)) throw new Error("epsilon debe estar en [0, 1]");

    const previous = opinions.slice();
    let maxDisplacement = 0;
    const updated = previous.map((focal) => {
      const neighbours = previous.filter((other) => Math.abs(other - focal) <= epsilon);
      const mean = neighbours.reduce((sum, value) => sum + value, 0) / neighbours.length;
      maxDisplacement = Math.max(maxDisplacement, Math.abs(mean - focal));
      return mean;
    });
    return { opinions: updated, maxDisplacement };
  }

  function jdjProduct(opinions) {
    validateOpinions(opinions);
    const mean = opinions.reduce((sum, value) => sum + value, 0) / opinions.length;
    const raw = (1 - mean) * mean;
    return { raw, normalized: 4 * raw };
  }

  function clusterCount(opinions, threshold = 0.05) {
    validateOpinions(opinions);
    if (!(threshold > 0 && threshold <= 1)) throw new Error("threshold debe estar en (0, 1]");
    const ordered = opinions.slice().sort((a, b) => a - b);
    let count = 1;
    for (let i = 1; i < ordered.length; i += 1) {
      if (ordered[i] - ordered[i - 1] > threshold) count += 1;
    }
    return count;
  }

  function summarize(opinions, time, maxDisplacement, clusterThreshold = 0.05) {
    validateOpinions(opinions);
    const mean = opinions.reduce((sum, value) => sum + value, 0) / opinions.length;
    const variance = opinions.reduce((sum, value) => sum + (value - mean) ** 2, 0)
      / opinions.length;
    const jdj = jdjProduct(opinions);
    return {
      time,
      mean,
      variance,
      normalized_variance: 4 * variance,
      span: Math.max(...opinions) - Math.min(...opinions),
      jdj_product_raw: jdj.raw,
      jdj_product_normalized: jdj.normalized,
      clusters: clusterCount(opinions, clusterThreshold),
      max_displacement: maxDisplacement,
    };
  }

  return {
    XorShift32,
    clusterCount,
    initializeOpinions,
    jdjProduct,
    step,
    summarize,
    validateConfig,
  };
});
