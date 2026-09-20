"""Run the gravitational-attitudinal ABM."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.attitudinal_abm import ABMConfig, Aggregator, Attractor, Event, config_with_steps, run


def parse_poles(items: list[dict] | None) -> tuple[Attractor, ...]:
    return tuple(Attractor(position=tuple(item["position"]), **{k: v for k, v in item.items() if k != "position"}) for item in items or [])


def parse_events(items: list[dict] | None) -> tuple[Event, ...]:
    events: list[Event] = []
    for item in items or []:
        data = dict(item)
        data["position"] = tuple(data["position"])
        if data.get("counter_position") is not None:
            data["counter_position"] = tuple(data["counter_position"])
        events.append(Event(**data))
    return tuple(events)


def load_config(path: str) -> tuple[ABMConfig, str, str, str, str]:
    with open(path, "r", encoding="utf-8") as fh:
        raw = yaml.safe_load(fh)
    output_csv = raw.pop("output_csv", "outputs/attitudinal_abm.csv")
    output_parquet = raw.pop("output_parquet", "outputs/attitudinal_abm.parquet")
    output_history = raw.pop("output_history", "outputs/attitudinal_abm_history.npz")
    output_events = raw.pop("output_events", "outputs/attitudinal_abm_random_events.csv")
    raw["aggregator"] = Aggregator(raw.get("aggregator", "mean"))
    raw["poles"] = parse_poles(raw.get("poles"))
    raw["events"] = parse_events(raw.get("events"))
    return ABMConfig(**raw), output_csv, output_parquet, output_history, output_events


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="data/attitudinal_abm.yaml")
    parser.add_argument("--steps", type=int, default=None)
    parser.add_argument("--sample-every", type=int, default=1)
    args = parser.parse_args()

    config, output_csv, output_parquet, output_history, output_events = load_config(args.config)
    if args.steps is not None:
        config = config_with_steps(config, args.steps)

    state, rows, history = run(config, sample_every=args.sample_every)
    df = pd.DataFrame(rows)
    csv_path = Path(output_csv)
    parquet_path = Path(output_parquet)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    parquet_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(csv_path, index=False)
    df.to_parquet(parquet_path, index=False)

    history_path = Path(output_history)
    history_path.parent.mkdir(parents=True, exist_ok=True)
    import numpy as np

    np.savez_compressed(
        history_path,
        opinions=np.asarray(history, dtype=float),
        groups=state.groups,
        epsilon=state.epsilon,
        fatigue=state.fatigue,
    )
    events_path = Path(output_events)
    events_path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(state.random_event_log).to_csv(events_path, index=False)
    print(df.tail(1).to_string(index=False))
    print(csv_path)
    print(history_path)
    print(events_path)


if __name__ == "__main__":
    main()
