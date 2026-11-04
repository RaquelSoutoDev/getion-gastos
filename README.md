# Gestión de Gastos

PWA de finanzas personales para uso propio en iPhone, instalada desde Safari con
"Añadir a pantalla de inicio". **Sin backend**: todos los datos se guardan únicamente en el
dispositivo (IndexedDB) y la app funciona sin conexión.

## Concepto

La app organiza las finanzas por **ciclos**: un ciclo empieza al registrar un salario y
termina al registrar el siguiente. Al abrir un ciclo se calcula el dinero libre disponible
("colchón"):

```
colchón = salario − gastos fijos − cuotas fraccionadas vigentes
        − gastos aproximados − ahorro programado − presupuesto de comida
```

Cada ciclo tiene dos bolsas de gasto del día a día (**Comida**, con presupuesto mensual, y
**Colchón**, el dinero libre calculado) y cuatro tipos de gasto periódico configurables
(**fijo**, **fraccionado** con fecha de fin opcional, **aproximado** con presupuesto vs.
importe real, y **ahorro**). Al registrar un nuevo salario se cierra el ciclo anterior:
el sobrante pasa a la hucha de ahorro y el déficit, si lo hay, se descuenta del ciclo nuevo.
Los ciclos cerrados quedan como histórico de solo lectura.

El contexto completo de negocio, el modelo de datos y las convenciones de código están en
[`CLAUDE.md`](./CLAUDE.md).

## Pantallas

- **Inicio** — colchón y comida disponibles, ahorro acumulado, añadir gasto en pocos toques,
  registrar salario con resumen de cierre y confirmación.
- **Gastos periódicos** — alta/edición/pausa/baja por tipo, con el total comprometido.
- **Ahorro** — saldo de la hucha e historial de aportaciones (automáticas y manuales).
- **Historial** — ciclos cerrados con el detalle completo de su cierre.
- **Ajustes** — presupuesto de comida, día de cobro, exportar/importar backup en JSON,
  borrar todos los datos.

## Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript (`strict`)
- [Tailwind CSS v4](https://tailwindcss.com/) — mobile-first, safe areas de iPhone, modo
  oscuro automático
- [Dexie.js](https://dexie.org/) sobre IndexedDB para persistencia
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — manifest, iconos, service worker,
  funcionamiento offline
- [Vitest](https://vitest.dev/) + [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB)
  para los tests

Toda la lógica de cálculo (colchón, vigencia de gastos periódicos, cierre de ciclo, arrastre
de déficit) vive en `src/core/` como funciones puras, sin ninguna dependencia de Dexie ni de
React, con tests de Vitest cubriendo los casos límite.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm test -- run     # tests (una sola pasada; sin "-- run" queda en modo watch)
npm run lint        # oxlint
npx tsc -b           # type-check estricto
```

## Build y PWA

```bash
npm run build       # build de producción (incluye el service worker)
npm run preview     # sirve el build para probar el modo offline real
```

El modo offline y el service worker **solo se activan en el build de producción**: con
`npm run dev` no hay funcionamiento sin conexión real, hay que probarlo con `build` +
`preview` (o ya desplegado).

## Estructura

```
src/
  core/        lógica de negocio pura (sin Dexie ni React) + tests
  db/          esquema Dexie, repositorios, backup JSON, storage.persist()
  hooks/       puente entre db/ (useLiveQuery) y core/ (cálculo puro)
  components/  componentes de UI compartidos
  screens/     las 5 pantallas de la app
  app/         App.tsx, main.tsx, navegación por pestañas
```

## Privacidad

No hay servidor ni cuentas: todos los datos viven en el dispositivo. Desde Ajustes se puede
exportar una copia de seguridad completa en JSON (y la app avisa si pasan más de 30 días sin
hacerlo) o importarla para restaurar/migrar de dispositivo.
