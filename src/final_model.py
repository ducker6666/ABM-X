"""Executable literature-based model for political polarization.

The model starts from network Hegselmann-Krause bounded confidence, adds
Friedkin-Johnsen anchoring, constant pole signals, temporary events with decay,
fatigue, and an optional feedback from global/local fuzzy polarization to each
agent's confidence bound.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

from .baseline_hk import apply_boundary


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class Pole:
    position: tuple[float, ...]
    strength: float = 0.0
    reach: float = 1.0
    sign: float = 1.0


@dataclass(frozen=True)
class Event:
    position: tuple[float, ...]
    start: int
    duration: int
    intensity: float
    reach: float = 0.25
    decay: float = 0.05
    sign: float = 1.0

    def activity(self, t: int) -> float:
        if t < self.start or t >= self.start + self.duration:
            return 0.0
        age = t - self.start
        return float(self.intensity * np.exp(-self.decay * age))


@dataclass(frozen=True)
class FinalModelConfig:
    n_agents: int = 200
    dimensions: int = 2
    steps: int = 200
    seed: int = 123
    epsilon_mean: float = 0.28
    epsilon_sd: float = 0.04
    epsilon_min: float = 0.05
    epsilon_max: float = 0.75
    mu_mean: float = 0.45
    mu_sd: float = 0.05
    lambda_mean: float = 0.08
    lambda_sd: float = 0.03
    alpha_mean: float = 0.01
    alpha_sd: float = 0.005
    fatigue_memory: float = 0.9
    fatigue_sensitivity: float = 0.02
    feedback_global: float = 0.0
    feedback_local: float = 0.0
    boundary: str = "clip"
    network: str = "sbm"
    p_in: float = 0.18
    p_out: float = 0.03
    poles: tuple[Pole, ...] = field(default_factory=tuple)
    events: tuple[Event, ...] = field(default_factory=tuple)

    def validate(self) -> None:
        if self.n_agents <= 0:
            raise ValueError("n_agents must be positive")
        if self.dimensions <= 0:
            raise ValueError("dimensions must be positive")
        if self.steps < 0:
            raise ValueError("steps must be non-negative")
        if not 0 <= self.epsilon_min <= self.epsilon_mean <= self.epsilon_max:
            raise ValueError("require epsilon_min <= epsilon_mean <= epsilon_max")
        if self.epsilon_sd < 0 or self.mu_sd < 0 or self.lambda_sd < 0 or self.alpha_sd < 0:
            raise ValueError("standard deviations must be non-negative")
        if not 0 <= self.mu_mean <= 1:
            raise ValueError("mu_mean must lie in [0, 1]")
        if not 0 <= self.lambda_mean <= 1:
            raise ValueError("lambda_mean must lie in [0, 1]")
        if not 0 <= self.fatigue_memory <= 1:
            raise ValueError("fatigue_memory must lie in [0, 1]")
        if self.boundary not in {"clip", "reflect"}:
            raise ValueError("boundary must be 'clip' or 'reflect'")
        if self.network not in {"complete", "sbm"}:
            raise ValueError("network must be 'complete' or 'sbm'")


def polarization_poles(config: FinalModelConfig, dimensions: int) -> tuple[FloatArray, FloatArray]:
    """Return the two poles used to measure ideological polarization."""

    if len(config.poles) >= 2:
        pole_a = np.asarray(config.poles[0].position, dtype=np.float64)
        pole_b = np.asarray(config.poles[1].position, dtype=np.float64)
    elif dimensions == 2:
        pole_a = np.array([0.0, 1.0], dtype=np.float64)
        pole_b = np.array([1.0, 0.0], dtype=np.float64)
    else:
        pole_a = np.zeros(dimensions, dtype=np.float64)
        pole_b = np.ones(dimensions, dtype=np.float64)
    if pole_a.shape != (dimensions,) or pole_b.shape != (dimensions,):
        raise ValueError("polarization poles must match opinion dimensions")
    return pole_a, pole_b


@dataclass
class ModelState:
    opinions: FloatArray
    adjacency: FloatArray
    anchors: FloatArray
    epsilon: FloatArray
    mu: FloatArray
    lambda_anchor: FloatArray
    alpha_activation: FloatArray
    fatigue: FloatArray
    groups: NDArray[np.int_]


def _truncated_normal(
    rng: np.random.Generator,
    mean: float,
    sd: float,
    low: float,
    high: float,
    size: int,
) -> FloatArray:
    if sd == 0:
        return np.full(size, mean, dtype=np.float64)
    return np.clip(rng.normal(mean, sd, size=size), low, high)


def generate_adjacency(config: FinalModelConfig, rng: np.random.Generator) -> tuple[FloatArray, NDArray[np.int_]]:
    n = config.n_agents
    groups = np.zeros(n, dtype=int)
    groups[n // 2 :] = 1
    if config.network == "complete":
        adjacency = np.ones((n, n), dtype=np.float64) - np.eye(n, dtype=np.float64)
        return adjacency, groups
    probs = np.where(groups[:, None] == groups[None, :], config.p_in, config.p_out)
    adjacency = (rng.random((n, n)) < probs).astype(np.float64)
    adjacency = np.triu(adjacency, 1)
    adjacency = adjacency + adjacency.T
    return adjacency, groups


def initialize(config: FinalModelConfig) -> ModelState:
    config.validate()
    rng = np.random.default_rng(config.seed)
    opinions = rng.random((config.n_agents, config.dimensions), dtype=np.float64)
    adjacency, groups = generate_adjacency(config, rng)
    epsilon = _truncated_normal(rng, config.epsilon_mean, config.epsilon_sd, config.epsilon_min, config.epsilon_max, config.n_agents)
    mu = _truncated_normal(rng, config.mu_mean, config.mu_sd, 0.0, 1.0, config.n_agents)
    lambda_anchor = _truncated_normal(rng, config.lambda_mean, config.lambda_sd, 0.0, 1.0, config.n_agents)
    alpha_activation = _truncated_normal(rng, config.alpha_mean, config.alpha_sd, 0.0, np.inf, config.n_agents)
    return ModelState(
        opinions=opinions,
        adjacency=adjacency,
        anchors=opinions.copy(),
        epsilon=epsilon,
        mu=mu,
        lambda_anchor=lambda_anchor,
        alpha_activation=alpha_activation,
        fatigue=np.zeros(config.n_agents, dtype=np.float64),
        groups=groups,
    )


def fuzzy_pole_membership(opinions: FloatArray, pole_a: FloatArray, pole_b: FloatArray) -> FloatArray:
    dist_a = np.linalg.norm(opinions - pole_a, axis=1)
    dist_b = np.linalg.norm(opinions - pole_b, axis=1)
    score_a = 1.0 / (dist_a + 1e-9)
    score_b = 1.0 / (dist_b + 1e-9)
    total = score_a + score_b
    return np.column_stack((score_a / total, score_b / total))


def fuzzy_polarization(opinions: FloatArray, pole_a: FloatArray | None = None, pole_b: FloatArray | None = None) -> float:
    """Balanced two-pole fuzzy polarization in [0, 1].

    It is high when agents are separated toward opposite poles and both sides
    have comparable mass. It is low under centered consensus or one-sided
    concentration. This is JDJ-like, not a claim to reproduce the exact JDJ
    formula.
    """

    x = np.asarray(opinions, dtype=np.float64)
    if len(x) < 2:
        return 0.0
    if pole_a is None:
        pole_a = np.zeros(x.shape[1], dtype=np.float64)
    if pole_b is None:
        pole_b = np.ones(x.shape[1], dtype=np.float64)
    memberships = fuzzy_pole_membership(x, pole_a, pole_b)
    return polarization_from_side_scores(memberships[:, 1])


def polarization_from_side_scores(side_b: FloatArray) -> float:
    side = np.asarray(side_b, dtype=np.float64)
    if len(side) < 2:
        return 0.0
    mean_side = float(np.mean(side))
    balance = 4.0 * mean_side * (1.0 - mean_side)
    separation = 4.0 * float(np.var(side))
    return float(np.clip(balance * separation, 0.0, 1.0))


def local_fuzzy_polarization(
    state: ModelState,
    pole_a: FloatArray | None = None,
    pole_b: FloatArray | None = None,
) -> FloatArray:
    return local_fuzzy_polarization_from(state.opinions, state.adjacency, pole_a, pole_b)


def local_fuzzy_polarization_from(
    opinions: FloatArray,
    adjacency: FloatArray,
    pole_a: FloatArray | None = None,
    pole_b: FloatArray | None = None,
) -> FloatArray:
    if pole_a is None:
        pole_a = np.zeros(opinions.shape[1], dtype=np.float64)
    if pole_b is None:
        pole_b = np.ones(opinions.shape[1], dtype=np.float64)
    side_b = fuzzy_pole_membership(opinions, pole_a, pole_b)[:, 1]
    values = np.empty(len(opinions), dtype=np.float64)
    for i in range(len(opinions)):
        neighborhood = adjacency[i] > 0
        neighborhood[i] = True
        values[i] = polarization_from_side_scores(side_b[neighborhood])
    return values


def structural_modularity(adjacency: FloatArray, groups: NDArray[np.int_]) -> float:
    m = float(np.sum(adjacency) / 2.0)
    if m == 0:
        return 0.0
    degrees = np.sum(adjacency, axis=1)
    q = 0.0
    for i in range(len(groups)):
        for j in range(len(groups)):
            if groups[i] == groups[j]:
                q += adjacency[i, j] - degrees[i] * degrees[j] / (2.0 * m)
    return float(q / (2.0 * m))


def _field_force(opinions: FloatArray, position: FloatArray, strength: float, reach: float, sign: float) -> FloatArray:
    delta = position[None, :] - opinions
    dist2 = np.sum(delta * delta, axis=1)
    exposure = strength * np.exp(-dist2 / (2.0 * reach * reach))
    return sign * exposure[:, None] * delta


def step(state: ModelState, config: FinalModelConfig, t: int) -> dict[str, float]:
    config.validate()
    x = state.opinions
    n, d = x.shape
    social_force = np.zeros_like(x)
    for i in range(n):
        candidates = state.adjacency[i] > 0
        candidates[i] = True
        dist = np.linalg.norm(x - x[i], axis=1)
        neighbors = candidates & (dist <= state.epsilon[i])
        if np.any(neighbors):
            weights = np.ones(np.sum(neighbors), dtype=np.float64)
            target = np.average(x[neighbors], axis=0, weights=weights)
            social_force[i] = target - x[i]

    external_force = np.zeros_like(x)
    event_exposure = np.zeros(n, dtype=np.float64)
    for pole in config.poles:
        p = np.asarray(pole.position, dtype=np.float64)
        if p.shape != (d,):
            raise ValueError("pole dimension does not match opinions")
        external_force += _field_force(x, p, pole.strength, pole.reach, pole.sign)
    for event in config.events:
        activity = event.activity(t)
        if activity == 0:
            continue
        p = np.asarray(event.position, dtype=np.float64)
        if p.shape != (d,):
            raise ValueError("event dimension does not match opinions")
        force = _field_force(x, p, activity, event.reach, event.sign)
        external_force += force
        event_exposure += np.linalg.norm(force, axis=1)

    total_force = social_force + external_force
    move_mask = np.linalg.norm(total_force, axis=1) > state.alpha_activation
    moved = x.copy()
    moved[move_mask] = x[move_mask] + state.mu[move_mask, None] * total_force[move_mask]
    anchored = (1.0 - state.lambda_anchor[:, None]) * moved + state.lambda_anchor[:, None] * state.anchors
    new_opinions = apply_boundary(anchored, config.boundary)

    displacement = np.linalg.norm(new_opinions - x, axis=1)
    state.fatigue = config.fatigue_memory * state.fatigue + event_exposure + displacement
    pole_a, pole_b = polarization_poles(config, d)
    global_pol = fuzzy_polarization(new_opinions, pole_a, pole_b)
    local_pol = local_fuzzy_polarization_from(new_opinions, state.adjacency, pole_a, pole_b)
    delta_pol = local_pol - global_pol
    state.epsilon = np.clip(
        state.epsilon
        + config.feedback_local * delta_pol
        - config.feedback_global * global_pol
        - config.fatigue_sensitivity * state.fatigue,
        config.epsilon_min,
        config.epsilon_max,
    )
    state.opinions = new_opinions
    return {
        "global_polarization": global_pol,
        "mean_local_polarization": float(np.mean(local_pol)),
        "mean_epsilon": float(np.mean(state.epsilon)),
        "mean_fatigue": float(np.mean(state.fatigue)),
        "mean_displacement": float(np.mean(displacement)),
        "structural_modularity": structural_modularity(state.adjacency, state.groups),
    }


def run(config: FinalModelConfig, sample_every: int = 1) -> tuple[ModelState, list[dict[str, float]]]:
    if sample_every <= 0:
        raise ValueError("sample_every must be positive")
    state = initialize(config)
    pole_a, pole_b = polarization_poles(config, config.dimensions)
    rows: list[dict[str, float]] = []
    for t in range(config.steps + 1):
        if t % sample_every == 0 or t == config.steps:
            global_pol = fuzzy_polarization(state.opinions, pole_a, pole_b)
            rows.append(
                {
                    "t": float(t),
                    "global_polarization": global_pol,
                    "polarization_decile": float(np.round(global_pol, 1)),
                    "mean_local_polarization": float(np.mean(local_fuzzy_polarization(state, pole_a, pole_b))),
                    "mean_epsilon": float(np.mean(state.epsilon)),
                    "mean_fatigue": float(np.mean(state.fatigue)),
                    "mean_displacement": 0.0,
                    "structural_modularity": structural_modularity(state.adjacency, state.groups),
                }
            )
        if t < config.steps:
            step(state, config, t)
    return state, rows
