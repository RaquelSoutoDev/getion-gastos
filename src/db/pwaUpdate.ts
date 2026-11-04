import { registerSW } from 'virtual:pwa-register'

const COMPROBAR_CADA_MS = 60 * 60 * 1000 // cada hora

/**
 * Registra el service worker y fuerza comprobaciones activas de versión nueva.
 *
 * Por defecto el navegador solo comprueba si hay una versión nueva al cargar
 * la página — pero una PWA instalada en iOS normalmente se "reanuda" en vez
 * de recargarse, así que esa comprobación casi nunca llega a dispararse. Por
 * eso, además del registro, se pide una comprobación manual cada vez que la
 * app vuelve a primer plano y con un intervalo de respaldo.
 */
export function registrarServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  const actualizarSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return

      setInterval(() => void registration.update(), COMPROBAR_CADA_MS)

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update()
      })
    },
  })

  // registerType: 'autoUpdate' ya recarga solo al activarse una versión nueva;
  // se guarda la referencia por si en el futuro se quiere forzar desde la UI.
  void actualizarSW
}
