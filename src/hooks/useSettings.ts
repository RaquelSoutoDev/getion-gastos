import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { obtenerSettings } from '../db/repositories/settings'

export function useSettings() {
  return useLiveQuery(() => obtenerSettings(db), [])
}
