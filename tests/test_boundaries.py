import numpy as np

from src.baseline_hk import apply_boundary


def test_clip_boundary():
    assert np.allclose(apply_boundary(np.array([-0.2, 0.4, 1.2]), "clip"), [0.0, 0.4, 1.0])


def test_reflect_boundary():
    assert np.allclose(apply_boundary(np.array([-0.2, 0.4, 1.2, 2.2]), "reflect"), [0.2, 0.4, 0.8, 0.2])
