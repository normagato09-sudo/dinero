import { useState } from 'react'
import { crearId, MESES, type Pago, parseImporte, type TipoPago } from '../lib/calc'

interface Props {
  inicial?: Pago
  onGuardar: (p: Pago) => void
  onBorrar?: () => void
}

export function PagoForm({ inicial, onGuardar, onBorrar }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [importe, setImporte] = useState(inicial ? inicial.importe.toFixed(2).replace('.', ',') : '')
  const [tipo, setTipo] = useState<TipoPago>(inicial?.tipo ?? 'mensual')
  const [dia, setDia] = useState(String(inicial?.dia ?? 1))
  const [mes, setMes] = useState(String(inicial?.mes ?? 1))
  const [fin, setFin] = useState(inicial?.fin ?? '')
  const [confirmar, setConfirmar] = useState(false)

  const imp = parseImporte(importe)
  const diaN = Number(dia)
  const valido = nombre.trim() !== '' && imp !== null && imp > 0 && Number.isInteger(diaN) && diaN >= 1 && diaN <= 31

  const guardar = () => {
    if (!valido) return
    const p: Pago = {
      id: inicial?.id ?? crearId(),
      nombre: nombre.trim(),
      importe: imp!,
      tipo,
      dia: diaN,
    }
    if (tipo === 'anual') p.mes = Number(mes)
    if (fin) p.fin = fin
    onGuardar(p)
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); guardar() }}>
      <label>
        <span>Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Netflix" autoComplete="off" />
      </label>

      <label>
        <span>Importe</span>
        <div className="input-sufijo">
          <input className="num" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} placeholder="0,00" />
          <span>€</span>
        </div>
      </label>

      <div className="segmentado" role="radiogroup" aria-label="Tipo">
        {(['mensual', 'anual'] as const).map((t) => (
          <button type="button" key={t} role="radio" aria-checked={tipo === t} className={tipo === t ? 'activo' : ''} onClick={() => setTipo(t)}>
            {t === 'mensual' ? 'Mensual' : 'Anual'}
          </button>
        ))}
      </div>

      <div className="fila-campos">
        <label>
          <span>Día</span>
          <input className="num" type="number" inputMode="numeric" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} />
        </label>
        {tipo === 'anual' && (
          <label>
            <span>Mes</span>
            <select value={mes} onChange={(e) => setMes(e.target.value)}>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m[0].toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label>
        <span>Fecha de fin (opcional)</span>
        <div className="input-sufijo">
          <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          {fin && <button type="button" className="btn-texto" onClick={() => setFin('')}>Quitar</button>}
        </div>
      </label>

      <button className="btn btn-principal" type="submit" disabled={!valido}>Guardar</button>

      {onBorrar && (
        <button
          type="button"
          className={`btn ${confirmar ? 'btn-peligro' : 'btn-texto-peligro'}`}
          onClick={() => (confirmar ? onBorrar() : setConfirmar(true))}
        >
          {confirmar ? 'Tocar otra vez para borrar' : 'Borrar pago'}
        </button>
      )}
    </form>
  )
}
