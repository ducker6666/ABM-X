"""Visualization helpers kept separate from model dynamics."""

from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]


def plot_opinion_histogram(opinions: FloatArray, output_path: str) -> None:
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.hist(np.asarray(opinions).reshape(-1), bins=20, range=(0, 1), color="#4c78a8")
    ax.set_xlabel("Opinion")
    ax.set_ylabel("Agents")
    fig.tight_layout()
    fig.savefig(output_path, dpi=150)
    plt.close(fig)
