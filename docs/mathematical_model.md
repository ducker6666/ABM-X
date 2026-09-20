# Modelo matematico minimo

## Seleccion del modelo base

Modelo de referencia: Hegselmann-Krause en red. Motivos: opiniones continuas, confianza acotada interpretable, actualizacion sincronica clara, compatibilidad con espacios `[0,1]^d`, redes reales y mediciones de polarizacion.

Modelo alternativo: Deffuant-Weisbuch. Es preferible cuando se quiere modelar encuentros pairwise asincronicos.

Modelo extendido final: HK en red + Friedkin-Johnsen + eventos/polos + confianza adaptativa guiada por polarizacion global/local. No debe implementarse todo de inicio.

## Version 0: HK en red

Agentes `i=1,...,N`, opiniones `x_i(t) in [0,1]^d`, red ponderada `A`.

`N_i(t)={j: A_ij>0 and ||x_j(t)-x_i(t)||<=epsilon_i}`.

`x_i(t+1)=Pi_E( sum_{j in N_i(t) union {i}} w_ij x_j(t) / sum_j w_ij )`.

Frontera recomendada: proyeccion/saturacion `Pi_E(y)=min(1,max(0,y))`. Reflexion es util numericamente, pero socialmente implica rebote artificial. Periodicidad es incoherente para actitudes porque hace vecinas posiciones opuestas.

## Version 1: susceptibilidad, obstinacion e inmovilidad

`F_i(t)=m_i(t)-x_i(t)`, donde `m_i(t)` es la media local.

`x_i(t+1)=Pi_E((1-lambda_i)[x_i(t)+mu_i F_i(t) 1{||F_i(t)||>alpha_i}] + lambda_i b_i)`.

Interpretacion: `epsilon_i` tolerancia/confianza; `mu_i` susceptibilidad; `lambda_i` anclaje; `alpha_i` activacion/inmovilidad.

## Version 2: polos y eventos

Polos permanentes `P_A=(0,1)`, `P_B=(1,0)` entran como campo:

`F_i(t)=F_i^soc(t)+sum_p rho_ip(t)(P_p-x_i(t))`.

Evento `e` con posicion `c_e`, intensidad `I_e`, alcance `R_e`, inicio `t_e`, duracion y decaimiento:

`g_e(t)=I_e K(t-t_e) 1{t>=t_e}`.

`F_i^evt(t)=sum_e s_e g_e(t) exp(-||x_i-c_e||^2/(2R_e^2)) (c_e-x_i)`, con `s_e=1` atraccion o `s_e=-1` repulsion.

## Version 3: fatiga y retroalimentacion

`H_i(t+1)=rho H_i(t)+sum_e exposure_ie(t)+||x_i(t+1)-x_i(t)||`.

`P_G(t)=JDJ(X(t))`, pendiente de verificar con formula original.

`P_i^exp(t)=JDJ(X_{E_i(t)})`.

`epsilon_i(t+1)=clip(epsilon_i(t)+a(P_i^exp(t)-P_G(t))-bH_i(t), epsilon_min, epsilon_max)`.

Componente potencialmente nuevo: JDJ local/global como variable endogena de tolerancia. Verificacion: pruebas unitarias por casos limite y comparacion con HK cuando `a=b=0`. Validacion: series temporales de opiniones/red/eventos.

## Version implementada en `src/final_model.py`

La version ejecutable usa opiniones `x_i(t) in [0,1]^d`, red no dirigida `A`, anclajes `b_i=x_i(0)`, tolerancia `epsilon_i(t)`, susceptibilidad `mu_i`, obstinacion `lambda_i`, umbral de activacion `alpha_i` y fatiga `H_i(t)`.

Vecindad:

`N_i(t)={j: A_ij>0, ||x_j(t)-x_i(t)|| <= epsilon_i(t)} union {i}`.

Fuerza social:

`F_i^soc(t)=mean_{j in N_i(t)} x_j(t)-x_i(t)`.

Polos y eventos:

`F_i^ext(t)=sum_k s_k rho_k exp(-||x_i-p_k||^2/(2R_k^2))(p_k-x_i) + sum_e s_e I_e exp[-delta_e(t-t_e)] 1_{t_e <= t < t_e+D_e} exp(-||x_i-c_e||^2/(2R_e^2))(c_e-x_i)`.

Movimiento:

`x_i^*(t+1)=x_i(t)+mu_i [F_i^soc(t)+F_i^ext(t)] 1{||F_i^soc(t)+F_i^ext(t)||>alpha_i}`.

Anclaje:

`x_i(t+1)=Pi_[0,1]^d((1-lambda_i)x_i^*(t+1)+lambda_i b_i)`.

Fatiga:

`H_i(t+1)=rho H_i(t)+exposicion_i(t)+||x_i(t+1)-x_i(t)||`.

Retroalimentacion:

`epsilon_i(t+1)=clip(epsilon_i(t)+a(P_i^exp(t)-P_G(t))-bP_G(t)-cH_i(t+1), epsilon_min, epsilon_max)`.

`P_G` y `P_i^exp` se calculan con una medida difusa de oposicion entre polos. Importante: la implementacion usa una aproximacion operativa JDJ-like basada en membresia difusa a dos polos; para publicacion, la formula debe sustituirse o verificarse contra Guevara et al. (2020).

Esta version no incluye aun contraeventos endogenos ni cambio adaptativo de la red. Se dejaron fuera a proposito para preservar identificabilidad.

## Hipotesis

H1: tolerancia adaptativa por polarizacion experimentada produce brechas entre polarizacion ideologica global y estructural.

H2: eventos con decaimiento generan polarizacion episodica; si reducen tolerancia local de forma persistente pueden inducir polarizacion estructural.

H3: un balance 50/50 de polos no crea atraccion al centro por si mismo; solo cancela fuerzas si son simetricas. Recentrado requiere fatiga, ruido, instituciones/moderadores, incentivos, repulsion de extremos o cambio de red.
