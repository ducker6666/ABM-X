"""Ejecuta una rejilla reproducible de escenarios, epsilon y semillas.

Este programa produce datos de análisis, no figuras seleccionadas. Cada fila
corresponde a una ejecución y contiene configuración, terminación y métricas
finales. El diseño definitivo del artículo debe fijarse antes de ejecutar el
lote confirmatorio.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from phase1.src.model import ModelConfig, run


SCENARIOS = (
    "uniform",
    "central",
    "bipolar_balanced",
    "bipolar_unbalanced",
    "three_groups",
)


def parse_epsilon_grid(raw: str) -> tuple[float, ...]:
    values = tuple(float(item) for item in raw.split(","))
    if not values or any(value < 0.0 or value > 1.0 for value in values):
        raise argparse.ArgumentTypeError("epsilon debe contener valores en [0,1]")
    return values


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rejilla experimental de Fase 1")
    parser.add_argument("--agents", type=int, default=100)
    parser.add_argument("--steps", type=int, default=200)
    parser.add_argument("--replications", type=int, default=20)
    parser.add_argument("--first-seed", type=int, default=1001)
    parser.add_argument(
        "--epsilons",
        type=parse_epsilon_grid,
        default=parse_epsilon_grid("0.05,0.10,0.15,0.20,0.25,0.30,0.40,0.50"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("phase1/outputs/scenario_grid.csv"),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.replications < 1:
        raise SystemExit("replications debe ser positivo")

    rows: list[dict[str, float | int | str | bool]] = []
    for scenario in SCENARIOS:
        for epsilon in args.epsilons:
            for replication in range(args.replications):
                seed = args.first_seed + replication
                config = ModelConfig(
                    n_agents=args.agents,
                    epsilon=epsilon,
                    max_steps=args.steps,
                    seed=seed,
                    scenario=scenario,
                )
                result = run(config)
                rows.append(
                    {
                        "scenario": scenario,
                        "epsilon": epsilon,
                        "replication": replication,
                        "seed": seed,
                        "n_agents": args.agents,
                        "max_steps": args.steps,
                        "steps_executed": len(result.history) - 1,
                        "converged": result.converged,
                        **result.metrics[-1],
                    }
                )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Ejecuciones: {len(rows)}")
    print(f"Salida: {args.output}")


if __name__ == "__main__":
    main()
