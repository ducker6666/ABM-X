import numpy as np

from src.baseline_hk import HKConfig, step


def test_isolated_agents_remain_when_epsilon_zero_and_distinct():
    x = np.array([0.1, 0.9])
    assert np.allclose(step(x, HKConfig(epsilon=0.0)), x)


def test_large_radius_collapses_to_global_mean():
    x = np.array([0.0, 0.5, 1.0])
    assert np.allclose(step(x, HKConfig(epsilon=2.0)), [0.5, 0.5, 0.5])
