"""Typed Vicsek self-propelled particle baseline.

This module is intentionally physical: agents have positions and velocity
directions. It is included to reproduce and test the audited script, not as the
recommended political opinion model.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class VicsekConfig:
    n_agents: int = 200
    domain_size: float = 1.0
    speed: float = 0.01
    radius: float = 0.08
    noise: float = 0.4
    seed: int | None = 123

    def validate(self) -> None:
        if self.n_agents <= 0:
            raise ValueError("n_agents must be positive")
        if self.domain_size <= 0:
            raise ValueError("domain_size must be positive")
        if self.speed < 0:
            raise ValueError("speed must be non-negative")
        if self.radius < 0:
            raise ValueError("radius must be non-negative")
        if self.noise < 0:
            raise ValueError("noise must be non-negative")


def initialize(config: VicsekConfig) -> tuple[FloatArray, FloatArray, np.random.Generator]:
    config.validate()
    rng = np.random.default_rng(config.seed)
    positions = rng.random((config.n_agents, 2), dtype=np.float64) * config.domain_size
    theta = rng.random(config.n_agents, dtype=np.float64) * 2.0 * np.pi
    return positions, theta, rng


def periodic_displacements(positions: FloatArray, domain_size: float) -> FloatArray:
    dx = positions[:, None, :] - positions[None, :, :]
    return dx - domain_size * np.round(dx / domain_size)


def periodic_distance_matrix(positions: FloatArray, domain_size: float) -> FloatArray:
    dx = periodic_displacements(positions, domain_size)
    return np.sqrt(np.sum(dx * dx, axis=2))


def circular_mean_angle(theta: FloatArray) -> float:
    return float(np.arctan2(np.sum(np.sin(theta)), np.sum(np.cos(theta))))


def order_parameter(theta: FloatArray) -> float:
    vx = np.mean(np.cos(theta))
    vy = np.mean(np.sin(theta))
    return float(np.hypot(vx, vy))


def step(
    positions: FloatArray,
    theta: FloatArray,
    config: VicsekConfig,
    rng: np.random.Generator,
) -> tuple[FloatArray, FloatArray]:
    config.validate()
    if len(theta) != positions.shape[0]:
        raise ValueError("positions and theta must have the same number of agents")
    dist = periodic_distance_matrix(positions, config.domain_size)
    new_theta = np.empty_like(theta)
    for i in range(len(theta)):
        neighbors = dist[i] <= config.radius
        avg = circular_mean_angle(theta[neighbors])
        new_theta[i] = avg + rng.uniform(-config.noise / 2.0, config.noise / 2.0)
    new_positions = positions.copy()
    new_positions[:, 0] += config.speed * np.cos(new_theta)
    new_positions[:, 1] += config.speed * np.sin(new_theta)
    return new_positions % config.domain_size, new_theta


def run(config: VicsekConfig, steps: int) -> tuple[FloatArray, FloatArray, FloatArray]:
    if steps < 0:
        raise ValueError("steps must be non-negative")
    positions, theta, rng = initialize(config)
    orders = np.empty(steps, dtype=np.float64)
    for t in range(steps):
        orders[t] = order_parameter(theta)
        positions, theta = step(positions, theta, config, rng)
    return positions, theta, orders
