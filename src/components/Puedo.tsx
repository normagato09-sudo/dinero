import { useState } from 'react'
import { euros, libreEsteMes, parseImporte, type Pago, redondear } from '../lib/calc'
import { IconAlerta, IconCheck } from './icons'

interface Props {
  saldo: number
  pagos: Pago[]
  hoy: Date
}

const RAPIDOS = [20, 50, 120, 250]

export function Puedo({ saldo, pagos, hoy }: Props) {
  const [precio, setPrecio] = useState('')
  const libre = libreEsteMes(saldo, pagos, hoy)
  const p = parseImporte(precio)

  return (
    <section className="pantalla">
      <header className="cabecera">
        <h1>¿Me lo puedo permitir?</h1>
      </header>

      <div className="tarjeta">
        <span className="etiqueta">Precio</span>
        <div className="campo-grande">
          <input
            className="num"
            inputMode="decimal"
            placeholder="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            aria-label="Precio"
          />
          <span className="num">€</span>
        </div>
        <div className="rapidos">
          {RAPIDOS.map((n) => (
            <button key={n} className={`chip num ${p === n ? 'activo' : ''}`} onClick={() => setPrecio(String(n))}>
              {n} €
            </button>
          ))}
        </div>
      </div>

      {p !== null && p > 0 && (
        p <= libre ? (
          <div className="tarjeta resultado ok" role="status">
            <IconCheck />
            <div>
              <strong>Sí, te lo puedes permitir</strong>
              <span>te quedarían <b className="num">{euros(redondear(libre - p))}</b></span>
            </div>
          </div>
        ) : (
          <div className="tarjeta resultado no" role="status">
            <IconAlerta />
            <div>
              <strong>Te faltan <span className="num">{euros(redondear(p - libre))}</span></strong>
            </div>
          </div>
        )
      )}

      <p className="sub centro">Libre este mes: <span className="num">{euros(libre)}</span></p>
    </section>
  )
}
