import numpy as np

from src.baseline_vicsek import VicsekConfig, run


def test_vicsek_reproducible_with_seed():
    cfg = VicsekConfig(seed=42)
    a = run(cfg, 3)
    b = run(cfg, 3)
    for left, right in zip(a, b):
        assert np.allclose(left, right)
