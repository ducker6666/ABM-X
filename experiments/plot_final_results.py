"""Plot outputs from the final polarization model."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def plot_results(input_csv: str, output_png: str) -> None:
    df = pd.read_csv(input_csv)
    required = {"t", "global_polarization", "mean_local_polarization", "mean_epsilon", "mean_fatigue"}
    missing = required.difference(df.columns)
    if missing:
        raise ValueError(f"missing columns in {input_csv}: {sorted(missing)}")

    fig, axes = plt.subplots(3, 1, figsize=(9, 8), sharex=True)
    axes[0].plot(df["t"], df["global_polarization"], label="Global", linewidth=2)
    axes[0].plot(df["t"], df["mean_local_polarization"], label="Local media", linewidth=2)
    axes[0].set_ylabel("Polarizacion")
    axes[0].set_ylim(0.0, 1.0)
    axes[0].set_yticks(np.arange(0.0, 1.01, 0.1))
    axes[0].legend()

    axes[1].plot(df["t"], df["mean_epsilon"], color="#2f7f4f", linewidth=2)
    axes[1].set_ylabel("Tolerancia media")

    axes[2].plot(df["t"], df["mean_fatigue"], color="#9a4f2f", linewidth=2)
    axes[2].set_ylabel("Fatiga media")
    axes[2].set_xlabel("Tiempo")

    for ax in axes:
        ax.grid(True, alpha=0.25)

    fig.tight_layout()
    path = Path(output_png)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=160)
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="outputs/final_model.csv")
    parser.add_argument("--output", default="outputs/final_model_timeseries.png")
    args = parser.parse_args()
    plot_results(args.input, args.output)
    print(args.output)


if __name__ == "__main__":
    main()
