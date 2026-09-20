"""Plot the gravitational-attitudinal ABM outputs."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def plot_timeseries(input_csv: str, output_png: str) -> None:
    df = pd.read_csv(input_csv)
    fig, axes = plt.subplots(3, 1, figsize=(10, 9), sharex=True)

    axes[0].plot(df["t"], df["polarization"], linewidth=2, color="#222222")
    axes[0].set_ylim(0.0, 1.0)
    axes[0].set_yticks(np.arange(0.0, 1.01, 0.1))
    axes[0].set_ylabel("Polarizacion")
    axes[0].grid(True, alpha=0.25)

    axes[1].plot(df["t"], df["mean_epsilon"], label="epsilon", linewidth=2, color="#2f7f4f")
    axes[1].plot(df["t"], df["mean_alpha"], label="alpha", linewidth=2, color="#8c6bb1")
    axes[1].plot(df["t"], df["mean_fatigue"], label="fatiga", linewidth=2, color="#9a4f2f")
    if "n_clusters" in df.columns:
        axes[1].plot(df["t"], df["n_clusters"] / max(1.0, df["n_clusters"].max()), label="clusters norm.", linewidth=1.5, color="#555555")
    axes[1].legend()
    axes[1].grid(True, alpha=0.25)

    force_cols = [
        "mean_local_force",
        "mean_pole_force",
        "mean_event_force",
        "mean_cluster_force",
        "mean_center_force",
    ]
    for col in force_cols:
        axes[2].plot(df["t"], df[col], label=col.replace("mean_", "").replace("_force", ""))
    axes[2].set_xlabel("Tiempo")
    axes[2].set_ylabel("Fuerza media")
    axes[2].legend(ncol=3, fontsize=8)
    axes[2].grid(True, alpha=0.25)

    fig.tight_layout()
    out = Path(output_png)
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, dpi=170)
    plt.close(fig)


def plot_snapshot(history_npz: str, output_png: str) -> None:
    data = np.load(history_npz)
    opinions = data["opinions"]
    groups = data["groups"]
    final = opinions[-1]
    colors = np.where(groups == 0, "#2f6f9f", "#c4563b")

    fig, ax = plt.subplots(figsize=(7, 7))
    ax.scatter(final[:, 0], final[:, 1], c=colors, s=30, alpha=0.85, edgecolors="white", linewidths=0.35)
    ax.scatter([0, 1, 0.5], [1, 0, 0.5], marker="*", s=[300, 300, 170], c=["black", "black", "#666666"])
    ax.set_xlim(-0.04, 1.04)
    ax.set_ylim(-0.04, 1.04)
    ax.set_aspect("equal")
    ax.set_xlabel("Dimension actitudinal 1")
    ax.set_ylabel("Dimension actitudinal 2")
    ax.set_title("Estado final del ABM actitudinal")
    ax.grid(True, alpha=0.25)
    fig.tight_layout()
    out = Path(output_png)
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, dpi=170)
    plt.close(fig)


def plot_animation(
    history_npz: str,
    input_csv: str,
    output_gif: str,
    every: int = 2,
    events_csv: str | None = None,
    fps: int = 12,
    interval_ms: int = 80,
) -> None:
    from matplotlib.animation import FuncAnimation, PillowWriter

    data = np.load(history_npz)
    opinions = data["opinions"]
    groups = data["groups"]
    df = pd.read_csv(input_csv)
    events = pd.DataFrame()
    if events_csv and Path(events_csv).exists():
        events = pd.read_csv(events_csv)
    colors = np.where(groups == 0, "#2f6f9f", "#c4563b")

    fig, (ax_space, ax_pol) = plt.subplots(1, 2, figsize=(11, 5))
    scatter = ax_space.scatter(
        opinions[0, :, 0],
        opinions[0, :, 1],
        c=colors,
        s=28,
        alpha=0.85,
        edgecolors="white",
        linewidths=0.35,
    )
    ax_space.scatter([0, 1, 0.5], [1, 0, 0.5], marker="*", s=[260, 260, 150], c=["black", "black", "#666666"])
    event_scatter = ax_space.scatter([], [], marker="X", s=90, c="#7f3c8d", edgecolors="white", linewidths=0.5)
    event_circles: list[plt.Circle] = []
    ax_space.set_xlim(-0.04, 1.04)
    ax_space.set_ylim(-0.04, 1.04)
    ax_space.set_aspect("equal")
    ax_space.set_xlabel("Dimension actitudinal 1")
    ax_space.set_ylabel("Dimension actitudinal 2")
    ax_space.grid(True, alpha=0.25)

    line, = ax_pol.plot([], [], color="#222222", linewidth=2)
    ax_pol.set_xlim(float(df["t"].min()), float(df["t"].max()))
    ax_pol.set_ylim(0.0, 1.0)
    ax_pol.set_yticks(np.arange(0.0, 1.01, 0.1))
    ax_pol.set_xlabel("Tiempo")
    ax_pol.set_ylabel("Polarizacion")
    ax_pol.grid(True, alpha=0.25)

    frames = list(range(0, len(opinions), max(1, every)))
    if frames[-1] != len(opinions) - 1:
        frames.append(len(opinions) - 1)

    def update(frame: int):
        nonlocal event_circles
        scatter.set_offsets(opinions[frame, :, :2])
        line.set_data(df["t"].iloc[: frame + 1], df["polarization"].iloc[: frame + 1])
        for circle in event_circles:
            circle.remove()
        event_circles = []
        if not events.empty:
            t = float(df["t"].iloc[frame])
            active = events[(events["start"] <= t) & (t < events["start"] + events["duration"])]
            if not active.empty and {"x0", "x1"}.issubset(active.columns):
                xy = active[["x0", "x1"]].to_numpy()
                event_scatter.set_offsets(xy)
                for _, row in active.iterrows():
                    circle = plt.Circle((row["x0"], row["x1"]), row["radius"], color="#7f3c8d", fill=False, alpha=0.25, linewidth=1.5)
                    ax_space.add_patch(circle)
                    event_circles.append(circle)
            else:
                event_scatter.set_offsets(np.empty((0, 2)))
        ax_space.set_title(f"Agentes en espacio actitudinal | t={int(df['t'].iloc[frame])}")
        ax_pol.set_title(f"Polarizacion={df['polarization'].iloc[frame]:.3f} | rango={df['polarization_decile'].iloc[frame]:.1f}")
        return scatter, line, event_scatter

    animation = FuncAnimation(fig, update, frames=frames, interval=interval_ms, blit=False)
    out = Path(output_gif)
    out.parent.mkdir(parents=True, exist_ok=True)
    animation.save(out, writer=PillowWriter(fps=fps))
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="outputs/attitudinal_abm.csv")
    parser.add_argument("--history", default="outputs/attitudinal_abm_history.npz")
    parser.add_argument("--timeseries", default="outputs/attitudinal_abm_timeseries.png")
    parser.add_argument("--snapshot", default="outputs/attitudinal_abm_snapshot.png")
    parser.add_argument("--gif", default="outputs/attitudinal_abm_animation.gif")
    parser.add_argument("--events", default=None)
    parser.add_argument("--every", type=int, default=2)
    parser.add_argument("--fps", type=int, default=12)
    parser.add_argument("--interval-ms", type=int, default=80)
    parser.add_argument("--no-gif", action="store_true")
    args = parser.parse_args()
    plot_timeseries(args.csv, args.timeseries)
    plot_snapshot(args.history, args.snapshot)
    print(args.timeseries)
    print(args.snapshot)
    if not args.no_gif:
        plot_animation(
            args.history,
            args.csv,
            args.gif,
            every=args.every,
            events_csv=args.events,
            fps=args.fps,
            interval_ms=args.interval_ms,
        )
        print(args.gif)


if __name__ == "__main__":
    main()
