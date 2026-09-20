"""Output metrics for opinion simulations."""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from .jdj import jdj_mean


FloatArray = NDArray[np.float64]


def ideological_polarization(opinions: FloatArray) -> float:
    return jdj_mean(opinions)


def cluster_count_1d(opinions: FloatArray, tolerance: float = 1e-3) -> int:
    x = np.sort(np.asarray(opinions, dtype=np.float64).reshape(-1))
    if len(x) == 0:
        return 0
    return int(1 + np.sum(np.diff(x) > tolerance))


def modularity_placeholder(_: FloatArray) -> float:
    raise NotImplementedError("Use networkx modularity with an explicit graph partition")
