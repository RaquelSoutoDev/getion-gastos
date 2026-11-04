# Gestión de Gastos — PWA de finanzas personales

Contexto de negocio y reglas para trabajar en este proyecto. Leer antes de tocar `core/`.

## Qué es esta app

PWA de uso estrictamente personal (una sola persona, un solo dispositivo: iPhone, instalada
desde Safari con "Añadir a pantalla de inicio"). Sin backend ni sincronización: todos los
datos viven en IndexedDB del dispositivo. Interfaz en español, moneda EUR, formato de fecha
es-ES. Todos los importes se almacenan en **céntimos (enteros)**, nunca en floats.

## Stack

- Vite + React + TypeScript (`strict: true`)
- Tailwind CSS, mobile-first, safe areas de iPhone, dark mode automático (`prefers-color-scheme`)
- Dexie.js sobre IndexedDB
- vite-plugin-pwa (manifest, service worker, offline)
- Vitest para los tests
- Sin router externo: navegación por pestañas con estado local (barra inferior tipo iOS)

## Concepto central: ciclos

Un **ciclo** empieza cuando se registra un salario y termina cuando se registra el siguiente
(el cierre del anterior y la apertura del nuevo ocurren en la misma operación atómica).

Al abrir un ciclo se calcula:

```
colchón = salario − fijos − fraccionados vigentes − aproximados (presupuesto o real) − ahorro programado − presupuesto de comida
```

### Regla de oro: nada se congela mientras el ciclo está abierto

Mientras un ciclo tiene `estado: 'abierto'`, **todos** sus totales (colchón, comida disponible,
totales por tipo de gasto periódico) se recalculan en vivo a partir de la configuración actual
(`PeriodicItem`, `Settings`) y de los movimientos del ciclo (`Gasto`, `RegistroAproximado`).
Esto es intencional: si editas un gasto fijo o pausas uno fraccionado, el ciclo abierto debe
reflejarlo inmediatamente.

Solo al **cerrar** un ciclo (ver más abajo) se congela un `resumenCierre` inmutable dentro del
propio `Cycle`. Un ciclo cerrado (`estado: 'cerrado'`) es de solo lectura: no se deben poder
editar ni borrar sus `Gasto` ni sus `RegistroAproximado` una vez cerrado.

Consecuencia práctica: **nunca** hay que "propagar" ediciones a ciclos cerrados — por
construcción, los cerrados no leen la configuración en vivo, solo su `resumenCierre` ya
calculado. Editar, pausar o eliminar un `PeriodicItem` solo afecta al ciclo abierto y a los
futuros, nunca a los cerrados.

## Tipos de gasto periódico (`PeriodicItem`)

Todos tienen `estado: 'activo' | 'pausado' | 'eliminado'` (soft-delete: nunca se borran
físicamente, para que los `resumenCierre` históricos sigan teniendo sentido). Solo `'activo'`
cuenta en los cálculos en vivo.

1. **Fijo**: importe exacto cada mes (alquiler, gimnasio). Cuenta si está activo.
2. **Fraccionado**: cuota mensual (`importeMensual`) con `fechaFin` opcional (universidad,
   ordenador). Cuenta en un ciclo si `estado === 'activo'` y
   `cycle.fechaInicio <= (fechaFin ?? +Infinity)`. **Cuotas restantes** = meses de calendario
   completos entre hoy y `fechaFin` (decisión tomada con el usuario: no se basa en número de
   ciclos, porque los ciclos son irregulares). Avisar en UI cuando quedan 0 o menos.
3. **Aproximado**: tiene un presupuesto estimado (`importeMensual`, luz, agua). Por ciclo se
   puede registrar un `RegistroAproximado.importeReal`. Si no existe registro para ese
   ciclo+item, cuenta el presupuesto. La diferencia `real − presupuesto` se suma o resta del
   colchón disponible en cuanto se registra (no hay que esperar al cierre).
4. **Ahorro**: importe mensual que se aparta hacia la hucha. Se deduce del colchón al calcular,
   y genera un `HuchaMovimiento` de origen `'ahorro_programado'` en el momento del cierre del
   ciclo (con los valores vigentes en ese instante, no los que había al abrir el ciclo).

## Bolsas del día a día

Cada ciclo tiene dos bolsas de `Gasto`:
- **Comida**: presupuesto = `Settings.presupuestoComidaMensual` (en vivo, no snapshot).
- **Colchón**: el dinero libre calculado por la fórmula de arriba, ajustado en vivo por las
  diferencias de "aproximado" ya registradas en el ciclo.

Un gasto tiene: importe (céntimos), concepto opcional, fecha (hoy por defecto), bolsa.

## Cierre de ciclo (al registrar un nuevo salario)

Operación atómica, con resumen y confirmación previos:

1. Si existe un ciclo abierto, calcular su `resumenCierre` con los valores en vivo en ese
   instante (fijos, fraccionados vigentes, aproximados con su real/presupuesto, ahorro
   programado, gastos de cada bolsa, sobrante o déficit de cada bolsa) y congelarlo en
   `Cycle.resumenCierre`. Marcar `estado: 'cerrado'` y `fechaFin`.
2. Por cada bolsa (comida, colchón) con sobrante positivo: crear `HuchaMovimiento` de origen
   `'sobrante_ciclo'` con concepto tipo "Sobrante del ciclo N".
3. Por cada bolsa en negativo: **no** se resta de la hucha. Se avisa en el resumen y el déficit
   total (suma de ambas bolsas negativas) se guarda como `deficitArrastrado` en el ciclo nuevo,
   descontándose de su colchón inicial.
4. Crear el `Cycle` nuevo (`estado: 'abierto'`, `fechaInicio` = fecha del salario,
   `salarioImporte`, `deficitArrastrado` del paso 3).
5. Crear `HuchaMovimiento` de origen `'ahorro_programado'` por la suma de los `PeriodicItem`
   tipo `ahorro` activos en ese momento, referenciando el ciclo nuevo.

Si no hay ciclo abierto previo (primer salario registrado jamás), se salta directamente al
paso 4 — no hay nada que cerrar ni resumen previo que mostrar.

## Hucha de ahorro

Su saldo **no se almacena**: es la suma de todos los `HuchaMovimiento`, calculada con una
función pura. Nunca guardar un campo `balance` desincronizable.

Admite movimientos manuales (origen `'manual'`), además de los automáticos
(`'ahorro_programado'`, `'sobrante_ciclo'`) — decisión tomada con el usuario para poder
registrar ingresos extra o retiros puntuales desde la pantalla de Ahorro.

## Ajustes

- `presupuestoComidaMensual`, `diaCobroHabitual` (día del mes 1-31, para estimar días hasta el
  próximo salario — si el mes no tiene ese día, usar el último día del mes).
- Exportar/importar todo en JSON. **Importar reemplaza todos los datos del dispositivo**
  (decisión tomada con el usuario: importar = restaurar backup, no fusionar). Debe pedir doble
  confirmación, igual que "borrar todo".
- Recordatorio en Inicio si `Settings.ultimaExportacion` es `null` o tiene más de 30 días.

## Pantalla de Inicio

Muestra el colchón disponible como importe destacado (sin desglose por día — decisión tomada
con el usuario: no se necesita esa métrica), comida disponible, días hasta el próximo salario
estimado, botón principal "Añadir gasto" (2-3 toques desde aquí) y últimos movimientos.

## Arquitectura de código

- **`src/core/`**: toda la lógica de cálculo en funciones puras (colchón, vigencia de
  periódicos, cierre de ciclo, arrastre de déficit, hucha). Sin imports de Dexie ni de React.
  Reciben datos planos como argumentos, devuelven datos planos. 100% cubierto por Vitest,
  incluyendo casos límite: fraccionado que termina este mes, aproximado sin importe real,
  bolsa en negativo, primer ciclo sin histórico.
- **`src/db/`**: esquema Dexie y repositorios. Es la única capa que conoce IndexedDB.
- **`src/hooks/`**: puente entre `db` (vía `useLiveQuery`) y `core` (cálculo puro) para las
  pantallas.
- Llamar a `navigator.storage.persist()` al arrancar la app.
- Sin router externo: navegación por pestañas con estado local.
