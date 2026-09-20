"""Modelo defendible del Paper 1: HK bidimensional con dos senales constantes.

La dinamica implementada procede de tres antecedentes publicados:

1. Hegselmann y Krause (2002): confianza acotada y promedio sincrono.
2. Fortunato et al. (2005): opiniones vectoriales en dos dimensiones y
   vecindad circular, es decir, distancia euclidea.
3. Hegselmann y Krause (2015) y Glass y Glass (2021): una senal o grupo
   obstinado permanece fijo y cuenta varias veces en el promedio local.

Para el agente i, con opinion x_i(t) en [0, 1]^2, se define

    N_i(t) = {j : ||x_j(t) - x_i(t)||_2 <= epsilon}.

Con dos senales fijas R_A y R_B, de intensidades m_A y m_B, la actualizacion es

    x_i(t+1) = [sum_{j in N_i} x_j(t)
                  + I(||x_i-R_A||_2 <= epsilon) m_A R_A
                  + I(||x_i-R_B||_2 <= epsilon) m_B R_B]
                 / [|N_i| + I_A m_A + I_B m_B].

Todas las opiniones se actualizan desde la misma fotografia del tiempo t. No
hay gravedad de clusters, rebote al centro, ruido, fatiga ni fuerza inventada.

Ejemplo para explicar a un nino de 10 anos
-------------------------------------------
Un agente esta en (0.2, 0.2), escucha a otro en (0.3, 0.2) y oye una senal en
(0.1, 0.2) que cuenta como dos voces. La nueva opinion es el promedio de las
cuatro voces: [(0.2,0.2)+(0.3,0.2)+2(0.1,0.2)]/4 = (0.175,0.2).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class Paper1Config:
    """Parametros teoricos de la primera capa del modelo.

    ``epsilon`` es la unica distancia de confianza y se aplica tanto a otros
    agentes como a las senales, igual que en el modelo de senales constantes.
    ``signal_a_weight`` y ``signal_b_weight`` son pesos no negativos: pueden
    leerse como numero equivalente de agentes obstinados o reputacion de un
    lider. Un peso cero desactiva la senal correspondiente.
    """

    epsilon: float = 0.20
    signal_a: tuple[float, float] = (0.10, 0.90)
    signal_b: tuple[float, float] = (0.90, 0.10)
    signal_a_weight: float = 5.0
    signal_b_weight: float = 5.0

    def validate(self) -> None:
        if self.epsilon < 0:
            raise ValueError("epsilon debe ser no negativo")
        if self.signal_a_weight < 0 or self.signal_b_weight < 0:
            raise ValueError("los pesos de las senales deben ser no negativos")
        for name, point in (("signal_a", self.signal_a), ("signal_b", self.signal_b)):
            if len(point) != 2 or any(value < 0 or value > 1 for value in point):
                raise ValueError(f"{name} debe pertenecer a [0, 1]^2")
        if np.allclose(self.signal_a, self.signal_b):
            raise ValueError("las senales A y B deben ocupar posiciones distintas")


def initialize_opinions(
    n_agents: int,
    seed: int,
    scenario: str = "uniform",
) -> FloatArray:
    """Crea condiciones iniciales reproducibles, sin prepolarizar por defecto.

    ``uniform`` es la condicion principal del Paper 1 y sigue el caso estudiado
    por Fortunato et al. (2005). ``central`` y ``two_groups`` son condiciones
    de contraste visibles; no cambian la regla de actualizacion.
    """

    if n_agents < 1:
        raise ValueError("n_agents debe ser positivo")
    rng = np.random.default_rng(seed)
    if scenario == "uniform":
        return rng.uniform(0.0, 1.0, size=(n_agents, 2))
    if scenario == "central":
        return np.clip(rng.normal(0.5, 0.10, size=(n_agents, 2)), 0.0, 1.0)
    if scenario == "two_groups":
        split = n_agents // 2
        opinions = np.empty((n_agents, 2), dtype=np.float64)
        opinions[:split] = rng.normal((0.25, 0.75), (0.09, 0.09), size=(split, 2))
        opinions[split:] = rng.normal(
            (0.75, 0.25), (0.09, 0.09), size=(n_agents - split, 2)
        )
        return np.clip(opinions, 0.0, 1.0)
    raise ValueError("scenario debe ser 'uniform', 'central' o 'two_groups'")


def euclidean_distance(a: FloatArray, b: FloatArray) -> float:
    """Distancia recta: sqrt(sum_k (a_k-b_k)^2)."""

    return float(np.linalg.norm(np.asarray(a, dtype=float) - np.asarray(b, dtype=float)))


def step(opinions: FloatArray, config: Paper1Config) -> FloatArray:
    """Ejecuta una actualizacion sincrona HK con dos senales constantes."""

    config.validate()
    old = np.asarray(opinions, dtype=np.float64)
    if old.ndim != 2 or old.shape[1] != 2:
        raise ValueError("opinions debe tener forma (n_agents, 2)")
    if np.any((old < 0) | (old > 1)):
        raise ValueError("todas las opiniones deben pertenecer a [0, 1]^2")

    signal_a = np.asarray(config.signal_a, dtype=np.float64)
    signal_b = np.asarray(config.signal_b, dtype=np.float64)
    new = np.empty_like(old)

    # Actualizacion simultanea: solo se lee ``old`` y se escribe en ``new``.
    for i, opinion in enumerate(old):
        distances = np.linalg.norm(old - opinion, axis=1)
        neighbors = old[distances <= config.epsilon]
        numerator = neighbors.sum(axis=0)
        denominator = float(len(neighbors))

        if euclidean_distance(opinion, signal_a) <= config.epsilon:
            numerator += config.signal_a_weight * signal_a
            denominator += config.signal_a_weight
        if euclidean_distance(opinion, signal_b) <= config.epsilon:
            numerator += config.signal_b_weight * signal_b
            denominator += config.signal_b_weight

        new[i] = numerator / denominator

    # El promedio de puntos de [0,1]^2 ya queda dentro del cuadrado. El clip
    # solo protege contra errores minimos de coma flotante.
    return np.clip(new, 0.0, 1.0)


def run(opinions: FloatArray, config: Paper1Config, steps: int) -> FloatArray:
    """Ejecuta ``steps`` actualizaciones y devuelve la configuracion final."""

    if steps < 0:
        raise ValueError("steps debe ser no negativo")
    current = np.asarray(opinions, dtype=np.float64).copy()
    for _ in range(steps):
        current = step(current, config)
    return current


def axis_projection(opinions: FloatArray, config: Paper1Config) -> FloatArray:
    """Proyecta geometricamente opiniones 2D sobre el segmento A--B.

    s_i = clip(((x_i-A) dot (B-A)) / ||B-A||^2, 0, 1).

    Es geometria euclidea estandar, no una nueva teoria sociologica. Se usa
    solo para adaptar de forma transparente un diagnostico bipolar 1D; nunca
    interviene en la dinamica de los agentes.
    """

    config.validate()
    x = np.asarray(opinions, dtype=np.float64)
    a = np.asarray(config.signal_a, dtype=np.float64)
    direction = np.asarray(config.signal_b, dtype=np.float64) - a
    score = ((x - a) @ direction) / float(direction @ direction)
    return np.clip(score, 0.0, 1.0)


def jdj_product_axis(opinions: FloatArray, config: Paper1Config) -> float:
    """Diagnostico JDJ-Pro tras la proyeccion A--B, normalizado a [0,1].

    Con mu_A(i)=1-s_i y mu_B(i)=s_i, se aplica el nucleo producto/maximo de
    Guevara et al. (2020) y una normalizacion operativa del proyecto:

      JDJ-Pro = 2 * E[max(mu_A(i)mu_B(j), mu_B(i)mu_A(j))].

    El factor 2 hace que una division dura 50/50 entre polos valga 1. Tanto
    esa normalizacion como la proyeccion 2D deben informarse como decisiones
    del proyecto. Por eso esta salida es secundaria/exploratoria.
    """

    s = axis_projection(opinions, config)
    mu_a = 1.0 - s
    mu_b = s
    pair_values = np.maximum(
        np.outer(mu_a, mu_b),
        np.outer(mu_b, mu_a),
    )
    return float(np.clip(2.0 * np.mean(pair_values), 0.0, 1.0))


def mean_squared_dispersion(opinions: FloatArray) -> float:
    """Media de la distancia euclidea cuadratica al centroide poblacional."""

    x = np.asarray(opinions, dtype=np.float64)
    centroid = x.mean(axis=0)
    return float(np.mean(np.sum((x - centroid) ** 2, axis=1)))


def connected_components(opinions: FloatArray, threshold: float = 0.05) -> list[list[int]]:
    """Agrupa puntos unidos por distancias <= ``threshold``.

    Es una definicion computacional de cluster para describir la salida. No es
    una fuerza del modelo y el umbral debe declararse al reportar resultados.
    """

    if threshold < 0:
        raise ValueError("threshold debe ser no negativo")
    x = np.asarray(opinions, dtype=np.float64)
    unvisited = set(range(len(x)))
    components: list[list[int]] = []
    while unvisited:
        seed = unvisited.pop()
        component = [seed]
        frontier = [seed]
        while frontier:
            i = frontier.pop()
            linked = [j for j in unvisited if euclidean_distance(x[i], x[j]) <= threshold]
            for j in linked:
                unvisited.remove(j)
                frontier.append(j)
                component.append(j)
        components.append(sorted(component))
    return sorted(components, key=lambda group: (-len(group), group[0]))


def summarize(opinions: FloatArray, config: Paper1Config, cluster_threshold: float = 0.05) -> dict[str, float | int]:
    """Calcula salidas; ninguna de ellas modifica la simulacion."""

    x = np.asarray(opinions, dtype=np.float64)
    a = np.asarray(config.signal_a, dtype=np.float64)
    b = np.asarray(config.signal_b, dtype=np.float64)
    d_a = np.linalg.norm(x - a, axis=1)
    d_b = np.linalg.norm(x - b, axis=1)
    clusters = connected_components(x, cluster_threshold)
    return {
        "dispersion": mean_squared_dispersion(x),
        "clusters": len(clusters),
        "followers_a": int(np.sum(d_a <= 1e-3)),
        "followers_b": int(np.sum(d_b <= 1e-3)),
        "rmsd_a": float(np.sqrt(np.mean(d_a**2))),
        "rmsd_b": float(np.sqrt(np.mean(d_b**2))),
        "jdj_axis_exploratory": jdj_product_axis(x, config),
    }
