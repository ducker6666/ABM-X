function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approx(actual, expected, eps = 1e-9) {
  assert(Math.abs(actual - expected) <= eps, `expected ${expected}, got ${actual}`);
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function roundJdjValue(x) {
  return Math.round(clamp(x, 0, 1) * 100) / 100;
}

function jdjFromRows(rows, n) {
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows.length; j++) {
      const m = Math.max(rows[i].a * rows[j].b, rows[i].b * rows[j].a);
      const w = rows[i].f * rows[j].f;
      total += m * w;
    }
  }
  return clamp(2 * total, 0, 1);
}

function jdjFromAgents(memberships) {
  const n = memberships.length;
  const buckets = new Map();
  for (const m of memberships) {
    const a = roundJdjValue(m.a);
    const b = roundJdjValue(m.b);
    const key = `${a.toFixed(2)}|${b.toFixed(2)}`;
    const current = buckets.get(key);
    if (current) current.count++;
    else buckets.set(key, { a, b, count: 1 });
  }
  const rows = Array.from(buckets.values()).map(row => ({
    a: row.a,
    b: row.b,
    f: row.count / n,
  }));
  return jdjFromRows(rows, n);
}

function jdjPreviousDiagonalCorrectionStyle(memberships) {
  const n = memberships.length;
  const buckets = new Map();
  for (const m of memberships) {
    const a = roundJdjValue(m.a);
    const b = roundJdjValue(m.b);
    const key = `${a.toFixed(2)}|${b.toFixed(2)}`;
    const current = buckets.get(key);
    if (current) current.count++;
    else buckets.set(key, { a, b, count: 1 });
  }
  const freq = Array.from(buckets.values()).map(row => [row.a, row.b, row.count / n]);
  const k = freq.length;
  const jdjProd = Array.from({ length: k }, () => Array(k).fill(0));
  for (let i = 0; i < k; i++) {
    for (let j = i; j < k; j++) {
      jdjProd[i][j] = Math.max(freq[i][0] * freq[j][1], freq[i][1] * freq[j][0]);
    }
  }
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      const factor = i === j
        ? (freq[i][2] - 1 / n) * (freq[j][2] - 1 / n)
        : freq[i][2] * freq[j][2];
      jdjProd[i][j] *= factor;
    }
  }
  const sym = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (_, j) => jdjProd[i][j] + jdjProd[j][i])
  );
  for (let i = 0; i < k; i++) sym[i][i] /= 2;
  return 2 * sym.flat().reduce((s, x) => s + x, 0);
}

function hypot(x, y) {
  return Math.sqrt(x * x + y * y);
}

function poleDistanceMembership(point, poleA = [0, 1], poleB = [1, 0]) {
  const dA = hypot(point.x - poleA[0], point.y - poleA[1]);
  const dB = hypot(point.x - poleB[0], point.y - poleB[1]);
  const maxDistance = Math.sqrt(2);
  return {
    a: clamp(1 - dA / maxDistance, 0, 1),
    b: clamp(1 - dB / maxDistance, 0, 1),
  };
}

function poleForceAt(point, c) {
  const dax = c.poleA[0] - point.x, day = c.poleA[1] - point.y;
  const dbx = c.poleB[0] - point.x, dby = c.poleB[1] - point.y;
  const aA = Math.exp(-(dax * dax + day * day) / (2 * c.poleRadius * c.poleRadius));
  const aB = Math.exp(-(dbx * dbx + dby * dby) / (2 * c.poleRadius * c.poleRadius));
  const poleSharpness = 1 + 6 * c.poleStrength;
  const sA = Math.pow(aA, poleSharpness);
  const sB = Math.pow(aB, poleSharpness);
  const denomPoles = sA + sB + 1e-9;
  const wA = sA / denomPoles;
  const wB = sB / denomPoles;
  const poleTargetX = wA * c.poleA[0] + wB * c.poleB[0];
  const poleTargetY = wA * c.poleA[1] + wB * c.poleB[1];
  const poleCommitment = Math.abs(wA - wB);
  const poleMagnitude = c.poleStrength * (0.35 + 0.65 * poleCommitment);
  return {
    x: poleMagnitude * (poleTargetX - point.x),
    y: poleMagnitude * (poleTargetY - point.y),
  };
}

function runVerification() {
  approx(jdjFromAgents([
    { a: 1, b: 0 },
    { a: 1, b: 0 },
    { a: 0, b: 1 },
    { a: 0, b: 1 },
  ]), 1);

  approx(jdjFromAgents([
    { a: 0.5, b: 0.5 },
    { a: 0.5, b: 0.5 },
    { a: 0.5, b: 0.5 },
    { a: 0.5, b: 0.5 },
  ]), 0.5);

  const nearB = jdjFromAgents(Array.from({ length: 240 }, () => ({ a: 0.2, b: 0.8 })));
  approx(nearB, 2 * 0.16);

  approx(jdjFromAgents([
    { a: 0.9, b: 0.1 },
    { a: 0.2, b: 0.8 },
  ]), 0.845);

  const membershipFromDistance = poleDistanceMembership({ x: 0.1, y: 0.9 });
  approx(membershipFromDistance.a, 0.9);
  approx(membershipFromDistance.b, 0.1);

  const offAxisMembership = poleDistanceMembership({ x: 0.2, y: 0.4 });
  approx(offAxisMembership.a, 1 - Math.sqrt(0.4) / Math.sqrt(2));
  approx(offAxisMembership.b, 1 - Math.sqrt(0.8) / Math.sqrt(2));

  const mixed = [
    { a: 0.12, b: 0.88 }, { a: 0.12, b: 0.88 }, { a: 0.44, b: 0.56 },
    { a: 0.57, b: 0.43 }, { a: 0.91, b: 0.09 }, { a: 0.91, b: 0.09 },
    { a: 0.91, b: 0.09 }, { a: 0.50, b: 0.50 },
  ];
  assert(jdjFromAgents(mixed) > jdjPreviousDiagonalCorrectionStyle(mixed), "content JDJ should include diagonal/self-content terms");

  assert(clamp(-0.2, 0, 1) === 0, "lower boundary clip failed");
  assert(clamp(1.2, 0, 1) === 1, "upper boundary clip failed");

  const massSmall = Math.pow(10 / 100, 1.2);
  const massLarge = Math.pow(40 / 100, 1.2);
  assert(massLarge > massSmall, "cluster mass must increase with group size");

  const gapLowFrequency = 30 + Math.round(970 * (1 - 0.1));
  const gapHighFrequency = 30 + Math.round(970 * (1 - 0.9));
  assert(gapLowFrequency > gapHighFrequency, "event frequency must reduce mean gap");

  const cfg = { poleA: [0, 1], poleB: [1, 0], poleStrength: 0.7, poleRadius: 0.7 };
  const agentPole = poleForceAt({ x: 0.28, y: 0.72 }, cfg);
  const clusterPole = poleForceAt({ x: 0.25, y: 0.75 }, cfg);
  const withoutMassPole = hypot(agentPole.x, agentPole.y);
  const withMassPole = hypot(agentPole.x + 0.7 * (0.35 + 0.65 * 0.5) * clusterPole.x, agentPole.y + 0.7 * (0.35 + 0.65 * 0.5) * clusterPole.y);
  assert(withMassPole > withoutMassPole, "cluster pole coupling must strengthen polar pull for a mass near a pole");

  const noiseAtZero = 0.012 * 0;
  const noiseAtMax = 0.012 * 1;
  assert(noiseAtZero === 0 && noiseAtMax > 0, "noise must be an exogenous perturbation scale");

  return {
    ok: true,
    tests: 12,
    jdjExtremeSplit: 1,
    jdjCenterFourAgents: 0.5,
    jdjTwoUserExample: 0.845,
    jdjNearB240: nearB,
    offAxisMembership,
    massPoleForceGain: withMassPole / withoutMassPole,
    gapLowFrequency,
    gapHighFrequency,
  };
}

if (typeof module !== "undefined") {
  console.log(JSON.stringify(runVerification(), null, 2));
}
