# Fase 1 — ABM mínimo, trazable y reproducible

Esta carpeta contiene el modelo destinado a fundamentar el primer artículo. El
modelo anterior permanece fuera de esta carpeta como borrador histórico.

## Pregunta de investigación

¿Puede una medida difusa de riesgo de polarización distinguir consenso,
fragmentación, extremización y bipolarización cuando se aplica a un modelo
clásico de confianza limitada?

Esta pregunta es provisional hasta terminar la comprobación sistemática de
novedad. La Fase 1 no propone una nueva teoría del comportamiento social.

## Modelo

- una opinión por agente, representada en `[0, 1]`;
- dinámica Hegselmann–Krause síncrona;
- distancia absoluta, equivalente a Euclídea y Manhattan en una dimensión;
- cada agente se incluye a sí mismo;
- un único parámetro conductual: el radio de confianza `epsilon`;
- JDJ y las demás métricas son salidas y no afectan a los agentes.

No hay polos, eventos, redes, fatiga, gravedad de clúster, retorno al centro,
ruido ni adaptación endógena.

## Ejecutar las pruebas

Desde la raíz del repositorio:

```bash
python -m pytest phase1/tests -q
node phase1/web/verification.js
```

## Ejecutar por terminal

```bash
python -m phase1.run_simulation \
  --agents 100 \
  --epsilon 0.20 \
  --steps 100 \
  --seed 2026 \
  --scenario uniform
```

Los resultados generados se guardan por defecto en `phase1/outputs/` y no se
versionan.

## Abrir las tres páginas

```bash
python -m http.server 8765 --directory phase1/web
```

Abrir `http://localhost:8765/`.

1. `index.html`: simulador.
2. `formulas.html`: modelo matemático, ejemplos y referencias.
3. `paper.html`: explicación narrativa del estudio.

## Documentos científicos

- [`docs/model_specification.md`](docs/model_specification.md): contrato del modelo.
- [`docs/ODD_protocol.md`](docs/ODD_protocol.md): descripción ODD 2020.
- [`docs/literature_review.md`](docs/literature_review.md): revisión de alcance.
- [`docs/formula_traceability.md`](docs/formula_traceability.md): fórmula → fuente → código → prueba.
- [`docs/validation_plan.md`](docs/validation_plan.md): pruebas y límites de validación.
- [`docs/experimental_protocol.md`](docs/experimental_protocol.md): diseño de simulaciones.
- [`docs/research_decisions.md`](docs/research_decisions.md): decisiones y descartes.
- [`docs/paper_outline.md`](docs/paper_outline.md): estructura provisional del artículo.
- [`docs/phase2_options.md`](docs/phase2_options.md): opciones para la segunda fase.
