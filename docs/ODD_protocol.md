# Protocolo ODD

## Overview

Proposito: estudiar cuando una dinamica de confianza acotada en red produce consenso, fragmentacion, polarizacion episodica o polarizacion estructural.

Entidades: agentes, enlaces de red, polos permanentes, eventos temporales.

Escalas: tiempo discreto; espacio actitudinal `[0,1]^d`; red social fija inicialmente.

Procesos: percepcion de vecinos, agregacion bounded-confidence, movimiento actitudinal, aplicacion de frontera, medicion JDJ/modularidad, actualizacion opcional de tolerancia.

## Design concepts

Emergencia: clusters y polarizacion global emergen de reglas locales.

Adaptacion: extensiones permiten `epsilon_i(t)` dependiente de historia.

Objetivos: no se asume utilidad individual en la version minima.

Aprendizaje: representado como actualizacion de opinion; memoria entra via `H_i(t)`.

Interaccion: por red y distancia actitudinal.

Estocasticidad: inicializacion, eventos y muestreo en variantes Deffuant.

Observacion: distribucion de opiniones, JDJ, clusters, modularidad, persistencia y respuesta a eventos.

## Details

Inicializacion: `x_i(0) ~ U([0,1]^d)` o datos empiricos; red `A` completa, sintetica o empirica; parametros validados.

Entrada: configuracion YAML, semilla, red y eventos.

Submodelos: HK en red, FJ/anclaje, eventos, fatiga, JDJ, metricas estructurales.

Verificacion: pruebas unitarias, casos limite, invariantes y reduccion a modelos base.

Validacion: comparacion con distribuciones reales, polarizacion medida, comunidades, persistencia temporal y respuesta a shocks.
