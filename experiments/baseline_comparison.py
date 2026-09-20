"""Run minimal baseline comparison and export CSV/Parquet."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.baseline_hk import HKConfig, step as hk_step
from src.metrics import cluster_count_1d, ideological_polarization
from src.proposed_model import ProposedConfig, step as proposed_step


def run(config_path: str) -> pd.DataFrame:
    with open(config_path, "r", encoding="utf-8") as fh:
        cfg = yaml.safe_load(fh)
    rng = np.random.default_rng(int(cfg.get("seed", 123)))
    n = int(cfg.get("n_agents", 100))
    steps = int(cfg.get("steps", 100))
    opinions = rng.random(n)
    adjacency = np.ones((n, n), dtype=float) - np.eye(n, dtype=float)
    rows: list[dict[str, float | int | str]] = []
    model = cfg.get("model", "proposed")
    for t in range(steps + 1):
        rows.append(
            {
                "t": t,
                "model": model,
                "jdj": ideological_polarization(opinions),
                "clusters": cluster_count_1d(opinions, tolerance=1e-2),
                "mean": float(np.mean(opinions)),
                "std": float(np.std(opinions)),
            }
        )
        if t == steps:
            break
        if model == "hk":
            opinions = hk_step(opinions, HKConfig(epsilon=float(cfg["epsilon"]), boundary=cfg.get("boundary", "clip")))
        elif model == "proposed":
            opinions = proposed_step(
                opinions,
                adjacency,
                ProposedConfig(
                    epsilon=float(cfg["epsilon"]),
                    mu=float(cfg["mu"]),
                    lambda_anchor=float(cfg["lambda_anchor"]),
                    alpha_activation=float(cfg["alpha_activation"]),
                    boundary=cfg.get("boundary", "clip"),
                ),
            )
        else:
            raise ValueError("model must be 'hk' or 'proposed'")
    df = pd.DataFrame(rows)
    csv_path = Path(cfg.get("output_csv", "outputs/run.csv"))
    parquet_path = Path(cfg.get("output_parquet", "outputs/run.parquet"))
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    parquet_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(csv_path, index=False)
    df.to_parquet(parquet_path, index=False)
    return df


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="data/default_config.yaml")
    args = parser.parse_args()
    df = run(args.config)
    print(df.tail(1).to_string(index=False))


if __name__ == "__main__":
    main()
