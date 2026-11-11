import { useState } from 'react'
import { Inicio } from './components/Inicio'
import { Pagos } from './components/Pagos'
import { Puedo } from './components/Puedo'
import { IconInicio, IconPagos, IconPuedo } from './components/icons'
import { useDatos, useHoy } from './lib/store'

type Pestana = 'inicio' | 'pagos' | 'puedo'

const PESTANAS = [
  { id: 'inicio', texto: 'Inicio', Icono: IconInicio },
  { id: 'pagos', texto: 'Pagos', Icono: IconPagos },
  { id: 'puedo', texto: '¿Puedo?', Icono: IconPuedo },
] as const

export default function App() {
  const [pestana, setPestana] = useState<Pestana>('inicio')
  const [datos, actualizar, reemplazar] = useDatos()
  const hoy = useHoy()

  return (
    <div className="app">
      <main>
        {pestana === 'inicio' && (
          <Inicio
            datos={datos}
            hoy={hoy}
            onSaldo={(saldo) => actualizar((d) => ({ ...d, saldo }))}
            onImportar={reemplazar}
          />
        )}
        {pestana === 'pagos' && (
          <Pagos
            pagos={datos.pagos}
            hoy={hoy}
            onGuardar={(p) =>
              actualizar((d) => ({
                ...d,
                pagos: d.pagos.some((x) => x.id === p.id) ? d.pagos.map((x) => (x.id === p.id ? p : x)) : [...d.pagos, p],
              }))
            }
            onBorrar={(id) => actualizar((d) => ({ ...d, pagos: d.pagos.filter((x) => x.id !== id) }))}
          />
        )}
        {pestana === 'puedo' && <Puedo saldo={datos.saldo} pagos={datos.pagos} hoy={hoy} />}
      </main>

      <nav className="tabbar" aria-label="Secciones">
        {PESTANAS.map(({ id, texto, Icono }) => (
          <button
            key={id}
            className={pestana === id ? 'activo' : ''}
            aria-current={pestana === id ? 'page' : undefined}
            onClick={() => setPestana(id)}
          >
            <Icono />
            <span>{texto}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
