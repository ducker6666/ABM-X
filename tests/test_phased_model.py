import numpy as np
import pytest

from src.phased_model import (
    PhasedConfig,
    active_interval,
    build_small_world_network,
    deffuant_pair_update,
    friedkin_johnsen_step,
    signal_weights,
)


def test_deffuant_contact_is_partial_not_instant_consensus():
    first, second = deffuant_pair_update(np.array([0.0, 0.0]), np.array([0.2, 0.0]), 0.1)
    assert np.allclose(first, [0.02, 0.0])
    assert np.allclose(second, [0.18, 0.0])


def test_fj_anchor_prevents_exact_consensus():
    config = PhasedConfig(
        phase="fj",
        epsilon=2.0,
        signal_a_weight=0,
        signal_b_weight=0,
        initial_anchor_weight=0.9,
    )
    anchors = np.array([[0.0, 0.0], [1.0, 1.0]])
    result = friedkin_johnsen_step(anchors, anchors, config)
    assert np.allclose(result, [[0.05, 0.05], [0.95, 0.95]])
    assert not np.allclose(result[0], result[1])


def test_fj_full_anchor_means_no_change():
    config = PhasedConfig(
        phase="fj",
        epsilon=2.0,
        signal_a_weight=0,
        signal_b_weight=0,
        initial_anchor_weight=1.0,
    )
    anchors = np.array([[0.1, 0.2], [0.8, 0.9]])
    current = np.array([[0.4, 0.4], [0.6, 0.6]])
    assert np.allclose(friedkin_johnsen_step(current, anchors, config), anchors)


def test_small_world_network_is_undirected_without_self_loops():
    network = build_small_world_network(30, degree=4, rewiring=0.2, seed=7)
    for i, neighbors in enumerate(network):
        assert i not in neighbors
        for j in neighbors:
            assert i in network[j]


def test_temporal_signal_is_exactly_on_inside_interval():
    assert active_interval(19, 20, 80) == 0
    assert active_interval(20, 20, 80) == 1
    assert active_interval(99, 20, 80) == 1
    assert active_interval(100, 20, 80) == 0


def test_temporal_weights_have_no_invented_decay():
    config = PhasedConfig(
        phase="temporal",
        signal_a_weight=8,
        signal_b_weight=6,
        signal_a_start=10,
        signal_a_duration=5,
        signal_b_start=20,
        signal_b_duration=5,
    )
    assert signal_weights(config, 12) == pytest.approx((8, 0))
    assert signal_weights(config, 22) == pytest.approx((0, 6))
    assert signal_weights(config, 30) == pytest.approx((0, 0))
