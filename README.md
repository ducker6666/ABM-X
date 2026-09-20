# ABM X — laboratorio auditable de opinión

Simulador bidimensional para comparar mecanismos de dinámica de opinión. La
vista predeterminada recupera la riqueza del prototipo inicial —grupos,
señales, reactancia, ruido y auditor— pero sustituye metáforas físicas por
ecuaciones sociales identificables y adaptaciones declaradas.

## Abrir la web

Desde esta carpeta `project`:

```bash
python -m http.server 8765 --directory web
```

Después abre [http://localhost:8765/](http://localhost:8765/). Para cerrar el
servidor, vuelve al Terminal y pulsa `Control + C`.

Si ejecutas el comando desde otra carpeta, usa la ruta absoluta:

```bash
python -m http.server 8765 --directory "/Users/zhenboch/PhD Tesis/MBA:ABM:Modelo basado en agentes/project/web"
```

La web tiene tres páginas:

1. `index.html`: simulación y controles.
2. `formula.html`: ecuación, ejemplo, efecto, límite y referencia de cada regla.
3. `guide.html`: explicación sencilla, lectura de resultados y auditoría de los 25 PDF locales.

## Modelo integrado

Para un agente móvil que no realiza un salto de ruido:

\[
x_i(t+1)=\operatorname{clip}_{[0,1]^2}\left[
x_i(t)+\frac{\eta(G_i(t)+P_i(t))+C_i(t)}{k_i(t)}
\right].
\]

- `G_i`: influencia firmada de los contactos. La suma hace que un grupo con
  más miembros tenga más peso; no se usa gravedad newtoniana.
- `P_i`: atracción de señales obstinadas con masa declarada.
- `C_i`: recentrado solo cuando interviene el auditor.
- `k_i`: compromiso creciente con la extremidad.

El orden exacto es inmovilidad, posible ruido, red, señales, auditor,
compromiso y recorte. La composición completa es una hipótesis del proyecto;
no se presenta como una teoría publicada íntegramente.

## Código defendible

- `src/integrated_model.py`: referencia Python del modelo integrado, con fórmulas y ejemplos en comentarios.
- `web/model.js`: el mismo motor en JavaScript, separado de la interfaz.
- `web/app.js`: controles y representación; no define una segunda dinámica.
- `tests/test_integrated_model.py`: casos mínimos de signo, masa, JDJ, auditor, ruido e inmovilidad.
- `web/verification.js`: comprobaciones independientes del motor web.
- `src/paper1_model.py` y `src/phased_model.py`: controles HK, Deffuant, FJ, red y tiempo conservados para comparar.
- `src/calibration.py`: métricas para contrastar un panel empírico real.

Los archivos `src/final_model.py`, `src/attitudinal_abm.py` y
`src/proposed_model.py` se conservan como borradores históricos. No deben
usarse como especificación del modelo actual.

## Verificación

```bash
python -m pytest
node web/verification.js
```

Los valores predeterminados son ilustrativos. Una aplicación social exige
definir las dos actitudes, obtener red y eventos observados, calibrar
parámetros y validar fuera de muestra.

## Primer estudio recomendado

La comparación más clara es el mismo sistema con el auditor apagado y
encendido, usando iguales semillas y parámetros. La pregunta es si una
intervención activada por JDJ y dispersión reduce bipolarización sin imponer un
consenso central artificial. Debe acompañarse de ablaciones —sin reactancia,
sin ruido y sin obstinados— y no permite afirmar causalidad sobre una sociedad
sin datos.
