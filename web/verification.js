"use strict";

const Model = typeof require === "function" ? require("./model.js") : window.Paper1Model;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approx(actual, expected, tolerance = 1e-10) {
  assert(Math.abs(actual - expected) <= tolerance, `esperado ${expected}; obtenido ${actual}`);
}

function runVerification() {
  approx(Model.distance([0, 0], [0.3, 0.4]), 0.5);

  const exampleConfig = {
    epsilon: 0.15,
    signalA: [0.1, 0.2],
    signalB: [0.9, 0.9],
    signalAWeight: 2,
    signalBWeight: 0,
  };
  const example = Model.step([
    { x: 0.2, y: 0.2 },
    { x: 0.3, y: 0.2 },
  ], exampleConfig);
  approx(example[0].x, 0.175);
  approx(example[0].y, 0.2);

  const synchronous = Model.step([
    { x: 0.0, y: 0.0 },
    { x: 0.4, y: 0.0 },
    { x: 0.8, y: 0.0 },
  ], {
    epsilon: 0.41,
    signalA: [0, 1],
    signalB: [1, 0],
    signalAWeight: 0,
    signalBWeight: 0,
  });
  approx(synchronous[0].x, 0.2);
  approx(synchronous[1].x, 0.4);
  approx(synchronous[2].x, 0.6);

  const axisConfig = {
    epsilon: 0.2,
    signalA: [0, 1],
    signalB: [1, 0],
    signalAWeight: 5,
    signalBWeight: 5,
  };
  approx(Model.axisProjection({ x: 0, y: 1 }, axisConfig), 0);
  approx(Model.axisProjection({ x: 0.5, y: 0.5 }, axisConfig), 0.5);
  approx(Model.axisProjection({ x: 1, y: 0 }, axisConfig), 1);

  const split = [
    { x: 0, y: 1 }, { x: 0, y: 1 },
    { x: 1, y: 0 }, { x: 1, y: 0 },
  ];
  const center = Array.from({ length: 4 }, () => ({ x: 0.5, y: 0.5 }));
  approx(Model.jdjProductAxis(split, axisConfig), 1);
  approx(Model.jdjProductAxis(center, axisConfig), 0.5);
  assert(Model.dispersion(split) > Model.dispersion(center), "la dispersión debe distinguir extremos y centro");

  const clusters = Model.connectedComponents([
    { x: 0.10, y: 0.10 },
    { x: 0.12, y: 0.10 },
    { x: 0.80, y: 0.80 },
  ], 0.05);
  assert(clusters.length === 2, "deben detectarse dos componentes");

  const first = Model.initialize(5, 123, "uniform");
  const second = Model.initialize(5, 123, "uniform");
  assert(JSON.stringify(first) === JSON.stringify(second), "la semilla debe reproducir la inicialización");

  const [dwFirst, dwSecond] = Model.deffuantPairUpdate([0, 0], [0.2, 0.2], 0.1);
  approx(dwFirst[0], 0.02);
  approx(dwSecond[0], 0.18);

  const phasedConfig = {
    ...axisConfig,
    phase: "fj",
    epsilon: 2,
    anchorWeight: 0.9,
    compromiseRate: 0.1,
    interactionsPerAgent: 0.5,
    networkDegree: 2,
    networkRewiring: 0.1,
    signalAStart: 2,
    signalADuration: 3,
    signalBStart: 4,
    signalBDuration: 2,
  };
  const anchored = Model.friedkinJohnsenStep([
    { x: 0, y: 0, anchorX: 0, anchorY: 0 },
    { x: 1, y: 1, anchorX: 1, anchorY: 1 },
  ], phasedConfig, null, 0);
  assert(anchored[0].x < anchored[1].x, "el anclaje FJ debe conservar diferencias iniciales");

  assert(Model.activeInterval(2, 2, 3) === 1, "el inicio del intervalo es inclusivo");
  assert(Model.activeInterval(5, 2, 3) === 0, "el final del intervalo es exclusivo");

  const network = Model.buildSmallWorldNetwork(12, 4, 0.1, 123);
  assert(network.every((neighbors, i) => !neighbors.has(i)), "la red no debe contener lazos");
  assert(network.every((neighbors, i) => [...neighbors].every(j => network[j].has(i))), "la red debe ser no dirigida");

  assert(Model.uniqueOpinionCount([{ x: 0.1, y: 0.2 }, { x: 0.1, y: 0.2 }]) === 1,
    "dos posiciones idénticas forman una sola posición numérica");

  return { ok: true, tests: 18, publishedExample: example[0], jdjSplit: 1, jdjCenter: 0.5 };
}

if (typeof module !== "undefined" && module.exports) {
  console.log(JSON.stringify(runVerification(), null, 2));
}
