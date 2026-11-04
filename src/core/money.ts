import type { Centimos } from './types'

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function formatearEuros(centimos: Centimos): string {
  return formatter.format(centimos / 100)
}

/**
 * Admite "1234", "1234,56", "1.234,56" y "1234.56". Si hay coma, los puntos se
 * interpretan como separador de miles y se descartan. Si no hay coma, el punto
 * se interpreta como separador decimal (por eso "1.234" sin coma se rechaza:
 * es ambiguo, no se sabe si el punto es de miles o decimal).
 */
export function parsearImporte(texto: string): Centimos | null {
  const limpio = texto.trim().replace(/\s/g, '')
  if (limpio === '') return null

  const normalizado = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalizado)) return null

  return Math.round(Number(normalizado) * 100)
}

/** Texto editable sin símbolo de moneda ni separador de miles, ej. "1234,56". Para prerrellenar formularios. */
export function centimosATexto(centimos: Centimos): string {
  const negativo = centimos < 0
  const absolutos = Math.abs(centimos)
  const euros = Math.floor(absolutos / 100)
  const resto = String(absolutos % 100).padStart(2, '0')
  return `${negativo ? '-' : ''}${euros},${resto}`
}
