"""Gravitational-attitudinal ABM for political polarization.

Agents live in an attitudinal space E=[0,1]^d. They move only when the total
influence force exceeds their individual immobility threshold alpha_i.

Total force:
    F_i = F_local + F_poles + F_events + F_clusters + F_center

This module intentionally keeps the force components separate so the model can
be audited against its equations.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from enum import Enum

import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]
IntArray = NDArray[np.int_]


class Aggregator(str, Enum):
    MEAN = "mean"
    MEDIAN = "median"
    TRIMMED_MEAN = "trimmed_mean"


@dataclass(frozen=True)
class Attractor:
    """Permanent attitudinal pole or temporary event center."""

    position: tuple[float, ...]
    strength: float
    radius: float
    sign: float = 1.0
    audience_group: int | None = None


@dataclass(frozen=True)
class Event:
    position: tuple[float, ...]
    start: int
    duration: int
    strength: float
    radius: float
    decay: float = 0.0
    sign: float = 1.0
    visibility: float = 1.0
    audience_group: int | None = None
    counter_position: tuple[float, ...] | None = None
    counter_probability_beta: float = 0.0
    counter_strength_fraction: float = 0.5

    def active_strength(self, t: int) -> float:
        if t < self.start or t >= self.start + self.duration:
            return 0.0
        age = t - self.start
        return float(self.strength * np.exp(-self.decay * age))


@dataclass(frozen=True)
class ABMConfig:
    n_agents: int = 250
    dimensions: int = 2
    steps: int = 500
    seed: int = 123
    network: str = "sbm"
    p_in: float = 0.18
    p_out: float = 0.035
    aggregator: Aggregator = Aggregator.MEAN
    trim_fraction: float = 0.1
    epsilon_mean: float = 0.25
    epsilon_sd: float = 0.04
    epsilon_min: float = 0.03
    epsilon_max: float = 0.8
    mu_mean: float = 0.45
    mu_sd: float = 0.06
    lambda_mean: float = 0.05
    lambda_sd: float = 0.02
    alpha_mean: float = 0.012
    alpha_sd: float = 0.004
    local_weight: float = 1.0
    pole_weight: float = 1.0
    event_weight: float = 1.0
    cluster_weight: float = 0.0
    center_weight_base: float = 0.0
    center_weight_polarization: float = 0.0
    center_weight_fatigue: float = 0.0
    cluster_mode: str = "identity"
    cluster_detection_radius: float = 0.12
    cluster_radius: float = 0.6
    cluster_mass_exponent: float = 1.0
    cluster_density_exponent: float = 0.0
    cluster_min_size: int = 5
    fatigue_memory: float = 0.92
    fatigue_event_weight: float = 1.0
    fatigue_motion_weight: float = 1.0
    epsilon_radicalization_sensitivity: float = 0.0
    epsilon_fatigue_sensitivity: float = 0.0
    epsilon_local_polarization_sensitivity: float = 0.0
    boundary: str = "clip"
    poles: tuple[Attractor, ...] = field(default_factory=tuple)
    events: tuple[Event, ...] = field(default_factory=tuple)
    random_event_probability: float = 0.0
    random_event_duration: int = 100
    random_event_strength_min: float = 0.08
    random_event_strength_max: float = 0.18
    random_event_radius_min: float = 0.20
    random_event_radius_max: float = 0.45
    random_event_decay: float = 0.01
    random_event_counter_probability_beta: float = 0.0

    def validate(self) -> None:
        if self.n_agents <= 0:
            raise ValueError("n_agents must be positive")
        if self.dimensions <= 0:
            raise ValueError("dimensions must be positive")
        if self.steps < 0:
            raise ValueError("steps must be non-negative")
        if self.network not in {"complete", "sbm"}:
            raise ValueError("network must be 'complete' or 'sbm'")
        if not 0.0 <= self.p_in <= 1.0 or not 0.0 <= self.p_out <= 1.0:
            raise ValueError("network probabilities must be in [0, 1]")
        if not 0.0 <= self.trim_fraction < 0.5:
            raise ValueError("trim_fraction must be in [0, 0.5)")
        if not 0.0 <= self.epsilon_min <= self.epsilon_mean <= self.epsilon_max:
            raise ValueError("require epsilon_min <= epsilon_mean <= epsilon_max")
        if min(self.epsilon_sd, self.mu_sd, self.lambda_sd, self.alpha_sd) < 0:
            raise ValueError("standard deviations must be non-negative")
        if not 0.0 <= self.mu_mean <= 1.0:
            raise ValueError("mu_mean must be in [0, 1]")
        if not 0.0 <= self.lambda_mean <= 1.0:
            raise ValueError("lambda_mean must be in [0, 1]")
        if not 0.0 <= self.fatigue_memory <= 1.0:
            raise ValueError("fatigue_memory must be in [0, 1]")
        if self.boundary != "clip":
            raise ValueError("only clip boundary is implemented for attitudinal space")
        if self.cluster_mode not in {"identity", "emergent"}:
            raise ValueError("cluster_mode must be 'identity' or 'emergent'")
        if self.cluster_detection_radius <= 0.0:
            raise ValueError("cluster_detection_radius must be positive")
        if self.cluster_radius <= 0.0:
            raise ValueError("cluster_radius must be positive")
        if self.cluster_min_size <= 0:
            raise ValueError("cluster_min_size must be positive")
        if not 0.0 <= self.random_event_probability <= 1.0:
            raise ValueError("random_event_probability must be in [0, 1]")
        if self.random_event_duration <= 0:
            raise ValueError("random_event_duration must be positive")
        if not 0.0 <= self.random_event_strength_min <= self.random_event_strength_max:
            raise ValueError("invalid random event strength range")
        if not 0.0 < self.random_event_radius_min <= self.random_event_radius_max:
            raise ValueError("invalid random event radius range")


@dataclass
class ABMState:
    opinions: FloatArray
    anchors: FloatArray
    adjacency: FloatArray
    groups: IntArray
    epsilon: FloatArray
    mu: FloatArray
    lambda_anchor: FloatArray
    alpha: FloatArray
    fatigue: FloatArray
    generated_events: list[Event] = field(default_factory=list)
    random_event_log: list[dict[str, float]] = field(default_factory=list)


def clipped(x: FloatArray) -> FloatArray:
    return np.clip(x, 0.0, 1.0)


def truncated_normal(
    rng: np.random.Generator,
    mean: float,
    sd: float,
    low: float,
    high: float,
    size: int,
) -> FloatArray:
    if sd == 0.0:
        return np.full(size, mean, dtype=np.float64)
    return np.clip(rng.normal(mean, sd, size=size), low, high)


def generate_network(config: ABMConfig, rng: np.random.Generator) -> tuple[FloatArray, IntArray]:
    groups = np.zeros(config.n_agents, dtype=int)
    groups[config.n_agents // 2 :] = 1
    if config.network == "complete":
        adjacency = np.ones((config.n_agents, config.n_agents), dtype=np.float64) - np.eye(config.n_agents)
        return adjacency, groups
    probs = np.where(groups[:, None] == groups[None, :], config.p_in, config.p_out)
    adjacency = (rng.random((config.n_agents, config.n_agents)) < probs).astype(np.float64)
    adjacency = np.triu(adjacency, 1)
    adjacency = adjacency + adjacency.T
    return adjacency, groups


def initialize(config: ABMConfig) -> ABMState:
    config.validate()
    rng = np.random.default_rng(config.seed)
    opinions = rng.random((config.n_agents, config.dimensions), dtype=np.float64)
    adjacency, groups = generate_network(config, rng)
    epsilon = truncated_normal(rng, config.epsilon_mean, config.epsilon_sd, config.epsilon_min, config.epsilon_max, config.n_agents)
    mu = truncated_normal(rng, config.mu_mean, config.mu_sd, 0.0, 1.0, config.n_agents)
    lambda_anchor = truncated_normal(rng, config.lambda_mean, config.lambda_sd, 0.0, 1.0, config.n_agents)
    alpha = truncated_normal(rng, config.alpha_mean, config.alpha_sd, 0.0, np.inf, config.n_agents)
    return ABMState(
        opinions=opinions,
        anchors=opinions.copy(),
        adjacency=adjacency,
        groups=groups,
        epsilon=epsilon,
        mu=mu,
        lambda_anchor=lambda_anchor,
        alpha=alpha,
        fatigue=np.zeros(config.n_agents, dtype=np.float64),
    )


def default_poles(config: ABMConfig) -> tuple[FloatArray, FloatArray]:
    if len(config.poles) >= 2:
        return (
            np.asarray(config.poles[0].position, dtype=np.float64),
            np.asarray(config.poles[1].position, dtype=np.float64),
        )
    if config.dimensions == 2:
        return np.array([0.0, 1.0]), np.array([1.0, 0.0])
    return np.zeros(config.dimensions), np.ones(config.dimensions)


def side_scores(opinions: FloatArray, pole_a: FloatArray, pole_b: FloatArray) -> FloatArray:
    da = np.linalg.norm(opinions - pole_a, axis=1)
    db = np.linalg.norm(opinions - pole_b, axis=1)
    score_a = 1.0 / (da + 1e-9)
    score_b = 1.0 / (db + 1e-9)
    return score_b / (score_a + score_b)


def polarization_from_scores(scores: FloatArray) -> float:
    if len(scores) < 2:
        return 0.0
    mean_score = float(np.mean(scores))
    balance = 4.0 * mean_score * (1.0 - mean_score)
    separation = 4.0 * float(np.var(scores))
    return float(np.clip(balance * separation, 0.0, 1.0))


def global_polarization(opinions: FloatArray, pole_a: FloatArray, pole_b: FloatArray) -> float:
    return polarization_from_scores(side_scores(opinions, pole_a, pole_b))


def local_polarization(state: ABMState, pole_a: FloatArray, pole_b: FloatArray) -> FloatArray:
    scores = side_scores(state.opinions, pole_a, pole_b)
    out = np.zeros(len(scores), dtype=np.float64)
    for i in range(len(scores)):
        mask = state.adjacency[i] > 0
        mask[i] = True
        out[i] = polarization_from_scores(scores[mask])
    return out


def aggregate(points: FloatArray, mode: Aggregator, trim_fraction: float) -> FloatArray:
    if len(points) == 0:
        raise ValueError("cannot aggregate empty points")
    if mode == Aggregator.MEAN:
        return np.mean(points, axis=0)
    if mode == Aggregator.MEDIAN:
        return np.median(points, axis=0)
    if mode == Aggregator.TRIMMED_MEAN:
        sorted_points = np.sort(points, axis=0)
        k = int(np.floor(trim_fraction * len(points)))
        if 2 * k >= len(points):
            return np.mean(points, axis=0)
        return np.mean(sorted_points[k : len(points) - k], axis=0)
    raise ValueError(f"unknown aggregator: {mode}")


def local_force(state: ABMState, config: ABMConfig) -> FloatArray:
    x = state.opinions
    force = np.zeros_like(x)
    for i in range(len(x)):
        network_mask = state.adjacency[i] > 0
        network_mask[i] = True
        dist = np.linalg.norm(x - x[i], axis=1)
        confidence_mask = dist <= state.epsilon[i]
        mask = network_mask & confidence_mask
        if np.any(mask):
            target = aggregate(x[mask], config.aggregator, config.trim_fraction)
            force[i] = target - x[i]
    return config.local_weight * force


def attractor_force(opinions: FloatArray, attractor: Attractor) -> tuple[FloatArray, FloatArray]:
    p = np.asarray(attractor.position, dtype=np.float64)
    delta = p[None, :] - opinions
    dist2 = np.sum(delta * delta, axis=1)
    kernel = np.exp(-dist2 / (2.0 * attractor.radius * attractor.radius))
    exposure = abs(attractor.strength) * kernel
    force = attractor.sign * attractor.strength * kernel[:, None] * delta
    return force, exposure


def apply_audience(
    force: FloatArray,
    exposure: FloatArray,
    groups: IntArray,
    audience_group: int | None,
) -> tuple[FloatArray, FloatArray]:
    if audience_group is None:
        return force, exposure
    mask = groups == audience_group
    out_force = np.zeros_like(force)
    out_exposure = np.zeros_like(exposure)
    out_force[mask] = force[mask]
    out_exposure[mask] = exposure[mask]
    return out_force, out_exposure


def poles_force(state: ABMState, config: ABMConfig) -> tuple[FloatArray, FloatArray]:
    total = np.zeros_like(state.opinions)
    exposure = np.zeros(len(state.opinions), dtype=np.float64)
    for pole in config.poles:
        force, exp = attractor_force(state.opinions, pole)
        force, exp = apply_audience(force, exp, state.groups, pole.audience_group)
        total += force
        exposure += exp
    return config.pole_weight * total, exposure


def active_events(config: ABMConfig, state: ABMState, t: int) -> list[Event]:
    return [event for event in (*config.events, *state.generated_events) if event.active_strength(t) > 0.0]


def maybe_generate_counterevents(config: ABMConfig, state: ABMState, t: int, rng: np.random.Generator) -> None:
    pole_a, pole_b = default_poles(config)
    scores = side_scores(state.opinions, pole_a, pole_b)
    for event in config.events:
        strength = event.active_strength(t)
        if strength <= 0.0 or event.counter_probability_beta <= 0.0:
            continue
        event_position = np.asarray(event.position, dtype=np.float64)
        closer_to_b = np.linalg.norm(event_position - pole_b) < np.linalg.norm(event_position - pole_a)
        opposed_mass = float(np.mean(scores < 0.5 if closer_to_b else scores >= 0.5))
        probability = 1.0 - np.exp(-event.counter_probability_beta * strength * opposed_mass * event.visibility)
        if rng.random() < probability:
            counter_position = event.counter_position
            if counter_position is None:
                counter_position = tuple(pole_a if closer_to_b else pole_b)
            state.generated_events.append(
                Event(
                    position=counter_position,
                    start=t + 1,
                    duration=max(1, event.duration // 2),
                    strength=event.strength * event.counter_strength_fraction,
                    radius=event.radius,
                    decay=event.decay,
                    sign=event.sign,
                    visibility=event.visibility * 0.8,
                    counter_probability_beta=0.0,
                )
            )


def maybe_generate_random_event(config: ABMConfig, state: ABMState, t: int, rng: np.random.Generator) -> None:
    if config.random_event_probability <= 0.0:
        return
    if rng.random() >= config.random_event_probability:
        return
    position = tuple(rng.random(config.dimensions).tolist())
    strength = float(rng.uniform(config.random_event_strength_min, config.random_event_strength_max))
    radius = float(rng.uniform(config.random_event_radius_min, config.random_event_radius_max))
    event = Event(
        position=position,
        start=t,
        duration=config.random_event_duration,
        strength=strength,
        radius=radius,
        decay=config.random_event_decay,
        sign=1.0,
        visibility=1.0,
        counter_probability_beta=config.random_event_counter_probability_beta,
    )
    state.generated_events.append(event)
    row = {
        "start": float(t),
        "duration": float(event.duration),
        "strength": event.strength,
        "radius": event.radius,
        "decay": event.decay,
    }
    for k, value in enumerate(position):
        row[f"x{k}"] = float(value)
    state.random_event_log.append(row)


def events_force(state: ABMState, config: ABMConfig, t: int) -> tuple[FloatArray, FloatArray]:
    total = np.zeros_like(state.opinions)
    exposure = np.zeros(len(state.opinions), dtype=np.float64)
    for event in active_events(config, state, t):
        active = event.active_strength(t)
        attractor = Attractor(position=event.position, strength=active, radius=event.radius, sign=event.sign)
        force, exp = attractor_force(state.opinions, attractor)
        force, exp = apply_audience(force, exp, state.groups, event.audience_group)
        total += force
        exposure += exp
    return config.event_weight * total, exposure


def identity_clusters(state: ABMState) -> list[IntArray]:
    return [np.where(state.groups == group)[0] for group in np.unique(state.groups)]


def emergent_clusters(opinions: FloatArray, radius: float, min_size: int) -> list[IntArray]:
    n = len(opinions)
    dist = np.linalg.norm(opinions[:, None, :] - opinions[None, :, :], axis=2)
    adjacency = dist <= radius
    visited = np.zeros(n, dtype=bool)
    clusters: list[IntArray] = []
    for start in range(n):
        if visited[start]:
            continue
        stack = [start]
        visited[start] = True
        members: list[int] = []
        while stack:
            i = stack.pop()
            members.append(i)
            neighbors = np.where(adjacency[i] & ~visited)[0]
            visited[neighbors] = True
            stack.extend(int(j) for j in neighbors)
        if len(members) >= min_size:
            clusters.append(np.asarray(members, dtype=int))
    return clusters


def cluster_force(state: ABMState, config: ABMConfig) -> tuple[FloatArray, int, float]:
    if config.cluster_weight == 0.0:
        return np.zeros_like(state.opinions), 0, 0.0
    total = np.zeros_like(state.opinions)
    clusters = (
        identity_clusters(state)
        if config.cluster_mode == "identity"
        else emergent_clusters(state.opinions, config.cluster_detection_radius, config.cluster_min_size)
    )
    mean_mass = 0.0
    used = 0
    for idx in clusters:
        members = state.opinions[idx]
        if len(members) < config.cluster_min_size:
            continue
        centroid = np.mean(members, axis=0)
        spread = float(np.mean(np.linalg.norm(members - centroid, axis=1))) + 1e-9
        density = len(members) / spread
        mass = float((len(members) ** config.cluster_mass_exponent) * (density ** config.cluster_density_exponent))
        delta = centroid[None, :] - state.opinions
        dist2 = np.sum(delta * delta, axis=1)
        kernel = np.exp(-dist2 / (2.0 * config.cluster_radius * config.cluster_radius))
        total += mass * kernel[:, None] * delta / max(1.0, config.n_agents)
        mean_mass += mass
        used += 1
    if used:
        mean_mass /= used
    return config.cluster_weight * total, used, float(mean_mass)


def center_force(state: ABMState, config: ABMConfig, polarization: float) -> FloatArray:
    center = np.full(config.dimensions, 0.5, dtype=np.float64)
    mean_fatigue = float(np.mean(state.fatigue))
    strength = (
        config.center_weight_base
        + config.center_weight_polarization * polarization
        + config.center_weight_fatigue * mean_fatigue
    )
    return strength * (center[None, :] - state.opinions)


def update_epsilon(state: ABMState, config: ABMConfig, pole_a: FloatArray, pole_b: FloatArray) -> None:
    center = np.full(config.dimensions, 0.5, dtype=np.float64)
    radicalization = np.linalg.norm(state.opinions - center, axis=1)
    local_pol = local_polarization(state, pole_a, pole_b)
    state.epsilon = np.clip(
        state.epsilon
        - config.epsilon_radicalization_sensitivity * radicalization
        - config.epsilon_fatigue_sensitivity * state.fatigue
        - config.epsilon_local_polarization_sensitivity * local_pol,
        config.epsilon_min,
        config.epsilon_max,
    )


def step(state: ABMState, config: ABMConfig, t: int, rng: np.random.Generator) -> dict[str, float]:
    pole_a, pole_b = default_poles(config)
    current_polarization = global_polarization(state.opinions, pole_a, pole_b)
    maybe_generate_random_event(config, state, t, rng)
    maybe_generate_counterevents(config, state, t, rng)

    f_local = local_force(state, config)
    f_poles, pole_exposure = poles_force(state, config)
    f_events, event_exposure = events_force(state, config, t)
    f_clusters, n_clusters, mean_cluster_mass = cluster_force(state, config)
    f_center = center_force(state, config, current_polarization)
    total_force = f_local + f_poles + f_events + f_clusters + f_center

    force_norm = np.linalg.norm(total_force, axis=1)
    movable = force_norm > state.alpha
    proposed = state.opinions.copy()
    proposed[movable] = state.opinions[movable] + state.mu[movable, None] * total_force[movable]
    anchored = (1.0 - state.lambda_anchor[:, None]) * proposed + state.lambda_anchor[:, None] * state.anchors
    new_opinions = clipped(anchored)
    displacement = np.linalg.norm(new_opinions - state.opinions, axis=1)

    state.opinions = new_opinions
    state.fatigue = (
        config.fatigue_memory * state.fatigue
        + config.fatigue_event_weight * event_exposure
        + config.fatigue_motion_weight * displacement
    )
    update_epsilon(state, config, pole_a, pole_b)

    new_polarization = global_polarization(state.opinions, pole_a, pole_b)
    return {
        "polarization": new_polarization,
        "polarization_decile": float(np.round(new_polarization, 1)),
        "mean_epsilon": float(np.mean(state.epsilon)),
        "mean_alpha": float(np.mean(state.alpha)),
        "mean_fatigue": float(np.mean(state.fatigue)),
        "moved_fraction": float(np.mean(movable)),
        "mean_force": float(np.mean(force_norm)),
        "mean_local_force": float(np.mean(np.linalg.norm(f_local, axis=1))),
        "mean_pole_force": float(np.mean(np.linalg.norm(f_poles, axis=1))),
        "mean_event_force": float(np.mean(np.linalg.norm(f_events, axis=1))),
        "mean_cluster_force": float(np.mean(np.linalg.norm(f_clusters, axis=1))),
        "mean_center_force": float(np.mean(np.linalg.norm(f_center, axis=1))),
        "n_clusters": float(n_clusters),
        "mean_cluster_mass": mean_cluster_mass,
        "generated_events": float(len(state.generated_events)),
    }


def state_metrics(state: ABMState, config: ABMConfig, t: int) -> dict[str, float]:
    pole_a, pole_b = default_poles(config)
    pol = global_polarization(state.opinions, pole_a, pole_b)
    return {
        "t": float(t),
        "polarization": pol,
        "polarization_decile": float(np.round(pol, 1)),
        "mean_epsilon": float(np.mean(state.epsilon)),
        "mean_alpha": float(np.mean(state.alpha)),
        "mean_fatigue": float(np.mean(state.fatigue)),
        "moved_fraction": 0.0,
        "mean_force": 0.0,
        "mean_local_force": 0.0,
        "mean_pole_force": 0.0,
        "mean_event_force": 0.0,
        "mean_cluster_force": 0.0,
        "mean_center_force": 0.0,
        "n_clusters": 0.0,
        "mean_cluster_mass": 0.0,
        "generated_events": float(len(state.generated_events)),
    }


def run(config: ABMConfig, sample_every: int = 1) -> tuple[ABMState, list[dict[str, float]], list[FloatArray]]:
    if sample_every <= 0:
        raise ValueError("sample_every must be positive")
    state = initialize(config)
    rng = np.random.default_rng(config.seed + 1)
    rows: list[dict[str, float]] = []
    history: list[FloatArray] = []
    last_step_metrics = state_metrics(state, config, 0)
    for t in range(config.steps + 1):
        if t % sample_every == 0 or t == config.steps:
            row = state_metrics(state, config, t)
            row.update({k: last_step_metrics[k] for k in row.keys() if k in last_step_metrics and k != "t"})
            row["t"] = float(t)
            rows.append(row)
            history.append(state.opinions.copy())
        if t < config.steps:
            last_step_metrics = step(state, config, t, rng)
    return state, rows, history


def config_with_steps(config: ABMConfig, steps: int) -> ABMConfig:
    return replace(config, steps=steps)
