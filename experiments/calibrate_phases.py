"""Compara configuraciones declaradas con un panel real proporcionado por el usuario.

Ejemplo:
    python experiments/calibrate_phases.py datos.csv --phase network --steps 40

El programa no genera datos sinteticos para rellenar ausencias y no denomina
"validacion" al ajuste. El CSV debe contener agent_id,time,x,y.
"""

from __future__ import annotations

import argparse
from itertools import product
from pathlib import Path
import sys

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.calibration import evaluate_config, load_panel, panel_endpoints
from src.phased_model import PhasedConfig


def parse_grid(text: str, cast=float) -> list:
    values = [cast(value.strip()) for value in text.split(",") if value.strip()]
    if not values:
        raise argparse.ArgumentTypeError("la rejilla no puede estar vacia")
    return values


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("panel_csv", type=Path)
    parser.add_argument("--phase", choices=["hk", "dw", "fj", "network", "temporal"], default="network")
    parser.add_argument("--steps", type=int, required=True, help="rondas ABM entre primera y ultima ola")
    parser.add_argument("--epsilon", default="0.10,0.20,0.30")
    parser.add_argument("--anchor", default="0.70,0.85,0.95")
    parser.add_argument("--mu", default="0.05,0.10,0.20")
    parser.add_argument("--seeds", default="11,29,47,71,97")
    parser.add_argument("--bins", type=int, default=10)
    parser.add_argument("--network-degree", type=int, default=8)
    parser.add_argument("--network-rewiring", type=float, default=0.10)
    parser.add_argument("--output", type=Path, default=ROOT / "outputs" / "calibration_results.csv")
    args = parser.parse_args()

    frame = load_panel(args.panel_csv)
    initial, observed, _ = panel_endpoints(frame)
    epsilons = parse_grid(args.epsilon)
    anchors = parse_grid(args.anchor)
    mus = parse_grid(args.mu)
    seeds = parse_grid(args.seeds, int)

    # Solo se recorren parametros que participan en la fase seleccionada.
    anchor_grid = anchors if args.phase in {"fj", "network", "temporal"} else [0.85]
    mu_grid = mus if args.phase == "dw" else [0.08]
    rows = []
    for epsilon, anchor, mu in product(epsilons, anchor_grid, mu_grid):
        config = PhasedConfig(
            phase=args.phase,
            epsilon=epsilon,
            initial_anchor_weight=anchor,
            compromise_rate=mu,
            network_degree=args.network_degree,
            network_rewiring=args.network_rewiring,
        )
        rows.append(evaluate_config(initial, observed, config, args.steps, seeds, args.bins))

    results = pd.DataFrame(rows).sort_values(["tvd_mean", "rmse_mean"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    results.to_csv(args.output, index=False)
    print(f"Comparaciones escritas en {args.output}")
    print("Esto es ajuste dentro de muestra; no es validacion fuera de muestra.")


if __name__ == "__main__":
    main()
