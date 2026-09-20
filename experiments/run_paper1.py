"""Ejecuta el protocolo reproducible del Paper 1 y guarda un CSV.

No busca automaticamente una configuracion que produzca un dibujo atractivo.
Recorre la rejilla declarada en ``data/paper1_config.yaml`` y conserva una fila
por condicion y semilla. La regla matematica esta en ``src.paper1_model``.

Uso desde la raiz del repositorio:

    python experiments/run_paper1.py

Para una comprobacion rapida, sin sustituir el experimento completo:

    python experiments/run_paper1.py --quick
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

import numpy as np
import pandas as pd
import yaml

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.paper1_model import Paper1Config, initialize_opinions, step, summarize


def simulate_one(spec: dict, condition: dict, epsilon: float, seed: int) -> dict:
    """Ejecuta una replica hasta convergencia o hasta ``max_steps``."""

    config = Paper1Config(
        epsilon=float(epsilon),
        signal_a=tuple(spec["signal_a"]),
        signal_b=tuple(spec["signal_b"]),
        signal_a_weight=float(condition["signal_a_weight"]),
        signal_b_weight=float(condition["signal_b_weight"]),
    )
    opinions = initialize_opinions(
        n_agents=int(spec["n_agents"]),
        seed=seed,
        scenario=spec["initial_scenario"],
    )
    stable_steps = 0
    converged = False
    final_step = 0

    for final_step in range(1, int(spec["max_steps"]) + 1):
        updated = step(opinions, config)
        # Criterio transparente: mayor desplazamiento euclideo de cualquier
        # agente. Debe quedar bajo la tolerancia varias veces consecutivas.
        maximum_move = float(np.max(np.linalg.norm(updated - opinions, axis=1)))
        stable_steps = stable_steps + 1 if maximum_move <= float(spec["convergence_tolerance"]) else 0
        opinions = updated
        if stable_steps >= int(spec["stable_steps_required"]):
            converged = True
            break

    result = summarize(opinions, config, float(spec["cluster_threshold"]))
    return {
        "condition": condition["name"],
        "seed": seed,
        "n_agents": int(spec["n_agents"]),
        "epsilon": epsilon,
        "signal_a_weight": config.signal_a_weight,
        "signal_b_weight": config.signal_b_weight,
        "steps": final_step,
        "converged": converged,
        **result,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=ROOT / "data" / "paper1_config.yaml")
    parser.add_argument("--output", type=Path, default=ROOT / "outputs" / "paper1_results.csv")
    parser.add_argument("--quick", action="store_true", help="Una semilla y dos epsilon para verificar el flujo")
    args = parser.parse_args()

    spec = yaml.safe_load(args.config.read_text(encoding="utf-8"))
    epsilons = spec["epsilons"][:2] if args.quick else spec["epsilons"]
    seed_count = 1 if args.quick else int(spec["seeds"]["count"])
    seeds = range(int(spec["seeds"]["start"]), int(spec["seeds"]["start"]) + seed_count)

    rows = [
        simulate_one(spec, condition, float(epsilon), seed)
        for condition in spec["conditions"]
        for epsilon in epsilons
        for seed in seeds
    ]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(args.output, index=False)
    print(f"Guardadas {len(rows)} replicas en {args.output}")


if __name__ == "__main__":
    main()
