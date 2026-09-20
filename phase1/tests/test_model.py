"""Pruebas de la especificación matemática de Fase 1."""

from __future__ import annotations

import math

import pytest

from phase1.src.model import (
    ModelConfig,
    XorShift32,
    cluster_count,
    initialize_opinions,
    jdj_product,
    run,
    step,
    summarize,
)


def test_hk_step_matches_hand_calculated_example() -> None:
    updated, displacement = step([0.20, 0.30, 0.90], epsilon=0.15)
    assert updated == pytest.approx([0.25, 0.25, 0.90])
    assert displacement == pytest.approx(0.05)


def test_hk_update_is_synchronous() -> None:
    # Si fuera secuencial, el segundo valor podría usar el 0.05 ya actualizado.
    updated, _ = step([0.00, 0.10, 0.21], epsilon=0.11)
    assert updated == pytest.approx([0.05, 0.10333333333333333, 0.155])


def test_self_is_included_when_no_other_agent_is_close() -> None:
    updated, displacement = step([0.10, 0.90], epsilon=0.01)
    assert updated == pytest.approx([0.10, 0.90])
    assert displacement == 0.0


def test_epsilon_one_reaches_consensus_in_one_step() -> None:
    updated, _ = step([0.0, 0.25, 1.0], epsilon=1.0)
    assert updated == pytest.approx([5 / 12, 5 / 12, 5 / 12])


def test_step_preserves_unit_interval() -> None:
    updated, _ = step([0.0, 0.2, 0.8, 1.0], epsilon=0.3)
    assert all(0.0 <= value <= 1.0 for value in updated)


def test_jdj_product_known_cases_and_limitation() -> None:
    extreme_raw, extreme_normalized = jdj_product([0.0, 1.0])
    centre_raw, centre_normalized = jdj_product([0.5, 0.5])
    one_side_raw, one_side_normalized = jdj_product([0.0, 0.0])

    assert (extreme_raw, extreme_normalized) == pytest.approx((0.25, 1.0))
    assert (centre_raw, centre_normalized) == pytest.approx((0.25, 1.0))
    assert (one_side_raw, one_side_normalized) == pytest.approx((0.0, 0.0))


def test_jdj_product_equals_explicit_double_sum() -> None:
    opinions = [0.1, 0.4, 0.9]
    explicit = sum((1 - left) * right for left in opinions for right in opinions)
    explicit /= len(opinions) ** 2
    raw, _ = jdj_product(opinions)
    assert raw == pytest.approx(explicit)


def test_cluster_count_is_an_output_rule() -> None:
    opinions = [0.10, 0.12, 0.50, 0.53, 0.90]
    assert cluster_count(opinions, threshold=0.05) == 3
    assert cluster_count(opinions, threshold=0.50) == 1


def test_xorshift_reference_sequence() -> None:
    rng = XorShift32(1)
    integers = [round(rng.random() * 2**32) for _ in range(5)]
    assert integers == [270369, 67634689, 2647435461, 307599695, 2398689233]


@pytest.mark.parametrize(
    "scenario",
    [
        "uniform",
        "central",
        "bipolar_balanced",
        "bipolar_unbalanced",
        "three_groups",
    ],
)
def test_initialization_is_reproducible_and_bounded(scenario: str) -> None:
    config = ModelConfig(n_agents=25, seed=12345, scenario=scenario)
    first = initialize_opinions(config)
    second = initialize_opinions(config)
    assert first == second
    assert len(first) == 25
    assert all(0.0 <= value <= 1.0 for value in first)


def test_run_records_real_displacement_and_converges() -> None:
    config = ModelConfig(n_agents=3, epsilon=1.0, max_steps=10)
    result = run(config, initial_opinions=[0.0, 0.25, 1.0])
    assert result.converged
    assert result.metrics[1]["max_displacement"] > 0.0
    assert result.metrics[-1]["max_displacement"] == pytest.approx(0.0)


def test_metrics_are_finite() -> None:
    metrics = summarize(
        [0.1, 0.3, 0.9], time=0, max_displacement=0.0, cluster_threshold=0.05
    )
    for key, value in metrics.items():
        if key not in {"time", "clusters"}:
            assert math.isfinite(float(value))


@pytest.mark.parametrize(
    "config",
    [
        ModelConfig(n_agents=1),
        ModelConfig(epsilon=-0.1),
        ModelConfig(epsilon=1.1),
        ModelConfig(seed=0),
        ModelConfig(max_steps=0),
        ModelConfig(scenario="invented"),
    ],
)
def test_invalid_configuration_is_rejected(config: ModelConfig) -> None:
    with pytest.raises(ValueError):
        config.validate()
