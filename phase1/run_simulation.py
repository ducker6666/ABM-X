"""Ejecutor reproducible y exportador CSV/JSON de la Fase 1."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from phase1.src.model import ModelConfig, run


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Simula el modelo HK de Fase 1")
    parser.add_argument("--agents", type=int, default=100)
    parser.add_argument("--epsilon", type=float, default=0.20)
    parser.add_argument("--steps", type=int, default=100)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument(
        "--scenario",
        choices=(
            "uniform",
            "central",
            "bipolar_balanced",
            "bipolar_unbalanced",
            "three_groups",
        ),
        default="uniform",
    )
    parser.add_argument("--output", type=Path, default=Path("phase1/outputs/run"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = ModelConfig(
        n_agents=args.agents,
        epsilon=args.epsilon,
        max_steps=args.steps,
        seed=args.seed,
        scenario=args.scenario,
    )
    result = run(config)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    csv_path = args.output.with_suffix(".csv")
    json_path = args.output.with_suffix(".json")

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        fieldnames = list(result.metrics[0])
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(result.metrics)

    payload = {
        "config": vars(args) | {"output": str(args.output)},
        "converged": result.converged,
        "opinions": [list(state) for state in result.history],
        "metrics": list(result.metrics),
    }
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"CSV: {csv_path}")
    print(f"JSON: {json_path}")
    print(f"Pasos ejecutados: {len(result.history) - 1}")
    print(f"Convergencia: {result.converged}")


if __name__ == "__main__":
    main()
