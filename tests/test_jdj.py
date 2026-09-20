import numpy as np

from src.jdj import jdj_mean, two_pole_membership


def test_membership_extremes():
    assert np.allclose(two_pole_membership(np.array([0.0, 1.0])), [[1.0, 0.0], [0.0, 1.0]])


def test_jdj_zero_for_single_agent_and_high_for_opposites():
    assert jdj_mean(np.array([0.5])) == 0.0
    assert np.isclose(jdj_mean(np.array([0.0, 1.0])), 1.0)
