"""Deffuant-Weisbuch pairwise bounded-confidence model."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class DeffuantConfig:
    epsilon: float = 0.25
    mu: float = 0.5
    seed: int | None = 123

    def validate(self) -> None:
        if self.epsilon < 0:
            raise ValueError("epsilon must be non-negative")
        if not 0.0 <= self.mu <= 0.5:
            raise ValueError("mu must lie in [0, 0.5]")


def pair_step(opinions: FloatArray, i: int, j: int, config: DeffuantConfig) -> FloatArray:
    config.validate()
    x = np.asarray(opinions, dtype=np.float64).copy()
    diff = x[j] - x[i]
    if float(np.linalg.norm(np.atleast_1d(diff))) <= config.epsilon:
        x[i] = x[i] + config.mu * diff
        x[j] = x[j] - config.mu * diff
    return np.clip(x, 0.0, 1.0)


def run(opinions: FloatArray, config: DeffuantConfig, interactions: int) -> FloatArray:
    config.validate()
    if interactions < 0:
        raise ValueError("interactions must be non-negative")
    rng = np.random.default_rng(config.seed)
    x = np.asarray(opinions, dtype=np.float64).copy()
    n = len(x)
    if n < 2:
        return x
    for _ in range(interactions):
        i, j = rng.choice(n, size=2, replace=False)
        x = pair_step(x, int(i), int(j), config)
    return x
