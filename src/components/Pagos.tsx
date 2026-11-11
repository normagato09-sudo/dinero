import { useState } from 'react'
import {
  cobraEnDia, costeAnual, euros, frecuencia, mismoDia, type Pago, resumenFin, semanaActual, terminado,
} from '../lib/calc'
import { IconMas } from './icons'
import { PagoForm } from './PagoForm'
import { Sheet } from './Sheet'

type Filtro = 'todos' | 'mensual' | 'anual'

interface Props {
  pagos: Pago[]
  hoy: Date
  onGuardar: (p: Pago) => void
  onBorrar: (id: string) => void
}

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function Pagos({ pagos, hoy, onGuardar, onBorrar }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [abierto, setAbierto] = useState<Pago | 'nuevo' | null>(null)

  const semana = semanaActual(hoy)
  const visibles = pagos
    .filter((p) => filtro === 'todos' || p.tipo === filtro)
    .sort((a, b) => Number(terminado(a, hoy)) - Number(terminado(b, hoy)) || b.importe - a.importe)

  const cerrar = () => setAbierto(null)

  return (
    <section className="pantalla">
      <header className="cabecera">
        <h1>Pagos</h1>
        <button className="btn-icono btn-icono-principal" aria-label="Añadir pago" onClick={() => setAbierto('nuevo')}>
          <IconMas />
        </button>
      </header>

      <div className="segmentado" role="tablist" aria-label="Filtro">
        {([['todos', 'Todos'], ['mensual', 'Mensuales'], ['anual', 'Anuales']] as const).map(([v, t]) => (
          <button key={v} role="tab" aria-selected={filtro === v} className={filtro === v ? 'activo' : ''} onClick={() => setFiltro(v)}>
            {t}
          </button>
        ))}
      </div>

      <div className="tarjeta semana" aria-label="Esta semana">
        {semana.map((dia, i) => {
          const hay = pagos.some((p) => cobraEnDia(p, dia))
          const esHoy = mismoDia(dia, hoy)
          return (
            <div key={i} className={`dia ${esHoy ? 'hoy' : ''}`}>
              <span className="dia-letra">{LETRAS[i]}</span>
              <span className="dia-num num">{dia.getDate()}</span>
              <span className={`punto ${hay ? 'si' : ''}`} aria-label={hay ? 'Hay pago' : undefined} />
            </div>
          )
        })}
      </div>

      <div className="lista">
        {visibles.length === 0 && <p className="sub vacio">Sin pagos</p>}
        {visibles.map((p) => {
          const fin = resumenFin(p, hoy)
          const acabado = terminado(p, hoy)
          return (
            <button key={p.id} className={`tarjeta pago ${acabado ? 'acabado' : ''}`} onClick={() => setAbierto(p)}>
              <div className="pago-fila">
                <div className="pago-info">
                  <span className="titulo-pago">{p.nombre}</span>
                  <span className="sub">{frecuencia(p)}</span>
                </div>
                <span className="num importe naranja">{euros(p.importe)}</span>
              </div>
              {fin && <span className="pago-fin">{fin}</span>}
            </button>
          )
        })}
      </div>

      <div className="tarjeta coste">
        <span className="etiqueta">Coste real al año</span>
        <span className="num coste-num">{euros(costeAnual(pagos, hoy))}</span>
      </div>

      <Sheet titulo={abierto === 'nuevo' ? 'Nuevo pago' : 'Editar pago'} abierta={abierto !== null} onCerrar={cerrar}>
        {abierto !== null && (
          <PagoForm
            key={abierto === 'nuevo' ? 'nuevo' : abierto.id}
            inicial={abierto === 'nuevo' ? undefined : abierto}
            onGuardar={(p) => { onGuardar(p); cerrar() }}
            onBorrar={abierto === 'nuevo' ? undefined : () => { onBorrar(abierto.id); cerrar() }}
          />
        )}
      </Sheet>
    </section>
  )
}
