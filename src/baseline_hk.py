"""Hegselmann-Krause bounded-confidence opinion model."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class HKConfig:
    epsilon: float = 0.2
    boundary: str = "clip"

    def validate(self) -> None:
        if self.epsilon < 0:
            raise ValueError("epsilon must be non-negative")
        if self.boundary not in {"clip", "reflect"}:
            raise ValueError("boundary must be 'clip' or 'reflect'")


def apply_boundary(x: FloatArray, boundary: str = "clip") -> FloatArray:
    if boundary == "clip":
        return np.clip(x, 0.0, 1.0)
    if boundary == "reflect":
        y = np.mod(x, 2.0)
        return np.where(y <= 1.0, y, 2.0 - y)
    raise ValueError("unknown boundary")


def step(opinions: FloatArray, config: HKConfig) -> FloatArray:
    config.validate()
    x = np.asarray(opinions, dtype=np.float64)
    if x.ndim == 1:
        x2 = x[:, None]
    elif x.ndim == 2:
        x2 = x
    else:
        raise ValueError("opinions must be one- or two-dimensional")
    out = np.empty_like(x2)
    for i in range(x2.shape[0]):
        dist = np.linalg.norm(x2 - x2[i], axis=1)
        neighbors = dist <= config.epsilon
        out[i] = np.mean(x2[neighbors], axis=0)
    out = apply_boundary(out, config.boundary)
    return out[:, 0] if x.ndim == 1 else out
