"""Modelo mínimo Hegselmann--Krause (HK) para la Fase 1.

Base científica
---------------
Cada agente ``i`` tiene una opinión escalar ``x_i(t)`` en ``[0, 1]``. En cada
paso escucha a los agentes cuya opinión está a una distancia no mayor que
``epsilon`` y adopta la media de esas opiniones::

    N_i(t) = {j : |x_j(t) - x_i(t)| <= epsilon}
    x_i(t+1) = (1 / |N_i(t)|) * sum_{j in N_i(t)} x_j(t)

Todos los valores nuevos se calculan a partir del mismo estado anterior: la
actualización es síncrona. El propio agente pertenece siempre a ``N_i``.

Referencia del mecanismo
------------------------
Hegselmann, R. y Krause, U. (2002). Opinion Dynamics and Bounded Confidence:
Models, Analysis and Simulation. JASSS 5(3), 2.
https://www.jasss.org/5/3/2.html

La métrica ``jdj_product`` implementa la ecuación agrupada de Guevara et al.
(2020) con pertenencias triangulares y operador de solapamiento producto. La
normalización por cuatro se informa por separado y es una reescala explícita
del proyecto, no una ecuación atribuida al artículo.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import floor, fsum
from typing import Iterable, Sequence


UINT32_SCALE = 2**32


@dataclass(frozen=True)
class ModelConfig:
    """Parámetros que definen una ejecución del modelo mínimo.

    ``epsilon`` es la distancia máxima para escuchar a otra persona.
    ``max_steps`` es un límite computacional, no un mecanismo social.
    ``convergence_tolerance`` detiene la ejecución cuando ningún agente se
    desplaza más que esa cantidad.
    """

    n_agents: int = 100
    epsilon: float = 0.20
    max_steps: int = 100
    seed: int = 2026
    scenario: str = "uniform"
    convergence_tolerance: float = 1e-10
    cluster_threshold: float = 0.05

    def validate(self) -> None:
        if self.n_agents < 2:
            raise ValueError("n_agents debe ser al menos 2")
        if not 0.0 <= self.epsilon <= 1.0:
            raise ValueError("epsilon debe estar en [0, 1]")
        if self.max_steps < 1:
            raise ValueError("max_steps debe ser positivo")
        if not 1 <= self.seed < UINT32_SCALE:
            raise ValueError("seed debe estar entre 1 y 2^32 - 1")
        if self.scenario not in {
            "uniform",
            "central",
            "bipolar_balanced",
            "bipolar_unbalanced",
            "three_groups",
        }:
            raise ValueError(f"escenario desconocido: {self.scenario}")
        if self.convergence_tolerance < 0.0:
            raise ValueError("convergence_tolerance no puede ser negativo")
        if not 0.0 < self.cluster_threshold <= 1.0:
            raise ValueError("cluster_threshold debe estar en (0, 1]")


@dataclass(frozen=True)
class SimulationResult:
    """Historia completa y motivo de terminación de una simulación."""

    history: tuple[tuple[float, ...], ...]
    metrics: tuple[dict[str, float | int], ...]
    converged: bool


class XorShift32:
    """Generador pseudoaleatorio reproducible entre Python y JavaScript.

    Implementa el esquema xorshift de 32 bits descrito por Marsaglia (2003).
    Se usa por portabilidad, no como hipótesis social. No es criptográfico.
    """

    def __init__(self, seed: int) -> None:
        if not 1 <= seed < UINT32_SCALE:
            raise ValueError("la semilla debe estar entre 1 y 2^32 - 1")
        self.state = seed

    def random(self) -> float:
        """Devuelve un valor uniforme reproducible en ``[0, 1)``."""

        x = self.state
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
        self.state = x & 0xFFFFFFFF
        return self.state / UINT32_SCALE


def _uniform_interval(rng: XorShift32, low: float, high: float) -> float:
    return low + (high - low) * rng.random()


def initialize_opinions(config: ModelConfig) -> list[float]:
    """Crea el estado inicial declarado por ``config.scenario``.

    Los escenarios son entradas experimentales, no teorías sobre cómo se
    distribuyen las opiniones reales. Cada intervalo aparece documentado en la
    especificación y en la página de fórmulas.
    """

    config.validate()
    rng = XorShift32(config.seed)
    n = config.n_agents

    if config.scenario == "uniform":
        values = [rng.random() for _ in range(n)]
    elif config.scenario == "central":
        values = [_uniform_interval(rng, 0.45, 0.55) for _ in range(n)]
    elif config.scenario == "bipolar_balanced":
        split = n // 2
        values = [
            _uniform_interval(rng, 0.10, 0.30) if i < split
            else _uniform_interval(rng, 0.70, 0.90)
            for i in range(n)
        ]
    elif config.scenario == "bipolar_unbalanced":
        # Redondeo "half up" explícito para coincidir con JavaScript.
        split = floor(0.70 * n + 0.5)
        values = [
            _uniform_interval(rng, 0.10, 0.30) if i < split
            else _uniform_interval(rng, 0.70, 0.90)
            for i in range(n)
        ]
    else:  # three_groups
        first = n // 3
        second = 2 * n // 3
        values = [
            _uniform_interval(rng, 0.10, 0.20) if i < first
            else _uniform_interval(rng, 0.45, 0.55) if i < second
            else _uniform_interval(rng, 0.80, 0.90)
            for i in range(n)
        ]

    return values


def _validate_opinions(opinions: Sequence[float]) -> None:
    if not opinions:
        raise ValueError("se necesita al menos una opinión")
    if any(not 0.0 <= value <= 1.0 for value in opinions):
        raise ValueError("todas las opiniones deben pertenecer a [0, 1]")


def step(opinions: Sequence[float], epsilon: float) -> tuple[list[float], float]:
    """Ejecuta un paso HK síncrono y devuelve estado y desplazamiento máximo.

    Ejemplo: con opiniones ``[0.2, 0.3, 0.9]`` y ``epsilon=0.15``, las dos
    primeras se escuchan y pasan ambas a ``0.25``; la tercera permanece en
    ``0.9``. Ningún valor nuevo se usa hasta que todos han sido calculados.
    """

    _validate_opinions(opinions)
    if not 0.0 <= epsilon <= 1.0:
        raise ValueError("epsilon debe estar en [0, 1]")

    previous = list(opinions)
    updated: list[float] = []
    max_displacement = 0.0

    for focal in previous:
        neighbours = [other for other in previous if abs(other - focal) <= epsilon]
        new_value = fsum(neighbours) / len(neighbours)
        updated.append(new_value)
        max_displacement = max(max_displacement, abs(new_value - focal))

    return updated, max_displacement


def jdj_product(opinions: Sequence[float]) -> tuple[float, float]:
    """Calcula JDJ producto bruto y su reescala explícita a ``[0, 1]``.

    Tras transformar la escala Likert 1--5 del artículo a ``x in [0, 1]``, las
    pertenencias triangulares son ``mu_A(x)=1-x`` y ``mu_B(x)=x``. Con el
    operador producto, la ecuación agrupada equivale a::

        JDJ_Pro = (1/n^2) * sum_i sum_j (1-x_i) * x_j

    El valor bruto está en ``[0, 0.25]``. ``4 * JDJ_Pro`` es una normalización
    declarada de esta implementación. Un valor alto expresa riesgo difuso de
    bipolarización; por sí solo no demuestra que existan dos grupos separados.
    """

    _validate_opinions(opinions)
    mean = fsum(opinions) / len(opinions)
    raw = (1.0 - mean) * mean
    return raw, 4.0 * raw


def cluster_count(opinions: Sequence[float], threshold: float = 0.05) -> int:
    """Cuenta grupos operativos separados por huecos mayores que ``threshold``.

    Es una regla descriptiva para resumir resultados, no una regla que cambie
    las opiniones ni una definición universal de grupo social.
    """

    _validate_opinions(opinions)
    if not 0.0 < threshold <= 1.0:
        raise ValueError("threshold debe estar en (0, 1]")
    ordered = sorted(opinions)
    return 1 + sum(
        1 for left, right in zip(ordered, ordered[1:]) if right - left > threshold
    )


def summarize(
    opinions: Sequence[float],
    *,
    time: int,
    max_displacement: float,
    cluster_threshold: float = 0.05,
) -> dict[str, float | int]:
    """Calcula observables; ninguno realimenta la dinámica."""

    _validate_opinions(opinions)
    n = len(opinions)
    mean = fsum(opinions) / n
    variance = fsum((value - mean) ** 2 for value in opinions) / n
    jdj_raw, jdj_normalized = jdj_product(opinions)
    return {
        "time": time,
        "mean": mean,
        "variance": variance,
        "normalized_variance": 4.0 * variance,
        "span": max(opinions) - min(opinions),
        "jdj_product_raw": jdj_raw,
        "jdj_product_normalized": jdj_normalized,
        "clusters": cluster_count(opinions, cluster_threshold),
        "max_displacement": max_displacement,
    }


def run(
    config: ModelConfig,
    initial_opinions: Iterable[float] | None = None,
) -> SimulationResult:
    """Ejecuta la simulación hasta convergencia o ``max_steps``."""

    config.validate()
    opinions = (
        initialize_opinions(config)
        if initial_opinions is None
        else [float(value) for value in initial_opinions]
    )
    if len(opinions) != config.n_agents:
        raise ValueError("initial_opinions debe contener n_agents valores")
    _validate_opinions(opinions)

    history: list[tuple[float, ...]] = [tuple(opinions)]
    metrics: list[dict[str, float | int]] = [
        summarize(
            opinions,
            time=0,
            max_displacement=0.0,
            cluster_threshold=config.cluster_threshold,
        )
    ]
    converged = False

    for time in range(1, config.max_steps + 1):
        opinions, displacement = step(opinions, config.epsilon)
        history.append(tuple(opinions))
        metrics.append(
            summarize(
                opinions,
                time=time,
                max_displacement=displacement,
                cluster_threshold=config.cluster_threshold,
            )
        )
        if displacement <= config.convergence_tolerance:
            converged = True
            break

    return SimulationResult(tuple(history), tuple(metrics), converged)
