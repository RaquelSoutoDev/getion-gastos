import type { Centimos } from './types'

export interface DeficitDetectado {
  comida: Centimos
  colchon: Centimos
  total: Centimos
}

/** Convierte los sobrantes negativos (déficit) de cada bolsa en magnitudes positivas. */
export function calcularDeficitDetectado(sobranteComida: Centimos, sobranteColchon: Centimos): DeficitDetectado {
  const comida = sobranteComida < 0 ? -sobranteComida : 0
  const colchon = sobranteColchon < 0 ? -sobranteColchon : 0
  return { comida, colchon, total: comida + colchon }
}

/** Solo los sobrantes positivos entran en la hucha; los negativos no se restan de ella. */
export function calcularAportacionHucha(sobranteComida: Centimos, sobranteColchon: Centimos): Centimos {
  return Math.max(sobranteComida, 0) + Math.max(sobranteColchon, 0)
}
