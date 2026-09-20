"""Visual agent-based simulation in attitudinal space.

Each dot is an agent. Its position is its two-dimensional attitude, not a
physical location. The plot shows the individual trajectories that produce the
aggregate polarization metrics.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from experiments.run_final_model import load_config
from src.final_model import Event, FinalModelConfig, ModelState, fuzzy_polarization, initialize, polarization_poles, step


def collect_history(config: FinalModelConfig) -> tuple[list[np.ndarray], pd.DataFrame, ModelState]:
    state = initialize(config)
    pole_a, pole_b = polarization_poles(config, config.dimensions)
    history: list[np.ndarray] = []
    rows: list[dict[str, float]] = []
    for t in range(config.steps + 1):
        history.append(state.opinions.copy())
        rows.append(
            {
                "t": float(t),
                "global_polarization": fuzzy_polarization(state.opinions, pole_a, pole_b),
                "polarization_decile": float(np.round(fuzzy_polarization(state.opinions, pole_a, pole_b), 1)),
                "mean_epsilon": float(np.mean(state.epsilon)),
                "mean_fatigue": float(np.mean(state.fatigue)),
            }
        )
        if t < config.steps:
            step(state, config, t)
    return history, pd.DataFrame(rows), state


def active_event_radius(event: Event, t: int) -> float:
    return event.reach if event.activity(t) > 0 else 0.0


def draw_snapshot(
    config: FinalModelConfig,
    history: list[np.ndarray],
    metrics: pd.DataFrame,
    state: ModelState,
    output: str,
) -> None:
    final_t = int(metrics["t"].iloc[-1])
    opinions = history[-1]
    fig = plt.figure(figsize=(11, 7))
    gs = fig.add_gridspec(2, 2, width_ratios=[1.25, 1.0], height_ratios=[1.0, 1.0])
    ax_space = fig.add_subplot(gs[:, 0])
    ax_pol = fig.add_subplot(gs[0, 1])
    ax_params = fig.add_subplot(gs[1, 1])

    colors = np.where(state.groups == 0, "#2f6f9f", "#c4563b")
    ax_space.scatter(opinions[:, 0], opinions[:, 1], c=colors, s=28, alpha=0.85, edgecolors="white", linewidths=0.35)
    for pole in config.poles:
        p = np.asarray(pole.position)
        ax_space.scatter(p[0], p[1], marker="*", s=260, c="black", edgecolors="white", linewidths=0.7)
        circle = plt.Circle((p[0], p[1]), pole.reach, color="black", fill=False, alpha=0.12, linewidth=1.5)
        ax_space.add_patch(circle)
    for event in config.events:
        radius = active_event_radius(event, final_t)
        p = np.asarray(event.position)
        if radius > 0:
            ax_space.scatter(p[0], p[1], marker="X", s=180, c="#7f3c8d", edgecolors="white")
            ax_space.add_patch(plt.Circle((p[0], p[1]), radius, color="#7f3c8d", fill=False, alpha=0.25, linewidth=2))

    ax_space.set_xlim(-0.04, 1.04)
    ax_space.set_ylim(-0.04, 1.04)
    ax_space.set_aspect("equal")
    ax_space.set_xlabel("Dimension actitudinal 1")
    ax_space.set_ylabel("Dimension actitudinal 2")
    ax_space.set_title(f"Agentes en espacio actitudinal, t={final_t}")
    ax_space.grid(True, alpha=0.2)

    ax_pol.plot(metrics["t"], metrics["global_polarization"], color="#333333", linewidth=2)
    ax_pol.set_ylabel("Polarizacion difusa")
    ax_pol.set_ylim(0.0, 1.0)
    ax_pol.set_yticks(np.arange(0.0, 1.01, 0.1))
    ax_pol.set_title("Polarizacion global")
    ax_pol.grid(True, alpha=0.25)

    ax_params.plot(metrics["t"], metrics["mean_epsilon"], label="tolerancia media", color="#2f7f4f", linewidth=2)
    ax_params.plot(metrics["t"], metrics["mean_fatigue"], label="fatiga media", color="#9a4f2f", linewidth=2)
    ax_params.set_xlabel("Tiempo")
    ax_params.legend()
    ax_params.grid(True, alpha=0.25)

    fig.tight_layout()
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=170)
    plt.close(fig)


def draw_animation(
    config: FinalModelConfig,
    history: list[np.ndarray],
    metrics: pd.DataFrame,
    state: ModelState,
    output: str,
    every: int,
) -> None:
    from matplotlib.animation import FuncAnimation, PillowWriter

    fig, (ax_space, ax_pol) = plt.subplots(1, 2, figsize=(11, 5))
    colors = np.where(state.groups == 0, "#2f6f9f", "#c4563b")
    scatter = ax_space.scatter(history[0][:, 0], history[0][:, 1], c=colors, s=26, alpha=0.85, edgecolors="white", linewidths=0.3)
    line, = ax_pol.plot([], [], color="#333333", linewidth=2)

    ax_space.set_xlim(-0.04, 1.04)
    ax_space.set_ylim(-0.04, 1.04)
    ax_space.set_aspect("equal")
    ax_space.grid(True, alpha=0.2)
    ax_space.set_xlabel("Dimension actitudinal 1")
    ax_space.set_ylabel("Dimension actitudinal 2")
    for pole in config.poles:
        p = np.asarray(pole.position)
        ax_space.scatter(p[0], p[1], marker="*", s=220, c="black", edgecolors="white", linewidths=0.7)

    ax_pol.set_xlim(0, config.steps)
    ax_pol.set_ylim(0.0, 1.0)
    ax_pol.set_yticks(np.arange(0.0, 1.01, 0.1))
    ax_pol.set_xlabel("Tiempo")
    ax_pol.set_ylabel("Polarizacion")
    ax_pol.grid(True, alpha=0.25)

    frames = list(range(0, len(history), max(1, every)))
    if frames[-1] != len(history) - 1:
        frames.append(len(history) - 1)

    def update(frame_index: int):
        pos = history[frame_index]
        scatter.set_offsets(pos[:, :2])
        line.set_data(metrics["t"].iloc[: frame_index + 1], metrics["global_polarization"].iloc[: frame_index + 1])
        ax_space.set_title(f"Agentes, t={frame_index}")
        return scatter, line

    animation = FuncAnimation(fig, update, frames=frames, interval=80, blit=False)
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    animation.save(path, writer=PillowWriter(fps=12))
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="data/final_model.yaml")
    parser.add_argument("--snapshot", default="outputs/visual_abm_snapshot.png")
    parser.add_argument("--gif", default="outputs/visual_abm_animation.gif")
    parser.add_argument("--every", type=int, default=3)
    parser.add_argument("--no-gif", action="store_true")
    args = parser.parse_args()

    config, _, _ = load_config(args.config)
    if config.dimensions != 2:
        raise ValueError("visual_abm.py requires dimensions=2")
    history, metrics, state = collect_history(config)
    draw_snapshot(config, history, metrics, state, args.snapshot)
    print(args.snapshot)
    if not args.no_gif:
        draw_animation(config, history, metrics, state, args.gif, args.every)
        print(args.gif)


if __name__ == "__main__":
    main()
