/** Importe en céntimos de euro (entero). Nunca se usan floats para dinero. */
export type Centimos = number

/** Fecha en formato ISO `yyyy-mm-dd`, sin hora. */
export type FechaISO = string

export type TipoPeriodico = 'fijo' | 'fraccionado' | 'aproximado' | 'ahorro'

/** Solo 'activo' cuenta en los cálculos en vivo. Soft-delete: nunca se borra físicamente. */
export type EstadoPeriodico = 'activo' | 'pausado' | 'eliminado'

export interface PeriodicItem {
  id: string
  nombre: string
  tipo: TipoPeriodico
  /** Cuota (fraccionado), presupuesto (aproximado) o importe fijo/ahorro mensual. */
  importeMensual: Centimos
  /** Informativo/auditoría: no se usa para decidir vigencia (ver CLAUDE.md). */
  fechaInicio: FechaISO
  /** Solo aplica a 'fraccionado'. */
  fechaFin: FechaISO | null
  estado: EstadoPeriodico
}

export interface RegistroAproximado {
  id: string
  cicloId: string
  periodicItemId: string
  importeReal: Centimos
}

export type Bolsa = 'comida' | 'colchon'

export interface Gasto {
  id: string
  cicloId: string
  bolsa: Bolsa
  importe: Centimos
  concepto: string | null
  fecha: FechaISO
}

export interface Settings {
  presupuestoComidaMensual: Centimos
  /** Día del mes (1-31) habitual de cobro de salario. */
  diaCobroHabitual: number
  ultimaExportacion: FechaISO | null
}

export type EstadoCiclo = 'abierto' | 'cerrado'

export interface AproximadoDetalleCierre {
  periodicItemId: string
  nombre: string
  presupuesto: Centimos
  real: Centimos
  /** real − presupuesto */
  diferencia: Centimos
}

export interface ResumenCierre {
  colchonInicial: Centimos
  comidaInicial: Centimos
  totalFijos: Centimos
  totalFraccionados: Centimos
  totalAhorroProgramado: Centimos
  aproximados: AproximadoDetalleCierre[]
  gastosComidaTotal: Centimos
  gastosColchonTotal: Centimos
  /** Puede ser negativo. */
  sobranteComida: Centimos
  /** Puede ser negativo. */
  sobranteColchon: Centimos
  /** Partes negativas de cada bolsa, expresadas en positivo. */
  deficitDetectado: { comida: Centimos; colchon: Centimos }
  /** Suma de los sobrantes positivos; es lo que realmente entra en la hucha. */
  aportacionHuchaSobrante: Centimos
  /** Lo que se descontará del colchón del ciclo siguiente. */
  deficitArrastrado: Centimos
}

export interface Cycle {
  id: string
  numero: number
  fechaInicio: FechaISO
  fechaFin: FechaISO | null
  salarioImporte: Centimos
  estado: EstadoCiclo
  deficitArrastrado: Centimos
  resumenCierre: ResumenCierre | null
}

export type OrigenHucha = 'ahorro_programado' | 'sobrante_ciclo' | 'manual'

export interface HuchaMovimiento {
  id: string
  fecha: FechaISO
  /** Puede ser negativo (retiro manual). */
  importe: Centimos
  origen: OrigenHucha
  concepto: string | null
  cicloId: string | null
}
