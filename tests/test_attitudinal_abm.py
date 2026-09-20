import numpy as np

from src.attitudinal_abm import ABMConfig, Attractor, Event, global_polarization, initialize, run, step


def test_polarization_range_and_decile():
    cfg = ABMConfig(n_agents=20, steps=2, poles=(Attractor((0.0, 1.0), 0.01, 0.5), Attractor((1.0, 0.0), 0.01, 0.5)))
    _, rows, _ = run(cfg)
    for row in rows:
        assert 0.0 <= row["polarization"] <= 1.0
        assert row["polarization_decile"] in {i / 10 for i in range(11)}


def test_alpha_blocks_motion_when_force_is_small():
    cfg = ABMConfig(
        n_agents=10,
        steps=1,
        network="complete",
        local_weight=0.0,
        poles=(Attractor((1.0, 1.0), 0.001, 1.0),),
        alpha_mean=10.0,
        alpha_sd=0.0,
    )
    state = initialize(cfg)
    before = state.opinions.copy()
    step(state, cfg, 0, np.random.default_rng(1))
    assert np.allclose(before, state.opinions)


def test_pole_moves_agents_when_alpha_is_zero():
    cfg = ABMConfig(
        n_agents=10,
        steps=1,
        network="complete",
        local_weight=0.0,
        poles=(Attractor((1.0, 1.0), 0.2, 2.0),),
        alpha_mean=0.0,
        alpha_sd=0.0,
        lambda_mean=0.0,
        lambda_sd=0.0,
    )
    state = initialize(cfg)
    before = np.mean(np.linalg.norm(state.opinions - np.array([1.0, 1.0]), axis=1))
    step(state, cfg, 0, np.random.default_rng(1))
    after = np.mean(np.linalg.norm(state.opinions - np.array([1.0, 1.0]), axis=1))
    assert after < before


def test_event_decay():
    event = Event((0.0, 1.0), start=3, duration=3, strength=2.0, radius=0.2, decay=0.5)
    assert event.active_strength(2) == 0.0
    assert event.active_strength(6) == 0.0
    assert event.active_strength(4) < event.active_strength(3)


def test_known_polarization_cases():
    pole_a = np.array([0.0, 1.0])
    pole_b = np.array([1.0, 0.0])
    polarized = np.array([[0.0, 1.0], [1.0, 0.0]])
    one_sided = np.array([[0.0, 1.0], [0.0, 1.0]])
    assert global_polarization(polarized, pole_a, pole_b) > 0.99
    assert global_polarization(one_sided, pole_a, pole_b) < 0.01
