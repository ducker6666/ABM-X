"""Minimal extensible bounded-confidence model for political opinions."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .baseline_hk import apply_boundary


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class ProposedConfig:
    epsilon: float = 0.25
    mu: float = 0.5
    lambda_anchor: float = 0.0
    alpha_activation: float = 0.0
    boundary: str = "clip"

    def validate(self) -> None:
        if self.epsilon < 0:
            raise ValueError("epsilon must be non-negative")
        if not 0.0 <= self.mu <= 1.0:
            raise ValueError("mu must lie in [0, 1]")
        if not 0.0 <= self.lambda_anchor <= 1.0:
            raise ValueError("lambda_anchor must lie in [0, 1]")
        if self.alpha_activation < 0:
            raise ValueError("alpha_activation must be non-negative")
        if self.boundary not in {"clip", "reflect"}:
            raise ValueError("unsupported boundary")


def step(
    opinions: FloatArray,
    adjacency: FloatArray,
    config: ProposedConfig,
    anchors: FloatArray | None = None,
) -> FloatArray:
    """Synchronous network HK/FJ hybrid with activation threshold."""

    config.validate()
    x = np.asarray(opinions, dtype=np.float64)
    if x.ndim == 1:
        x2 = x[:, None]
    elif x.ndim == 2:
        x2 = x
    else:
        raise ValueError("opinions must be one- or two-dimensional")
    a = np.asarray(adjacency, dtype=np.float64)
    if a.shape != (x2.shape[0], x2.shape[0]):
        raise ValueError("adjacency shape must be (n, n)")
    anchor = x2.copy() if anchors is None else np.asarray(anchors, dtype=np.float64)
    if anchor.shape != x2.shape:
        raise ValueError("anchors must match opinions shape")

    out = x2.copy()
    for i in range(x2.shape[0]):
        candidates = a[i] > 0
        candidates[i] = True
        dist = np.linalg.norm(x2 - x2[i], axis=1)
        neighbors = candidates & (dist <= config.epsilon)
        if not np.any(neighbors):
            social_force = np.zeros(x2.shape[1], dtype=np.float64)
        else:
            target = np.average(x2[neighbors], axis=0, weights=np.where(neighbors, np.maximum(a[i], 1e-12), 0.0)[neighbors])
            social_force = target - x2[i]
        if np.linalg.norm(social_force) > config.alpha_activation:
            moved = x2[i] + config.mu * social_force
        else:
            moved = x2[i]
        out[i] = (1.0 - config.lambda_anchor) * moved + config.lambda_anchor * anchor[i]
    bounded = apply_boundary(out, config.boundary)
    return bounded[:, 0] if x.ndim == 1 else bounded
