"""Fuzzy two-pole JDJ-style polarization measure.

The original JDJ formula must be checked against Guevara et al. before using
this as more than an implementation placeholder. The function here implements
the two-pole fuzzy opposition kernel used in the local Markov scripts:
opposition(a, b) = a_A b_B + a_B b_A.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]


def two_pole_membership(x: FloatArray) -> FloatArray:
    values = np.asarray(x, dtype=np.float64)
    values = np.clip(values, 0.0, 1.0)
    return np.column_stack((1.0 - values, values))


def pairwise_opposition(memberships: FloatArray) -> FloatArray:
    m = np.asarray(memberships, dtype=np.float64)
    if m.ndim != 2 or m.shape[1] != 2:
        raise ValueError("memberships must have shape (n, 2)")
    return m[:, None, 0] * m[None, :, 1] + m[:, None, 1] * m[None, :, 0]


def jdj_mean(opinions: FloatArray) -> float:
    x = np.asarray(opinions, dtype=np.float64).reshape(-1)
    if len(x) < 2:
        return 0.0
    opp = pairwise_opposition(two_pole_membership(x))
    mask = ~np.eye(len(x), dtype=bool)
    return float(np.mean(opp[mask]))
