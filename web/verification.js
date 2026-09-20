"use strict";

const Model = typeof require === "function" ? require("./model.js") : window.ABMXModel;

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
  first.forEach(agent => approx(agent.x + agent.y, 1));

  const membershipPoint = Model.agentFromMemberships(6 / 7, 1 / 7, { sourceId: "fila-1" });
  approx(membershipPoint.x, 6 / 7);
  approx(membershipPoint.y, 1 / 7);
  approx(Model.distance([membershipPoint.x, membershipPoint.y], [1, 0]), Math.SQRT2 / 7);

  const parsedMemberships = Model.parseMembershipCsv('id,text,A,B\n1,"texto, con coma",0.75,0.25\n2,"dos\nlíneas",0.2,0.8\n');
  assert(parsedMemberships.length === 2, "el lector CSV debe respetar comas y saltos entre comillas");
  approx(parsedMemberships[0].membershipA, 0.75);
  approx(parsedMemberships[1].membershipB, 0.8);
  const importedAgents = Model.initializeFromMemberships(parsedMemberships);
  approx(importedAgents[1].x, 0.2);
  approx(importedAgents[1].y, 0.8);
  let rejectedEmptyMembership = false;
  try { Model.parseMembershipCsv("id,A,B\n1,,0.5\n"); } catch (_error) { rejectedEmptyMembership = true; }
  assert(rejectedEmptyMembership, "el lector CSV no debe convertir una pertenencia vacía en cero");

  const opposite = Model.oppositePosition([0.8, 0.3]);
  approx(opposite[0], 0.2);
  approx(opposite[1], 0.7);
  approx((0.8 + opposite[0]) / 2, 0.5);
  approx((0.3 + opposite[1]) / 2, 0.5);

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
  approx(Model.activeEventWeight({ intensity: 5, start: 20, duration: 60 }, 40, true, 0.01), 5 * Math.exp(-0.2));
  approx(Model.activeEventWeight({ intensity: 5, start: 20, duration: 60 }, 80, true, 0.01), 0);

  const network = Model.buildSmallWorldNetwork(12, 4, 0.1, 123);
  assert(network.every((neighbors, i) => !neighbors.has(i)), "la red no debe contener lazos");
  assert(network.every((neighbors, i) => [...neighbors].every(j => network[j].has(i))), "la red debe ser no dirigida");

  assert(Model.uniqueOpinionCount([{ x: 0.1, y: 0.2 }, { x: 0.1, y: 0.2 }]) === 1,
    "dos posiciones idénticas forman una sola posición numérica");

  assert(Model.socialImpactCoefficient(0.1, 0.2, 0.4, true) > 0,
    "una diferencia pequeña debe producir asimilación");
  assert(Model.socialImpactCoefficient(0.3, 0.2, 0.4, true) < 0,
    "una diferencia grande puede producir reactancia");
  approx(Model.socialImpactCoefficient(0.3, 0.2, 0.4, false), 0);
  approx(Model.radicality({ x: 0.5, y: 0.5 }), 0);
  approx(Model.radicality({ x: 0, y: 0 }), 1);

  const immobileA = Model.assignImmobility(Model.initialize(30, 1), 0.1, 44);
  const immobileB = Model.assignImmobility(Model.initialize(30, 1), 0.1, 44);
  assert(JSON.stringify(immobileA) === JSON.stringify(immobileB),
    "la inmovilidad debe ser reproducible");

  const integratedConfig = {
    ...phasedConfig,
    phase: "integrated",
    socialRate: 0,
    homophilyScale: 0.4,
    reactanceEnabled: true,
    adaptiveCommitment: false,
    commitmentStrength: 1,
    auditorEnabled: true,
    auditorThreshold: 0.5,
    auditorMinDispersion: 0.01,
    centerStrength: 0.1,
    noiseEnabled: false,
    noiseProbability: 0,
    noiseRadius: 0.02,
    immobileShare: 0,
    fatigueEnabled: true,
    fatigueDecay: 0.01,
    signalAReach: 0.2,
    signalBReach: 0.2,
    signalAPermanent: false,
    signalBPermanent: false,
    signalAStart: 0,
    signalADuration: 200,
    signalBStart: 0,
    signalBDuration: 0,
    signalAWeight: 0,
    signalBWeight: 0,
  };
  const integratedAgents = [
    { x: 0, y: 1, anchorX: 0, anchorY: 1, immobile: false },
    { x: 1, y: 0, anchorX: 1, anchorY: 0, immobile: false },
  ];
  const integrated = Model.integratedStep(integratedAgents, integratedConfig, {
    random: Model.mulberry32(7), network: [new Set(), new Set()], t: 0,
  });
  assert(integrated.auditorActive, "el auditor debe activarse ante una división extrema");
  assert(Model.distance([integrated.agents[0].x, integrated.agents[0].y], [0.5, 0.5])
    < Model.distance([0, 1], [0.5, 0.5]), "la intervención debe recentrar gradualmente");

  const permanentConfig = { ...integratedConfig, signalAPermanent: true, signalAWeight: 5 };
  approx(Model.signalWeights(permanentConfig, 900)[0], 5);

  const eventConfig = {
    ...integratedConfig,
    socialRate: 0.1,
    auditorEnabled: false,
    signalAWeight: 0,
    signalBWeight: 0,
  };
  const eventResult = Model.integratedStep([
    { x: 0.2, y: 0.5, anchorX: 0.2, anchorY: 0.5, immobile: false },
    { x: 0.8, y: 0.5, anchorX: 0.8, anchorY: 0.5, immobile: false },
  ], eventConfig, {
    random: Model.mulberry32(8),
    network: [new Set(), new Set()],
    t: 0,
    events: [{ position: [0.1, 0.5], intensity: 5, reach: 0.25, start: 0, duration: 10 }],
  });
  assert(eventResult.agents[0].x < 0.2, "un evento activo debe mover a un agente dentro de su alcance");
  approx(eventResult.agents[1].x, 0.8);

  return { ok: true, tests: 37, publishedExample: example[0], jdjSplit: 1, jdjCenter: 0.5 };
}

if (typeof module !== "undefined" && module.exports) {
  console.log(JSON.stringify(runVerification(), null, 2));
}
