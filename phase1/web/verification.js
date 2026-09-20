"use strict";

const assert = require("node:assert/strict");
const model = require("./model.js");

const config = {
  nAgents: 8,
  epsilon: 0.2,
  maxSteps: 4,
  seed: 2026,
  scenario: "uniform",
  clusterThreshold: 0.05,
};

const initial = model.initializeOpinions(config);
const result = model.step(initial, config.epsilon);
const jdj = model.jdjProduct(result.opinions);

const referenceRng = new model.XorShift32(1);
const referenceSequence = Array.from(
  { length: 5 },
  () => Math.round(referenceRng.random() * 2 ** 32),
);
assert.deepEqual(referenceSequence, [270369, 67634689, 2647435461, 307599695, 2398689233]);

assert.deepEqual(model.step([0.2, 0.3, 0.9], 0.15).opinions, [0.25, 0.25, 0.9]);
assert.equal(model.clusterCount([0.10, 0.12, 0.50, 0.53, 0.90], 0.05), 3);
assert.equal(model.jdjProduct([0, 1]).normalized, 1);
assert.equal(model.jdjProduct([0.5, 0.5]).normalized, 1);
assert.equal(model.jdjProduct([0, 0]).normalized, 0);

const payload = {
  initial,
  initial_by_scenario: Object.fromEntries([
    "uniform",
    "central",
    "bipolar_balanced",
    "bipolar_unbalanced",
    "three_groups",
  ].map((scenario) => [
    scenario,
    model.initializeOpinions({ ...config, nAgents: 15, seed: 12345, scenario }),
  ])),
  after_one: result.opinions,
  displacement: result.maxDisplacement,
  jdj_raw: jdj.raw,
  jdj_normalized: jdj.normalized,
};

if (process.argv.includes("--json")) process.stdout.write(JSON.stringify(payload));
else console.log("Fase 1 JS: verificaciones superadas", payload);
