import { ResumenCierreView } from '../../components/ResumenCierreView'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { formatearFechaEs } from '../../core/dates'
import { formatearEuros } from '../../core/money'
import type { Cycle } from '../../core/types'

interface CicloDetalleSheetProps {
  ciclo: Cycle | null
  onClose: () => void
}

export function CicloDetalleSheet({ ciclo, onClose }: CicloDetalleSheetProps) {
  if (!ciclo || !ciclo.resumenCierre) return null

  return (
    <BottomSheet open={ciclo !== null} onClose={onClose} title={`Ciclo Nº ${ciclo.numero}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatearFechaEs(ciclo.fechaInicio)} – {ciclo.fechaFin ? formatearFechaEs(ciclo.fechaFin) : '—'} · Salario{' '}
          {formatearEuros(ciclo.salarioImporte)}
          {ciclo.deficitArrastrado > 0 && (
            <>
              {' '}
              · Arrastró {formatearEuros(ciclo.deficitArrastrado)} de déficit del ciclo anterior
            </>
          )}
        </p>
        <ResumenCierreView resumen={ciclo.resumenCierre} />
      </div>
    </BottomSheet>
  )
}
