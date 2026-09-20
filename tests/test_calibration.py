import numpy as np
import pandas as pd
import pytest

from src.calibration import histogram_tvd, individual_rmse, panel_endpoints


def test_individual_rmse_is_zero_for_identical_points():
    points = np.array([[0.1, 0.2], [0.8, 0.9]])
    assert individual_rmse(points, points) == pytest.approx(0.0)


def test_histogram_tvd_known_extreme():
    first = np.array([[0.1, 0.1], [0.2, 0.2]])
    second = np.array([[0.8, 0.8], [0.9, 0.9]])
    assert histogram_tvd(first, second, bins=2) == pytest.approx(1.0)


def test_panel_endpoints_aligns_agents():
    frame = pd.DataFrame({
        "agent_id": [2, 1, 1, 2],
        "time": [0, 0, 1, 1],
        "x": [0.2, 0.1, 0.3, 0.4],
        "y": [0.8, 0.9, 0.7, 0.6],
    })
    initial, observed, ids = panel_endpoints(frame)
    assert ids == ["1", "2"]
    assert np.allclose(initial, [[0.1, 0.9], [0.2, 0.8]])
    assert np.allclose(observed, [[0.3, 0.7], [0.4, 0.6]])
