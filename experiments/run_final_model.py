"""CLI for the final literature-based polarization model."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.final_model import Event, FinalModelConfig, Pole, run


def _tuple_events(items: list[dict] | None) -> tuple[Event, ...]:
    return tuple(Event(position=tuple(item["position"]), **{k: v for k, v in item.items() if k != "position"}) for item in items or [])


def _tuple_poles(items: list[dict] | None) -> tuple[Pole, ...]:
    return tuple(Pole(position=tuple(item["position"]), **{k: v for k, v in item.items() if k != "position"}) for item in items or [])


def load_config(path: str) -> tuple[FinalModelConfig, str, str]:
    with open(path, "r", encoding="utf-8") as fh:
        raw = yaml.safe_load(fh)
    output_csv = raw.pop("output_csv", "outputs/final_model.csv")
    output_parquet = raw.pop("output_parquet", "outputs/final_model.parquet")
    raw["poles"] = _tuple_poles(raw.get("poles"))
    raw["events"] = _tuple_events(raw.get("events"))
    return FinalModelConfig(**raw), output_csv, output_parquet


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="data/final_model.yaml")
    parser.add_argument("--steps", type=int, default=None, help="Override iterations from YAML, e.g. 10000 or 100000")
    parser.add_argument("--sample-every", type=int, default=1, help="Save one row every N iterations")
    args = parser.parse_args()
    config, output_csv, output_parquet = load_config(args.config)
    if args.steps is not None:
        config = FinalModelConfig(**{**config.__dict__, "steps": args.steps})
    _, rows = run(config, sample_every=args.sample_every)
    df = pd.DataFrame(rows)
    csv_path = Path(output_csv)
    parquet_path = Path(output_parquet)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    parquet_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(csv_path, index=False)
    df.to_parquet(parquet_path, index=False)
    print(df.tail(1).to_string(index=False))


if __name__ == "__main__":
    main()
