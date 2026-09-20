# Señales permanentes aceptadas — motor web vigente

## Cambio y motivo

Se sustituye la mezcla gaussiana global (commit 8ded579) por una media de opiniones y señales aceptadas. El radio de los polos ya no modifica sus pesos relativos por distancia. Es un límite de exposición; la tolerancia individual sigue siendo el criterio de aceptación.

Para cada persona:
- Nᵢ contiene los demás agentes a distancia euclídea ≤ εᵢ.
- bᵢₖ=S si d(uᵢ,pₖ)≤εᵢ y d(uᵢ,pₖ)≤ρ; en otro caso, bᵢₖ=0.
- Dᵢ=1+|Nᵢ|+bᵢA+bᵢB.
- Tᵢ=(uᵢ+Σvecinos uⱼ+bᵢA pA+bᵢB pB)/Dᵢ.
- Lᵢ=Σvecinos(uⱼ−uᵢ)/Dᵢ; Pᵢ=Σpolos bᵢₖ(pₖ−uᵢ)/Dᵢ.
- Lᵢ+Pᵢ=Tᵢ−uᵢ.

El 1 representa la propia opinión. S=3 es exactamente el peso de tres opiniones individuales idénticas a la señal; no una constante humana estimada. Se conserva un único control para ambos polos. El valor inicial 1 y el rango 0–10 son elecciones de exploración, no calibración.

## Fuente y adaptación

Hegselmann y Krause (2015), *Opinion dynamics under the influence of radical groups, charismatic leaders, and other constant signals*, secciones 1.1–1.3, pp. 478–480, [DOI](https://doi.org/10.3934/nhm.2015.10.477).

El antecedente es escalar: incluye propia opinión y vecinos; una señal constante aceptada cuenta tantas veces como indica su intensidad. Dos dimensiones, dos señales simultáneas, alcance emisor adicional y respuesta gradual son adaptaciones declaradas. No se traslada automáticamente ningún teorema del artículo al simulador completo.

La contribución base pasa después por el paso numérico 0.075μ, umbral, ruido y límites ya existentes. La suma de otras fuerzas sigue siendo una extensión, no HK literal. JDJ, eventos y gravedad no se modifican.

## Ejemplo completo

A=(0,1), B=(1,0), persona=(0.9,0.1), ε=0.3, ρ=0.7.
dA≈1.273; dB≈0.141. Solo B se acepta.
Sin vecinos y S=3: D=4; T=(0.975,0.025); P=(0.075,−0.075).
Con μ=0.6 y sin otros efectos: desplazamiento=(0.003375,−0.003375).
Nueva posición=(0.903375,0.096625).

ρ=1 no cambia nada en ese ejemplo: A sigue rechazado por ε. Si ambas señales se aceptan, ambas influyen y pueden producir compromiso. Si ninguna se acepta, subir S no crea aceptación. No se promete atracción inevitable hacia extremos.

## Extensión colectiva, separada de la base

El término opcional κ(nₖ/N)P(cₖ) permanece desactivado inicialmente.
La función polar en el centro utiliza εᵢ de la persona receptora y cero vecinos:
Dcentro=1+bA+bB. Puede transmitir indirectamente una señal no aceptada directamente por esa persona; esto es una hipótesis de mediación grupal, no un resultado de la fuente.
Aunque persona y centro coincidan, el denominador individual puede ser distinto. El control experimental de ganancia debe comparar vectores ya calculados.

## Comprobación y alcance

Las pruebas importan el motor real: aceptación solo A, solo B, ambas, ninguna; igualdad en fronteras; radio cero; radio ampliado sin cambiar aceptación; equivalencia con opiniones repetidas; suma conjunta e inspector; JDJ y extensiones.
El diagnóstico de sensibilidad usa 78 ejecuciones y genera web_sensitivity_bounded.json; no reemplaza los informes históricos ni constituye validación social.

Los motores Python históricos no se han convertido en réplicas del nuevo motor web. Sus pruebas detectan regresiones en su propio alcance, no paridad Python/JavaScript.

