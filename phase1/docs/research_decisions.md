# Registro de decisiones de investigación

## D-001 — Reinicio por capas

- **Decisión:** crear `phase1/` como implementación independiente.
- **Razón:** el borrador anterior mezcla mecanismos incompatibles y no permite
  atribuir los resultados a una sola causa.
- **Efecto:** el borrador se conserva, pero no produce resultados del artículo.

## D-002 — Una dimensión

- **Decisión:** usar una sola opinión bipolar en `[0,1]`.
- **Razón:** reduce supuestos y coincide con el caso central estudiado por la
  referencia JDJ seleccionada.
- **Límite:** no representa correlaciones entre temas.

## D-003 — Distancia absoluta

- **Decisión:** `|x_i-x_j|`.
- **Razón:** en una dimensión coincide con Euclídea y Manhattan y evita elegir
  una geometría multidimensional antes de formular esa pregunta.

## D-004 — Hegselmann–Krause síncrono

- **Decisión:** media de todos los vecinos de confianza, incluido el agente.
- **Razón:** modelo clásico, fórmula corta y reproducción directa.
- **Alternativa descartada por ahora:** Deffuant–Weisbuch, que usa encuentros
  pareados y actualización secuencial.

## D-005 — Sin red en Fase 1

- **Decisión:** la cercanía actitudinal determina la interacción.
- **Razón:** una red introduciría topología y conectividad como segunda causa.

## D-006 — JDJ solo como salida

- **Decisión:** JDJ no modifica opiniones ni activa fuerzas.
- **Razón:** evita circularidad entre la definición de polarización y el
  mecanismo que la produce.

## D-007 — Variante JDJ identificada

- **Decisión:** informar `JDJ_Pro` con pertenencia triangular y producto.
- **Razón:** la publicación define una familia, no una única cifra sin opciones.
- **Transparencia:** `4*JDJ_Pro` se etiqueta como normalización del proyecto.

## D-008 — No usar etiquetas bajo/medio/alto

- **Decisión:** mostrar valores numéricos sin categorías normativas.
- **Razón:** no existe calibración empírica ni distribución nula que justifique
  esos umbrales.

## D-009 — Mismo generador en Python y web

- **Decisión:** xorshift32 con semillas enteras no nulas.
- **Razón:** posibilita poblaciones iniciales idénticas entre lenguajes.
- **Límite:** no se usa para criptografía y no sustituye pruebas estadísticas
  con múltiples semillas.

## D-010 — Estado de la novedad

- **Decisión:** describir el artículo como propuesta provisional.
- **Razón:** una revisión de alcance identifica pertinencia, pero no demuestra
  por sí sola que la combinación exacta no exista en toda la literatura.
