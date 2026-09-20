import numpy as np

from src.baseline_vicsek import VicsekConfig, order_parameter, periodic_distance_matrix, step


def test_two_agents_same_angle_align_and_preserve_speed():
    cfg = VicsekConfig(n_agents=2, speed=0.1, radius=1.0, noise=0.0, seed=1)
    x = np.array([[0.2, 0.2], [0.3, 0.2]], dtype=float)
    th = np.array([0.0, 0.0], dtype=float)
    nx, nth = step(x, th, cfg, np.random.default_rng(1))
    assert np.allclose(nth, [0.0, 0.0])
    assert np.allclose(np.linalg.norm((nx - x) % 1.0, axis=1), [0.1, 0.1])


def test_circular_mean_1_and_359_degrees():
    cfg = VicsekConfig(n_agents=2, speed=0.0, radius=1.0, noise=0.0, seed=1)
    x = np.array([[0.2, 0.2], [0.3, 0.2]], dtype=float)
    th = np.deg2rad(np.array([1.0, 359.0]))
    _, nth = step(x, th, cfg, np.random.default_rng(1))
    assert np.allclose(np.angle(np.exp(1j * nth)), [0.0, 0.0], atol=1e-12)


def test_agents_on_opposite_edges_are_neighbors_periodically():
    x = np.array([[0.01, 0.5], [0.99, 0.5]], dtype=float)
    dist = periodic_distance_matrix(x, 1.0)
    assert np.isclose(dist[0, 1], 0.02)


def test_radius_zero_includes_self_only_when_positions_distinct():
    cfg = VicsekConfig(n_agents=2, speed=0.0, radius=0.0, noise=0.0, seed=1)
    x = np.array([[0.2, 0.2], [0.3, 0.2]], dtype=float)
    th = np.array([0.2, 2.0], dtype=float)
    _, nth = step(x, th, cfg, np.random.default_rng(1))
    assert np.allclose(nth, th)


def test_order_parameter_alignment_and_uniform_disorder():
    assert np.isclose(order_parameter(np.zeros(4)), 1.0)
    assert order_parameter(np.linspace(0, 2 * np.pi, 4, endpoint=False)) < 1e-15


def test_rotation_invariance_of_order_parameter():
    th = np.array([0.0, 0.5, 1.0])
    assert np.isclose(order_parameter(th), order_parameter(th + 0.7))
