import numpy as np

from src.integrated_model import (
    ExternalEvent,
    IntegratedConfig,
    assign_immobility,
    bounded_noise,
    event_weight,
    jdj_axis,
    radicality,
    signal_weights,
    social_impact_coefficient,
    step,
)


def base_config(**changes):
    values = dict(
        epsilon=0.2,
        homophily_scale=0.4,
        social_rate=0.1,
        signal_a_weight=0.0,
        signal_b_weight=0.0,
        fatigue_enabled=False,
        adaptive_commitment=False,
        auditor_enabled=False,
        noise_enabled=False,
    )
    values.update(changes)
    return IntegratedConfig(**values)


def test_social_impact_attracts_near_and_repels_far():
    near = social_impact_coefficient(0.1, tolerance=0.2, homophily_scale=0.4, reactance_enabled=True)
    far = social_impact_coefficient(0.3, tolerance=0.2, homophily_scale=0.4, reactance_enabled=True)
    assert near > 0
    assert far < 0
    assert social_impact_coefficient(0.3, 0.2, 0.4, False) == 0


def test_cluster_mass_is_number_of_contributing_voices():
    # Para el agente 0, tres contactos a la derecha aportan tres terminos
    # iguales. Su nueva coordenada debe desplazarse hacia la derecha.
    opinions = np.array([[0.20, 0.50], [0.25, 0.50], [0.25, 0.50], [0.25, 0.50]])
    adjacency = [{1, 2, 3}, {0}, {0}, {0}]
    updated, _ = step(opinions, base_config(), adjacency, np.zeros(4, dtype=bool), np.random.default_rng(1), 0)
    assert updated[0, 0] > opinions[0, 0]


def test_larger_pole_weight_produces_larger_step():
    opinions = np.array([[0.20, 0.50]])
    immobile = np.array([False])
    low, _ = step(
        opinions,
        base_config(signal_a=(0.10, 0.50), signal_a_weight=1.0, epsilon=0.2),
        [set()], immobile, np.random.default_rng(1), 0,
    )
    high, _ = step(
        opinions,
        base_config(signal_a=(0.10, 0.50), signal_a_weight=5.0, epsilon=0.2),
        [set()], immobile, np.random.default_rng(1), 0,
    )
    assert high[0, 0] < low[0, 0] < opinions[0, 0]


def test_jdj_reports_medium_risk_for_center_and_maximum_for_split():
    a = np.array([0.0, 1.0])
    b = np.array([1.0, 0.0])
    split = np.array([[0.0, 1.0], [0.0, 1.0], [1.0, 0.0], [1.0, 0.0]])
    center = np.full((4, 2), 0.5)
    assert np.isclose(jdj_axis(split, a, b), 1.0)
    assert np.isclose(jdj_axis(center, a, b), 0.5)


def test_auditor_requires_jdj_and_dispersion_then_recenters():
    opinions = np.array([[0.0, 1.0], [1.0, 0.0]])
    cfg = base_config(
        auditor_enabled=True,
        auditor_threshold=0.5,
        auditor_min_dispersion=0.01,
        center_strength=0.1,
        social_rate=0.0,
    )
    updated, active = step(opinions, cfg, [set(), set()], np.zeros(2, dtype=bool), np.random.default_rng(1), 0)
    assert active
    assert np.linalg.norm(updated[0] - 0.5) < np.linalg.norm(opinions[0] - 0.5)


def test_commitment_reduces_motion_at_an_extreme():
    assert radicality(np.array([0.5, 0.5])) == 0
    assert np.isclose(radicality(np.array([0.0, 0.0])), 1.0)


def test_signal_attention_decays_inside_window():
    cfg = IntegratedConfig(
        signal_a_weight=5.0,
        signal_a_start=0,
        signal_a_duration=200,
        signal_a_permanent=False,
        signal_b_weight=0.0,
        fatigue_decay=0.01,
    )
    assert signal_weights(cfg, 100)[0] < signal_weights(cfg, 0)[0]
    assert signal_weights(cfg, 200)[0] == 0


def test_permanent_poles_do_not_expire_or_decay():
    cfg = IntegratedConfig(signal_a_weight=5.0, signal_a_permanent=True, fatigue_decay=0.1)
    assert signal_weights(cfg, 0)[0] == 5.0
    assert signal_weights(cfg, 900)[0] == 5.0


def test_event_has_declared_window_and_attention_decay():
    event = ExternalEvent(position=(0.2, 0.8), intensity=5.0, reach=0.25, start=20, duration=60)
    assert event_weight(event, 19, True, 0.01) == 0
    assert np.isclose(event_weight(event, 40, True, 0.01), 5 * np.exp(-0.2))
    assert event_weight(event, 80, True, 0.01) == 0


def test_active_event_moves_only_agents_inside_its_reach():
    opinions = np.array([[0.20, 0.50], [0.80, 0.50]])
    event = ExternalEvent(position=(0.10, 0.50), intensity=5.0, reach=0.25, start=0, duration=10)
    updated, _ = step(
        opinions,
        base_config(),
        [set(), set()],
        np.zeros(2, dtype=bool),
        np.random.default_rng(1),
        0,
        events=(event,),
    )
    assert updated[0, 0] < opinions[0, 0]
    assert updated[1, 0] == opinions[1, 0]


def test_noise_is_bounded_and_immobility_is_reproducible():
    opinion = np.array([0.5, 0.5])
    noisy = bounded_noise(opinion, 0.02, np.random.default_rng(1))
    assert np.all(np.abs(noisy - opinion) <= 0.02)
    first = assign_immobility(100, 0.1, 123)
    second = assign_immobility(100, 0.1, 123)
    assert np.array_equal(first, second)


def test_immobile_agent_does_not_move():
    opinions = np.array([[0.20, 0.50], [0.25, 0.50]])
    updated, _ = step(
        opinions,
        base_config(),
        [{1}, {0}],
        np.array([True, False]),
        np.random.default_rng(1),
        0,
    )
    assert np.array_equal(updated[0], opinions[0])
