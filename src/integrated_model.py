"""Modelo integrado, trazable y deliberadamente simple.

Este modulo replica la opcion ``integrated`` de ``web/model.js``. No presenta
la suma completa como una teoria publicada. Documenta cuatro contribuciones:

    G_i: influencia firmada de contactos (Zhang, Hu y Zhang, 2025),
    P_i: polos obstinados ponderados (HK con senales constantes),
    E_i: eventos temporales declarados,
    R_i: recentrado de una intervencion explicitamente activada,
    k_i: compromiso creciente con la extremidad (Duggins, 2017).

Para un agente movil que no realiza un salto de ruido:

    x_i(t+1) = clip[x_i + (eta*(G_i + P_i + E_i) + R_i) / k_i].

El orden, la extension vectorial y el disparador JDJ son decisiones del
proyecto. Sus valores deben calibrarse antes de interpretar una sociedad real.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from .phased_model import Adjacency


FloatArray = NDArray[np.float64]


@dataclass(frozen=True)
class ExternalEvent:
    """Evento temporal observado o escenario de prueba declarado.

    ``intensity`` usa la misma unidad que los polos: peso equivalente de
    fuentes fijas. ``reach`` es el radio directo en el espacio de opinion.
    """

    position: tuple[float, float]
    intensity: float
    reach: float
    start: int
    duration: int


@dataclass(frozen=True)
class IntegratedConfig:
    epsilon: float = 0.20
    homophily_scale: float = 0.35
    social_rate: float = 0.06
    reactance_enabled: bool = True

    # Con columnas observadas A y B, los polos naturales son pertenencia total
    # a A y nula a B, y viceversa.
    signal_a: tuple[float, float] = (1.0, 0.0)
    signal_b: tuple[float, float] = (0.0, 1.0)
    signal_a_weight: float = 5.0
    signal_b_weight: float = 5.0
    signal_a_reach: float = 0.25
    signal_b_reach: float = 0.25
    signal_a_permanent: bool = True
    signal_b_permanent: bool = True
    signal_a_start: int = 0
    signal_a_duration: int = 300
    signal_b_start: int = 80
    signal_b_duration: int = 100
    fatigue_enabled: bool = True
    fatigue_decay: float = 0.01

    adaptive_commitment: bool = True
    commitment_strength: float = 1.0

    auditor_enabled: bool = True
    auditor_threshold: float = 0.35
    auditor_min_dispersion: float = 0.02
    center_strength: float = 0.02

    noise_enabled: bool = True
    noise_probability: float = 0.01
    noise_radius: float = 0.02

    def validate(self) -> None:
        if not 0 <= self.epsilon:
            raise ValueError("epsilon debe ser no negativo")
        if self.homophily_scale <= 0:
            raise ValueError("homophily_scale debe ser positivo")
        if not 0 <= self.social_rate <= 1:
            raise ValueError("social_rate debe pertenecer a [0,1]")
        if min(self.signal_a_weight, self.signal_b_weight) < 0 or max(self.signal_a_weight, self.signal_b_weight) > 10:
            raise ValueError("las intensidades de los polos deben pertenecer a [0,10]")
        if min(self.signal_a_reach, self.signal_b_reach) <= 0 or max(self.signal_a_reach, self.signal_b_reach) > 1:
            raise ValueError("los radios de los polos deben pertenecer a (0,1]")
        if min(self.signal_a_start, self.signal_b_start, self.signal_a_duration, self.signal_b_duration) < 0:
            raise ValueError("los tiempos deben ser no negativos")
        if self.fatigue_decay < 0 or self.commitment_strength < 0:
            raise ValueError("decaimiento y compromiso deben ser no negativos")
        if not 0 <= self.auditor_threshold <= 1:
            raise ValueError("auditor_threshold debe pertenecer a [0,1]")
        if self.auditor_min_dispersion < 0:
            raise ValueError("auditor_min_dispersion debe ser no negativa")
        if not 0 <= self.center_strength <= 1:
            raise ValueError("center_strength debe pertenecer a [0,1]")
        if not 0 <= self.noise_probability <= 1:
            raise ValueError("noise_probability debe pertenecer a [0,1]")
        if not 0 <= self.noise_radius <= 1:
            raise ValueError("noise_radius debe pertenecer a [0,1]")


def _clip(value: FloatArray) -> FloatArray:
    return np.clip(value, 0.0, 1.0)


def position_from_memberships(membership_a: float, membership_b: float) -> FloatArray:
    """Convierte una fila A/B en posicion sin inventar otra transformacion.

    A y B son grados de pertenencia observados, no distancias. Por tanto:

        x_i(0) = (A_i, B_i).

    La distancia euclidea se calcula despues. Ejemplo: A=6/7 y B=1/7
    producen exactamente el punto (6/7, 1/7).
    """

    values = np.asarray([membership_a, membership_b], dtype=np.float64)
    if not np.all(np.isfinite(values)) or np.any(values < 0) or np.any(values > 1):
        raise ValueError("A y B deben pertenecer a [0,1]")
    return values


def load_membership_csv(path: str | Path) -> FloatArray:
    """Lee un CSV con cabeceras A y B, incluidas celdas de texto multilínea."""

    positions: list[FloatArray] = []
    with Path(path).open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        normalized = {name.strip().lower(): name for name in (reader.fieldnames or [])}
        if "a" not in normalized or "b" not in normalized:
            raise ValueError('el CSV necesita columnas llamadas "A" y "B"')
        for row_number, row in enumerate(reader, start=2):
            try:
                positions.append(position_from_memberships(float(row[normalized["a"]]), float(row[normalized["b"]])))
            except (TypeError, ValueError) as error:
                raise ValueError(f"fila {row_number}: A/B no válidos") from error
    if not positions:
        raise ValueError("el CSV no contiene filas A/B")
    return np.vstack(positions)


def initialize_memberships(n_agents: int, seed: int) -> FloatArray:
    """Poblacion nula: sortea A y B independientemente en U(0,1).

    Es una inicializacion sintetica reproducible, no una afirmacion empirica.
    Los CSV se cargan sin ruido añadido y conservan exactamente cada par A/B.
    """

    if n_agents < 1:
        raise ValueError("n_agents debe ser positivo")
    return np.random.default_rng(seed).random((n_agents, 2))


def opposite_position(position: FloatArray) -> FloatArray:
    """Refleja un evento respecto a (0.5,0.5): C=(1-x,1-y)."""

    values = np.asarray(position, dtype=np.float64)
    if values.shape != (2,):
        raise ValueError("la posición debe tener dos coordenadas")
    point = position_from_memberships(values[0], values[1])
    return 1.0 - point


def radicality(opinion: FloatArray) -> float:
    """Distancia al centro normalizada: 0 en el centro y 1 en una esquina.

    Es la adaptacion 2D declarada de ``|50-O_i|/50`` de Duggins (2017).
    """

    point = np.asarray(opinion, dtype=np.float64)
    return float(np.clip(np.linalg.norm(point - 0.5) / np.sqrt(0.5), 0.0, 1.0))


def social_impact_coefficient(
    opinion_distance: float,
    tolerance: float,
    homophily_scale: float,
    reactance_enabled: bool = True,
) -> float:
    """Coeficiente firmado de Zhang et al. (2025), ecuaciones 2--3.

    ``q(d) = D(d) exp(-d/B_H)``. Es positivo para asimilacion y negativo
    para contraste. Si se desactiva reactancia, la parte negativa vale cero.

    Ejemplo: BT=.2, BH=.4, d=.1 -> q=.5*exp(-.25)=.3894.
    """

    if tolerance <= 0 or homophily_scale <= 0 or opinion_distance < 0:
        raise ValueError("distancia no negativa y escalas positivas requeridas")
    contrast = 1.0 - opinion_distance / tolerance if opinion_distance < 2.0 * tolerance else -1.0
    if not reactance_enabled:
        contrast = max(0.0, contrast)
    return float(contrast * np.exp(-opinion_distance / homophily_scale))


def _active(t: int, start: int, duration: int) -> float:
    return 1.0 if start <= t < start + duration else 0.0


def signal_weights(config: IntegratedConfig, t: int) -> tuple[float, float]:
    """Intensidad de los polos, permanentes o acotados en el tiempo.

    ``m_k(t)=m_k I[start<=t<start+duration] exp[-lambda(t-start)]``.
    El decaimiento representa atencion a informacion antigua, no fatiga
    clinica ni una ley universal.
    """

    weights = (
        config.signal_a_weight * (1.0 if config.signal_a_permanent else _active(t, config.signal_a_start, config.signal_a_duration)),
        config.signal_b_weight * (1.0 if config.signal_b_permanent else _active(t, config.signal_b_start, config.signal_b_duration)),
    )
    if not config.fatigue_enabled:
        return weights
    return (
        weights[0] if config.signal_a_permanent else weights[0] * np.exp(-config.fatigue_decay * max(0, t - config.signal_a_start)),
        weights[1] if config.signal_b_permanent else weights[1] * np.exp(-config.fatigue_decay * max(0, t - config.signal_b_start)),
    )


def event_weight(event: ExternalEvent, t: int, fatigue_enabled: bool, fatigue_decay: float) -> float:
    """Intensidad activa de un evento temporal.

    Ejemplo: I0=5, inicio=20, lambda=.01, t=40 -> 5*exp(-.2)=4.094.
    """

    if event.intensity < 0 or event.intensity > 10:
        raise ValueError("la intensidad del evento debe pertenecer a [0,10]")
    if event.reach <= 0 or event.reach > 1 or event.start < 0 or event.duration <= 0:
        raise ValueError("alcance y tiempos del evento no validos")
    if not _active(t, event.start, event.duration):
        return 0.0
    decay = np.exp(-fatigue_decay * (t - event.start)) if fatigue_enabled else 1.0
    return float(event.intensity * decay)


def axis_projection(opinions: FloatArray, signal_a: FloatArray, signal_b: FloatArray) -> FloatArray:
    """OBSOLETA para JDJ: utilidad historica, sin uso en la metrica activa."""

    x = np.asarray(opinions, dtype=np.float64)
    a = np.asarray(signal_a, dtype=np.float64)
    b = np.asarray(signal_b, dtype=np.float64)
    direction = b - a
    denominator = float(direction @ direction)
    if denominator <= 0:
        raise ValueError("las senales A y B deben estar separadas")
    return np.clip((x - a) @ direction / denominator, 0.0, 1.0)


def euclidean_memberships(opinions: FloatArray) -> FloatArray:
    """mu_A=1-d(x,(1,0))/sqrt(2); mu_B=1-d(x,(0,1))/sqrt(2).

    No se exige mu_A+mu_B=1. Ejemplo (0.2,0.4): (0.367544,0.552786).
    """
    import math
    x = np.asarray(opinions, dtype=np.float64)
    if x.size == 0:
        return np.empty((0, 2))
    if x.ndim != 2 or x.shape[1] != 2 or not np.isfinite(x).all() or np.any((x < 0) | (x > 1)):
        raise ValueError("JDJ requiere posiciones en [0,1]²")
    return np.array([[1 - math.sqrt((float(a)-1)**2 + float(b)**2) / math.sqrt(2),
                      1 - math.sqrt(float(a)**2 + (float(b)-1)**2) / math.sqrt(2)] for a, b in x])


def jdj_euclidean_details(
    opinions: FloatArray,
    signal_a: FloatArray | None = None,
    signal_b: FloatArray | None = None,
) -> dict[str, float | int]:
    """JDJ euclideo con polos fijos (1,0)/(0,1), incluso si cambia la dinámica.

    ``pair_sum`` incluye los N² pares ordenados, incluidos ``i=j``. El valor
    visible es estrictamente ``2*pair_sum/N²``, sin recorte ni renormalizacion.
    Los argumentos signal_a/b se aceptan por compatibilidad, pero no definen JDJ.
    """

    x = np.asarray(opinions, dtype=np.float64)
    if len(x) == 0:
        return {
            "value": 0.0,
            "pair_sum": 0.0,
            "total_pairs": 0,
            "mean_pair": 0.0,
            "mean_membership_a": 0.0,
        }
    memberships = euclidean_memberships(x)
    # Mismo orden de suma que JavaScript para permitir comparación exacta.
    pair_sum = 0.0
    pairs = memberships.tolist()
    for a, b in pairs:
        for c, d in pairs:
            pair_sum += max(a * d, b * c)
    total_pairs = int(len(x) ** 2)
    return {
        "value": 2.0 * pair_sum / total_pairs,
        "pair_sum": pair_sum,
        "total_pairs": total_pairs,
        "mean_pair": pair_sum / total_pairs,
        "mean_membership_a": float(memberships[:, 0].mean()),
    }


def jdj_euclidean(opinions: FloatArray, signal_a: FloatArray | None = None, signal_b: FloatArray | None = None) -> float:
    """JDJ por distancia euclidea a polos fijos, sin proyeccion.

    Las pertenencias son ``1-distancia/sqrt(2)`` para cada polo.
    Por ello el consenso central vale 0.5 y una division extrema 50/50 vale 1.
    El auditor exige tambien dispersion para distinguir ambos escenarios.
    Producto y maximo siguen a Guevara et al. (2020); geometria y
    normalizacion son adaptaciones declaradas.
    """

    return float(jdj_euclidean_details(opinions, signal_a, signal_b)["value"])


def dispersion(opinions: FloatArray) -> float:
    """Distancia cuadratica media al centroide."""

    x = np.asarray(opinions, dtype=np.float64)
    if len(x) == 0:
        return 0.0
    return float(np.mean(np.sum((x - x.mean(axis=0)) ** 2, axis=1)))


def assign_immobility(n_agents: int, share: float, seed: int) -> NDArray[np.bool_]:
    """Selecciona de forma reproducible la fraccion de agentes obstinados."""

    if n_agents < 0 or not 0 <= share <= 1:
        raise ValueError("n_agents no negativo y share en [0,1]")
    return np.random.default_rng(seed).random(n_agents) < share


def bounded_noise(opinion: FloatArray, radius: float, rng: np.random.Generator) -> FloatArray:
    """Salto aleatorio local de Pineda et al. extendido a cada coordenada."""

    if not 0 <= radius <= 1:
        raise ValueError("radius debe pertenecer a [0,1]")
    jump = rng.uniform(-radius, radius, size=np.asarray(opinion).shape)
    return _clip(np.asarray(opinion, dtype=np.float64) + jump)


def weighted_source_displacement(
    opinion: FloatArray,
    sources: list[tuple[FloatArray, float, float]],
) -> FloatArray:
    """Desplazamiento de fuentes mediante una media ponderada con peso propio 1.

    Para fuentes activas dentro de su alcance:

        S_i = sum_k w_k (R_k-x_i) / (1 + sum_k w_k).

    El 1 conserva el peso de la posicion propia. Una intensidad mayor aumenta
    el paso sin permitir que una sola media ponderada sobrepase su objetivo.
    """

    own = np.asarray(opinion, dtype=np.float64)
    numerator = np.zeros(2, dtype=np.float64)
    mass = 0.0
    for position, weight, reach in sources:
        target = np.asarray(position, dtype=np.float64)
        if weight > 0 and np.linalg.norm(target - own) <= reach:
            numerator += weight * (target - own)
            mass += weight
    return numerator / (1.0 + mass)


def step(
    opinions: FloatArray,
    config: IntegratedConfig,
    adjacency: Adjacency | None,
    immobile: NDArray[np.bool_],
    rng: np.random.Generator,
    t: int,
    events: tuple[ExternalEvent, ...] = (),
) -> tuple[FloatArray, bool]:
    """Ejecuta una actualizacion sincrona del modelo integrado.

    Orden: inmovilidad, posible ruido, red, polos/eventos, auditor, compromiso y
    recorte. El resultado booleano indica si el auditor intervino.
    """

    config.validate()
    old = np.asarray(opinions, dtype=np.float64)
    immobile = np.asarray(immobile, dtype=bool)
    if old.ndim != 2 or old.shape[1] != 2:
        raise ValueError("opinions debe tener forma (N,2)")
    if immobile.shape != (len(old),):
        raise ValueError("immobile debe tener longitud N")
    if adjacency is not None and len(adjacency) != len(old):
        raise ValueError("adjacency debe tener longitud N")

    signal_a = np.asarray(config.signal_a, dtype=np.float64)
    signal_b = np.asarray(config.signal_b, dtype=np.float64)
    weight_a, weight_b = signal_weights(config, t)
    current_jdj = jdj_euclidean(old, signal_a, signal_b)
    current_dispersion = dispersion(old)
    auditor_active = (
        config.auditor_enabled
        and current_jdj >= config.auditor_threshold
        and current_dispersion >= config.auditor_min_dispersion
    )
    next_opinions = old.copy()

    for i, own in enumerate(old):
        if immobile[i]:
            continue
        if config.noise_enabled and rng.random() < config.noise_probability:
            next_opinions[i] = bounded_noise(own, config.noise_radius, rng)
            continue

        candidates = list(adjacency[i]) if adjacency is not None else [j for j in range(len(old)) if j != i]
        group = np.zeros(2, dtype=np.float64)
        for j in candidates:
            delta = old[j] - own
            distance = float(np.linalg.norm(delta))
            group += social_impact_coefficient(
                distance,
                config.epsilon,
                config.homophily_scale,
                config.reactance_enabled,
            ) * delta
        group /= max(1, len(candidates))

        pole_sources: list[tuple[FloatArray, float, float]] = [
            (signal_a, weight_a, config.signal_a_reach),
            (signal_b, weight_b, config.signal_b_reach),
        ]
        event_sources = [
            (
                np.asarray(event.position, dtype=np.float64),
                event_weight(event, t, config.fatigue_enabled, config.fatigue_decay),
                event.reach,
            )
            for event in events
        ]
        pole = weighted_source_displacement(own, pole_sources)
        event_displacement = weighted_source_displacement(own, event_sources)

        commitment = 1.0 + config.commitment_strength * radicality(own) if config.adaptive_commitment else 1.0
        center = config.center_strength * (0.5 - own) if auditor_active else np.zeros(2)
        # Formula final: las tres influencias se suman; el recentrado se añade;
        # la resistencia divide el resultado; por ultimo se suma a (x,y).
        delta = (config.social_rate * (group + pole + event_displacement) + center) / commitment
        next_opinions[i] = _clip(own + delta)

    return next_opinions, auditor_active
