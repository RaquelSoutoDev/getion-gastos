import { useLiveQuery } from 'dexie-react-hooks'
import { calcularSaldoHucha } from '../core/hucha'
import { db } from '../db/schema'

export function useHucha() {
  return useLiveQuery(async () => {
    const movimientos = await db.huchaMovimientos.orderBy('fecha').reverse().toArray()
    return { movimientos, saldo: calcularSaldoHucha(movimientos) }
  }, [])
}
