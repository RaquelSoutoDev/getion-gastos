import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

export function usePeriodicItems() {
  return useLiveQuery(() => db.periodicItems.toArray(), [])
}
