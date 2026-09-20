"""Capas posteriores al modelo base, cada una separada y trazable.

La Fase 1 permanece en :mod:`src.paper1_model`. Este modulo no sustituye ese
control; anade mecanismos publicados de uno en uno:

Fase 2 -- Deffuant--Weisbuch (DW)
    Solo una muestra de parejas interactua en cada ronda. Si dos opiniones
    estan a distancia menor o igual que epsilon, avanzan una fraccion mu.
    Con 0 < mu <= 0.5, un contacto no crea acuerdo instantaneo.

Fase 3 -- Friedkin--Johnsen (FJ)
    Cada agente conserva peso g en su opinion inicial (prejuicio/ancla):

        x_i(t+1) = g x_i(0) + (1-g) T_i(t),

    donde T_i es la media de confianza acotada. Si g > 0 y las anclas son
    diferentes, el consenso exacto deja de ser automatico.

Fase 4 -- red social explicita
    T_i solo puede incluir agentes unidos a i por una arista y, ademas, dentro
    de epsilon. La red de demostracion es Watts--Strogatz. Una red sintetica
    no se presenta como una red social real; puede sustituirse por datos.

Fase 5 -- senales temporales
    Las intensidades de A y B se multiplican por indicadores de intervalo.
    No se inventa una curva de fatiga:

        a_k(t) = 1 si start_k <= t < start_k + duration_k; 0 en otro caso.

Fase 6 -- calibracion
    Las funciones de comparacion con datos estan en ``src/calibration.py``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from src.paper1_model import Paper1Config, step as hk_signal_step


FloatArray = NDArray[np.float64]
Adjacency = list[set[int]]
PhaseName = Literal["hk", "dw", "fj", "network", "temporal"]


@dataclass(frozen=True)
class PhasedConfig:
    phase: PhaseName = "network"
    epsilon: float = 0.20
    signal_a: tuple[float, float] = (0.10, 0.90)
    signal_b: tuple[float, float] = (0.90, 0.10)
    signal_a_weight: float = 5.0
    signal_b_weight: float = 5.0

    # Deffuant--Weisbuch: cambio por contacto y numero medio de contactos.
    compromise_rate: float = 0.08
    interactions_per_agent: float = 0.50

    # Friedkin--Johnsen: peso de la opinion inicial. g=0 recupera la media
    # social; g=1 significa que el agente no abandona su posicion inicial.
    initial_anchor_weight: float = 0.85

    # Red Watts--Strogatz sintetica. degree debe ser par.
    network_degree: int = 8
    network_rewiring: float = 0.10

    # Intervalos exogenos simples de la Fase 5.
    signal_a_start: int = 20
    signal_a_duration: int = 80
    signal_b_start: int = 80
    signal_b_duration: int = 80

    def validate(self, n_agents: int | None = None) -> None:
        if self.phase not in {"hk", "dw", "fj", "network", "temporal"}:
            raise ValueError("fase desconocida")
        if self.epsilon < 0:
            raise ValueError("epsilon debe ser no negativo")
        if not 0 < self.compromise_rate <= 0.5:
            raise ValueError("compromise_rate debe pertenecer a (0, 0.5]")
        if self.interactions_per_agent <= 0:
            raise ValueError("interactions_per_agent debe ser positivo")
        if not 0 <= self.initial_anchor_weight <= 1:
            raise ValueError("initial_anchor_weight debe pertenecer a [0,1]")
        if self.signal_a_weight < 0 or self.signal_b_weight < 0:
            raise ValueError("los pesos de senal deben ser no negativos")
        if self.network_degree < 2 or self.network_degree % 2:
            raise ValueError("network_degree debe ser un entero par >= 2")
        # El grado solo participa en las fases que realmente usan una red.
        # No debe invalidar una prueba pequena de HK, DW o FJ.
        if self.phase in {"network", "temporal"} and n_agents is not None and self.network_degree >= n_agents:
            raise ValueError("network_degree debe ser menor que el numero de agentes")
        if not 0 <= self.network_rewiring <= 1:
            raise ValueError("network_rewiring debe pertenecer a [0,1]")
        if min(self.signal_a_start, self.signal_b_start, self.signal_a_duration, self.signal_b_duration) < 0:
            raise ValueError("los tiempos de las senales deben ser no negativos")

        base = Paper1Config(
            epsilon=self.epsilon,
            signal_a=self.signal_a,
            signal_b=self.signal_b,
            signal_a_weight=self.signal_a_weight,
            signal_b_weight=self.signal_b_weight,
        )
        base.validate()


def active_interval(t: int, start: int, duration: int) -> float:
    """Indicador rectangular de una senal temporal, sin decaimiento ad hoc."""

    return 1.0 if start <= t < start + duration else 0.0


def signal_weights(config: PhasedConfig, t: int) -> tuple[float, float]:
    """Devuelve pesos persistentes o activados por intervalos declarados."""

    if config.phase != "temporal":
        return config.signal_a_weight, config.signal_b_weight
    return (
        config.signal_a_weight * active_interval(t, config.signal_a_start, config.signal_a_duration),
        config.signal_b_weight * active_interval(t, config.signal_b_start, config.signal_b_duration),
    )


def build_small_world_network(n_agents: int, degree: int, rewiring: float, seed: int) -> Adjacency:
    """Construye una red Watts--Strogatz no dirigida y reproducible.

    Se parte de un anillo donde cada nodo tiene ``degree`` vecinos. Para cada
    arista orientada hacia delante, con probabilidad ``rewiring`` se sustituye
    el extremo por un nodo elegido uniformemente, evitando lazos y duplicados.
    """

    if n_agents < 3:
        raise ValueError("se necesitan al menos tres agentes")
    if degree < 2 or degree % 2 or degree >= n_agents:
        raise ValueError("degree debe ser par, >=2 y menor que n_agents")
    if not 0 <= rewiring <= 1:
        raise ValueError("rewiring debe pertenecer a [0,1]")

    rng = np.random.default_rng(seed)
    adjacency: Adjacency = [set() for _ in range(n_agents)]
    forward_edges: list[tuple[int, int]] = []
    for i in range(n_agents):
        for offset in range(1, degree // 2 + 1):
            j = (i + offset) % n_agents
            adjacency[i].add(j)
            adjacency[j].add(i)
            forward_edges.append((i, j))

    for i, old_j in forward_edges:
        if rng.random() >= rewiring or old_j not in adjacency[i]:
            continue
        candidates = [node for node in range(n_agents) if node != i and node not in adjacency[i]]
        if not candidates:
            continue
        new_j = int(rng.choice(candidates))
        adjacency[i].remove(old_j)
        adjacency[old_j].remove(i)
        adjacency[i].add(new_j)
        adjacency[new_j].add(i)
    return adjacency


def deffuant_pair_update(first: FloatArray, second: FloatArray, mu: float) -> tuple[FloatArray, FloatArray]:
    """Compromiso parcial simetrico de Deffuant--Weisbuch.

    Ejemplo: con opiniones 0 y 0.2 y mu=0.1, pasan a 0.02 y 0.18. No saltan
    directamente al promedio 0.1.
    """

    if not 0 < mu <= 0.5:
        raise ValueError("mu debe pertenecer a (0,0.5]")
    a = np.asarray(first, dtype=np.float64)
    b = np.asarray(second, dtype=np.float64)
    return a + mu * (b - a), b + mu * (a - b)


def deffuant_round(
    opinions: FloatArray,
    config: PhasedConfig,
    rng: np.random.Generator,
    t: int,
) -> FloatArray:
    """Ejecuta una ronda de contactos aleatorios DW con senales obstinadas."""

    config.validate(len(opinions))
    current = np.asarray(opinions, dtype=np.float64).copy()
    n_agents = len(current)
    interactions = max(1, round(n_agents * config.interactions_per_agent))
    weight_a, weight_b = signal_weights(config, t)
    pool_weight = n_agents + weight_a + weight_b
    signal_a = np.asarray(config.signal_a, dtype=np.float64)
    signal_b = np.asarray(config.signal_b, dtype=np.float64)

    for _ in range(interactions):
        i = int(rng.integers(0, n_agents))
        draw = float(rng.random() * pool_weight)
        if draw < n_agents:
            j = int(draw)
            if i == j:
                continue
            if np.linalg.norm(current[i] - current[j]) <= config.epsilon:
                current[i], current[j] = deffuant_pair_update(
                    current[i].copy(), current[j].copy(), config.compromise_rate
                )
        else:
            target = signal_a if draw < n_agents + weight_a else signal_b
            if np.linalg.norm(current[i] - target) <= config.epsilon:
                # La senal es obstinada: solo cambia el agente normal.
                current[i] = current[i] + config.compromise_rate * (target - current[i])
    return np.clip(current, 0.0, 1.0)


def _bounded_target(
    opinions: FloatArray,
    i: int,
    config: PhasedConfig,
    adjacency: Adjacency | None,
    t: int,
) -> FloatArray:
    """Media social de i, restringida por opinion y opcionalmente por red."""

    own = opinions[i]
    candidates = range(len(opinions)) if adjacency is None else ({i} | adjacency[i])
    accepted = [j for j in candidates if np.linalg.norm(opinions[j] - own) <= config.epsilon]
    numerator = opinions[accepted].sum(axis=0)
    denominator = float(len(accepted))

    weight_a, weight_b = signal_weights(config, t)
    signal_a = np.asarray(config.signal_a, dtype=np.float64)
    signal_b = np.asarray(config.signal_b, dtype=np.float64)
    if np.linalg.norm(own - signal_a) <= config.epsilon:
        numerator += weight_a * signal_a
        denominator += weight_a
    if np.linalg.norm(own - signal_b) <= config.epsilon:
        numerator += weight_b * signal_b
        denominator += weight_b
    return numerator / denominator


def friedkin_johnsen_step(
    opinions: FloatArray,
    anchors: FloatArray,
    config: PhasedConfig,
    adjacency: Adjacency | None = None,
    t: int = 0,
) -> FloatArray:
    """Actualizacion FJ con media social de confianza acotada.

    ``initial_anchor_weight`` es g en
    ``x_i(t+1)=g*x_i(0)+(1-g)*T_i(t)``. No es ruido ni una repulsion inventada.
    """

    config.validate(len(opinions))
    old = np.asarray(opinions, dtype=np.float64)
    anchors = np.asarray(anchors, dtype=np.float64)
    if old.shape != anchors.shape:
        raise ValueError("opinions y anchors deben tener la misma forma")
    targets = np.vstack([
        _bounded_target(old, i, config, adjacency, t) for i in range(len(old))
    ])
    g = config.initial_anchor_weight
    return np.clip(g * anchors + (1.0 - g) * targets, 0.0, 1.0)


def advance(
    opinions: FloatArray,
    anchors: FloatArray,
    config: PhasedConfig,
    rng: np.random.Generator,
    t: int,
    adjacency: Adjacency | None = None,
) -> FloatArray:
    """Despacha exactamente una fase; las fases no se mezclan implicitamente."""

    config.validate(len(opinions))
    if config.phase == "hk":
        return hk_signal_step(
            opinions,
            Paper1Config(
                epsilon=config.epsilon,
                signal_a=config.signal_a,
                signal_b=config.signal_b,
                signal_a_weight=config.signal_a_weight,
                signal_b_weight=config.signal_b_weight,
            ),
        )
    if config.phase == "dw":
        return deffuant_round(opinions, config, rng, t)
    if config.phase == "fj":
        return friedkin_johnsen_step(opinions, anchors, config, None, t)
    if config.phase in {"network", "temporal"}:
        if adjacency is None:
            raise ValueError("las fases de red requieren adjacency")
        return friedkin_johnsen_step(opinions, anchors, config, adjacency, t)
    raise ValueError("fase desconocida")


def mean_displacement(before: FloatArray, after: FloatArray) -> float:
    """Desplazamiento euclideo medio por ronda."""

    return float(np.mean(np.linalg.norm(np.asarray(after) - np.asarray(before), axis=1)))
