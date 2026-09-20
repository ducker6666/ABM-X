"""Calibracion transparente contra un panel empirico de opiniones 2D.

Este modulo no contiene datos ni afirma que el modelo este validado. Define dos
distancias observables entre la ultima ola del panel y la simulacion:

1. Error individual (si se observa a las mismas personas):

       RMSE = sqrt((1/N) * sum_i ||x_i observado - x_i simulado||_2^2)

2. Distancia de variacion total entre histogramas 2D normalizados:

       TVD = (1/2) * sum_b |p_b observado - p_b simulado|

La TVD es una distancia estadistica estandar; los bins son una decision
operativa que debe declararse y someterse a sensibilidad. Una puntuacion menor
indica mejor ajuste, pero un buen ajuste no demuestra que el mecanismo sea el
verdadero: hace falta validacion fuera de muestra y comparacion con alternativas.
"""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
from numpy.typing import NDArray

from src.phased_model import PhasedConfig, advance, build_small_world_network


FloatArray = NDArray[np.float64]
REQUIRED_COLUMNS = ("agent_id", "time", "x", "y")


def load_panel(path: str | Path) -> pd.DataFrame:
    """Carga y valida un CSV longitudinal; no rellena valores ausentes."""

    frame = pd.read_csv(path)
    missing = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing:
        raise ValueError(f"faltan columnas obligatorias: {', '.join(missing)}")
    frame = frame.loc[:, REQUIRED_COLUMNS].copy()
    if frame.empty:
        raise ValueError("el CSV no contiene observaciones")
    if frame.isna().any().any():
        raise ValueError("el CSV contiene valores ausentes; deben documentarse antes de calibrar")
    if frame.duplicated(["agent_id", "time"]).any():
        raise ValueError("cada pareja agent_id-tiempo debe ser unica")
    frame["time"] = pd.to_numeric(frame["time"], errors="raise")
    for column in ("x", "y"):
        frame[column] = pd.to_numeric(frame[column], errors="raise")
        if not frame[column].between(0.0, 1.0).all():
            raise ValueError(f"{column} debe pertenecer a [0,1]")
    if frame["time"].nunique() < 2:
        raise ValueError("se necesitan al menos dos momentos temporales")
    return frame.sort_values(["time", "agent_id"]).reset_index(drop=True)


def panel_endpoints(frame: pd.DataFrame) -> tuple[FloatArray, FloatArray, list[str]]:
    """Alinea agentes presentes tanto en la primera como en la ultima ola."""

    first_time = frame["time"].min()
    last_time = frame["time"].max()
    first = frame.loc[frame["time"] == first_time].set_index("agent_id")
    last = frame.loc[frame["time"] == last_time].set_index("agent_id")
    common = sorted(set(first.index).intersection(last.index), key=str)
    if not common:
        raise ValueError("no hay agentes observados en ambas olas")
    initial = first.loc[common, ["x", "y"]].to_numpy(dtype=np.float64)
    observed = last.loc[common, ["x", "y"]].to_numpy(dtype=np.float64)
    return initial, observed, [str(agent_id) for agent_id in common]


def individual_rmse(simulated: FloatArray, observed: FloatArray) -> float:
    """RMSE euclideo para agentes emparejados por identificador."""

    simulated = np.asarray(simulated, dtype=np.float64)
    observed = np.asarray(observed, dtype=np.float64)
    if simulated.shape != observed.shape or simulated.ndim != 2 or simulated.shape[1] != 2:
        raise ValueError("simulated y observed deben tener forma identica (N,2)")
    return float(np.sqrt(np.mean(np.sum((simulated - observed) ** 2, axis=1))))


def histogram_tvd(simulated: FloatArray, observed: FloatArray, bins: int = 10) -> float:
    """Variacion total entre histogramas 2D normalizados sobre [0,1]^2."""

    if bins < 2:
        raise ValueError("bins debe ser al menos 2")
    edges = np.linspace(0.0, 1.0, bins + 1)
    sim_hist, _, _ = np.histogram2d(simulated[:, 0], simulated[:, 1], bins=(edges, edges))
    obs_hist, _, _ = np.histogram2d(observed[:, 0], observed[:, 1], bins=(edges, edges))
    sim_prob = sim_hist / sim_hist.sum()
    obs_prob = obs_hist / obs_hist.sum()
    return float(0.5 * np.abs(sim_prob - obs_prob).sum())


def simulate_from_observations(
    initial: FloatArray,
    config: PhasedConfig,
    steps: int,
    seed: int,
) -> FloatArray:
    """Simula desde la primera ola sin modificar las anclas observadas."""

    if steps < 1:
        raise ValueError("steps debe ser positivo")
    current = np.asarray(initial, dtype=np.float64).copy()
    anchors = current.copy()
    config.validate(len(current))
    rng = np.random.default_rng(seed)
    adjacency = None
    if config.phase in {"network", "temporal"}:
        adjacency = build_small_world_network(
            len(current), config.network_degree, config.network_rewiring, seed
        )
    for t in range(steps):
        current = advance(current, anchors, config, rng, t, adjacency)
    return current


def evaluate_config(
    initial: FloatArray,
    observed: FloatArray,
    config: PhasedConfig,
    steps: int,
    seeds: Iterable[int],
    bins: int = 10,
) -> dict[str, object]:
    """Evalua una configuracion y conserva la variabilidad entre semillas."""

    seed_values = list(seeds)
    if not seed_values:
        raise ValueError("se necesita al menos una semilla")
    rmses: list[float] = []
    tvds: list[float] = []
    for seed in seed_values:
        simulated = simulate_from_observations(initial, config, steps, seed)
        rmses.append(individual_rmse(simulated, observed))
        tvds.append(histogram_tvd(simulated, observed, bins))
    result: dict[str, object] = {
        "phase": config.phase,
        "steps": steps,
        "n_seeds": len(seed_values),
        "seeds": ";".join(str(seed) for seed in seed_values),
        "bins": bins,
        "rmse_mean": float(np.mean(rmses)),
        "rmse_sd": float(np.std(rmses)),
        "tvd_mean": float(np.mean(tvds)),
        "tvd_sd": float(np.std(tvds)),
        "signal_a_x": config.signal_a[0],
        "signal_a_y": config.signal_a[1],
        "signal_b_x": config.signal_b[0],
        "signal_b_y": config.signal_b[1],
    }
    for key, value in asdict(config).items():
        if key not in {"signal_a", "signal_b"}:
            result[key] = value
    return result
