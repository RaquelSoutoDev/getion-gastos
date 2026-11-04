/** Pide al navegador que no borre IndexedDB bajo presión de espacio. Se llama al arrancar la app. */
export async function solicitarPersistencia(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
