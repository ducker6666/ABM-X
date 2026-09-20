"""Contrato de equivalencia entre el motor Python y el motor de la web."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest

from phase1.src.model import ModelConfig, initialize_opinions, jdj_product, step


ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js no disponible")
def test_javascript_matches_python_golden_case() -> None:
    completed = subprocess.run(
        ["node", str(ROOT / "phase1/web/verification.js"), "--json"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    js = json.loads(completed.stdout)

    config = ModelConfig(
        n_agents=8,
        epsilon=0.2,
        max_steps=4,
        seed=2026,
        scenario="uniform",
    )
    initial = initialize_opinions(config)
    after_one, displacement = step(initial, config.epsilon)
    raw, normalized = jdj_product(after_one)

    assert js["initial"] == pytest.approx(initial, abs=1e-15)
    assert js["after_one"] == pytest.approx(after_one, abs=1e-15)
    assert js["displacement"] == pytest.approx(displacement, abs=1e-15)
    assert js["jdj_raw"] == pytest.approx(raw, abs=1e-15)
    assert js["jdj_normalized"] == pytest.approx(normalized, abs=1e-15)

    for scenario, js_values in js["initial_by_scenario"].items():
        scenario_config = ModelConfig(n_agents=15, seed=12345, scenario=scenario)
        assert js_values == pytest.approx(
            initialize_opinions(scenario_config), abs=1e-15
        )
