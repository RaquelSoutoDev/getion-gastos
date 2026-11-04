import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

export function useCiclosCerrados() {
  return useLiveQuery(async () => {
    const ciclos = await db.cycles.where('estado').equals('cerrado').toArray()
    return ciclos.sort((a, b) => b.numero - a.numero)
  }, [])
}
