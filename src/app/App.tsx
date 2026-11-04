import { useState } from 'react'
import { BottomNav, type Tab } from '../components/layout/BottomNav'
import { Ahorro } from '../screens/Ahorro'
import { Ajustes } from '../screens/Ajustes'
import { GastosPeriodicos } from '../screens/GastosPeriodicos'
import { Historial } from '../screens/Historial'
import { Inicio } from '../screens/Inicio'

function App() {
  const [tab, setTab] = useState<Tab>('inicio')

  return (
    <>
      {tab === 'inicio' && <Inicio onIrAAjustes={() => setTab('ajustes')} />}
      {tab === 'periodicos' && <GastosPeriodicos />}
      {tab === 'ahorro' && <Ahorro />}
      {tab === 'historial' && <Historial />}
      {tab === 'ajustes' && <Ajustes />}
      <BottomNav active={tab} onChange={setTab} />
    </>
  )
}

export default App
