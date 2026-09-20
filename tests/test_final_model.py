import numpy as np

from src.final_model import Event, FinalModelConfig, Pole, fuzzy_polarization, initialize, run, step


def test_event_decay_and_window():
    event = Event(position=(1.0, 0.0), start=5, duration=3, intensity=2.0, decay=0.5)
    assert event.activity(4) == 0.0
    assert event.activity(8) == 0.0
    assert np.isclose(event.activity(5), 2.0)
    assert event.activity(6) < event.activity(5)


def test_fuzzy_polarization_high_for_two_opposite_poles():
    opinions = np.array([[0.0, 0.0], [1.0, 1.0]], dtype=float)
    assert fuzzy_polarization(opinions) > 0.99


def test_no_forces_reduces_to_anchored_bounded_confidence_state_shape():
    cfg = FinalModelConfig(n_agents=20, steps=1, dimensions=2, network="complete", epsilon_sd=0.0, mu_sd=0.0, lambda_sd=0.0)
    state = initialize(cfg)
    before = state.opinions.copy()
    step(state, cfg, 0)
    assert state.opinions.shape == before.shape
    assert np.all((0.0 <= state.opinions) & (state.opinions <= 1.0))


def test_constant_pole_moves_population_toward_pole():
    pole = Pole(position=(1.0, 1.0), strength=0.1, reach=2.0)
    cfg = FinalModelConfig(
        n_agents=30,
        steps=1,
        dimensions=2,
        network="complete",
        poles=(pole,),
        epsilon_mean=0.0,
        epsilon_sd=0.0,
        epsilon_min=0.0,
        mu_mean=0.5,
        mu_sd=0.0,
        lambda_mean=0.0,
        lambda_sd=0.0,
        alpha_mean=0.0,
        alpha_sd=0.0,
        fatigue_sensitivity=0.0,
    )
    state = initialize(cfg)
    dist_before = np.mean(np.linalg.norm(state.opinions - np.array([1.0, 1.0]), axis=1))
    step(state, cfg, 0)
    dist_after = np.mean(np.linalg.norm(state.opinions - np.array([1.0, 1.0]), axis=1))
    assert dist_after < dist_before


def test_run_is_reproducible():
    cfg = FinalModelConfig(n_agents=25, steps=4, seed=7)
    _, rows_a = run(cfg)
    _, rows_b = run(cfg)
    assert rows_a == rows_b
