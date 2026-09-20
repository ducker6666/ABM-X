import numpy as np
import pytest

from src.paper1_model import (
    Paper1Config,
    axis_projection,
    connected_components,
    euclidean_distance,
    jdj_product_axis,
    mean_squared_dispersion,
    step,
    summarize,
)


def test_euclidean_distance_is_not_manhattan_distance():
    a = np.array([0.0, 0.0])
    b = np.array([0.3, 0.4])
    assert euclidean_distance(a, b) == pytest.approx(0.5)
    assert np.abs(a - b).sum() == pytest.approx(0.7)


def test_published_update_example_is_exact():
    config = Paper1Config(
        epsilon=0.15,
        signal_a=(0.1, 0.2),
        signal_b=(0.9, 0.9),
        signal_a_weight=2.0,
        signal_b_weight=0.0,
    )
    opinions = np.array([[0.2, 0.2], [0.3, 0.2]])
    result = step(opinions, config)
    assert np.allclose(result[0], [0.175, 0.2])


def test_update_is_synchronous():
    config = Paper1Config(
        epsilon=0.41,
        signal_a=(0.0, 1.0),
        signal_b=(1.0, 0.0),
        signal_a_weight=0,
        signal_b_weight=0,
    )
    opinions = np.array([[0.0, 0.0], [0.4, 0.0], [0.8, 0.0]])
    result = step(opinions, config)
    assert np.allclose(result[:, 0], [0.2, 0.4, 0.6])


def test_signal_outside_epsilon_has_no_effect():
    config = Paper1Config(
        epsilon=0.1,
        signal_a=(0.0, 0.0),
        signal_b=(1.0, 1.0),
        signal_a_weight=100,
        signal_b_weight=100,
    )
    opinions = np.array([[0.5, 0.5]])
    assert np.allclose(step(opinions, config), opinions)


def test_axis_projection_has_declared_endpoints():
    config = Paper1Config(signal_a=(0.0, 1.0), signal_b=(1.0, 0.0))
    opinions = np.array([[0.0, 1.0], [0.5, 0.5], [1.0, 0.0]])
    assert np.allclose(axis_projection(opinions, config), [0.0, 0.5, 1.0])


def test_jdj_extreme_split_and_center_show_known_limitation():
    config = Paper1Config(signal_a=(0.0, 1.0), signal_b=(1.0, 0.0))
    split = np.array([[0.0, 1.0], [0.0, 1.0], [1.0, 0.0], [1.0, 0.0]])
    center = np.repeat([[0.5, 0.5]], 4, axis=0)
    assert jdj_product_axis(split, config) == pytest.approx(1.0)
    assert jdj_product_axis(center, config) == pytest.approx(0.5)
    assert mean_squared_dispersion(split) > mean_squared_dispersion(center)


def test_clusters_are_output_only_connected_components():
    opinions = np.array([[0.10, 0.10], [0.12, 0.10], [0.80, 0.80]])
    assert connected_components(opinions, threshold=0.05) == [[0, 1], [2]]


def test_summary_contains_reproducible_outputs():
    config = Paper1Config(signal_a=(0.0, 1.0), signal_b=(1.0, 0.0))
    opinions = np.array([[0.0, 1.0], [1.0, 0.0]])
    result = summarize(opinions, config)
    assert result["followers_a"] == 1
    assert result["followers_b"] == 1
    assert result["clusters"] == 2
