import { useRef, useState } from 'react'
import { type Datos, diasHasta, enDias, euros, fechaCorta, parseISO, parseImporte, proximoPago } from '../lib/calc'
import { type EstadoNube, exportarJSON, leerJSON } from '../lib/store'
import { IconAjustes, IconBajar, IconEditar, IconSubir } from './icons'
import { Sheet } from './Sheet'

interface Props {
  datos: Datos
  hoy: Date
  estado: EstadoNube
  onSaldo: (n: number) => void
  onImportar: (d: Datos) => void
}

const aTexto = (n: number) => n.toFixed(2).replace('.', ',')

const NUBE: Record<EstadoNube, { texto: string; clase: string }> = {
  cargando: { texto: 'Sincronizando…', clase: '' },
  nube: { texto: 'Guardado en la nube · se actualiza solo', clase: 'ok' },
  local: { texto: 'Solo en este dispositivo', clase: 'mal' },
  clave: { texto: 'Falta la contraseña', clase: 'mal' },
  'sin-conexion': { texto: 'Sin conexión · se guardará al volver', clase: 'mal' },
}

export function Inicio({ datos, hoy, estado, onSaldo, onImportar }: Props) {
  const [editando, setEditando] = useState(false)
  const [ajustes, setAjustes] = useState(false)
  const [valor, setValor] = useState('')
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const prox = proximoPago(datos.pagos, hoy)
  const proxIngreso = proximoPago(datos.pagos, hoy, 'ingreso')
  const recientes = [...(datos.movimientos ?? [])].reverse().slice(0, 6)
  const nuevo = parseImporte(valor)

  const abrirSaldo = () => {
    setValor(aTexto(datos.saldo))
    setEditando(true)
  }

  const guardar = () => {
    if (nuevo === null) return
    onSaldo(nuevo)
    setEditando(false)
  }

  const importar = async (file: File | undefined) => {
    if (!file) return
    try {
      const d = await leerJSON(file)
      onImportar(d)
      setAviso({ ok: true, texto: `Copia importada · ${d.pagos.length} pagos` })
    } catch (e) {
      setAviso({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo importar' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <section className="pantalla">
      <header className="cabecera">
        <h1>Mi Dinero</h1>
        <button className="btn-icono" aria-label="Ajustes" onClick={() => { setAviso(null); setAjustes(true) }}>
          <IconAjustes />
        </button>
      </header>

      <button className="tarjeta tarjeta-oscura saldo" onClick={abrirSaldo}>
        <span className="etiqueta">Lo que tengo</span>
        <span className="num saldo-num">{euros(datos.saldo)}</span>
        <span className="saldo-editar"><IconEditar /> Tocar para editar</span>
      </button>
      <span className={`nube ${NUBE[estado].clase}`}><span className="bola" />{NUBE[estado].texto}</span>

      <div className="tarjeta">
        <span className="etiqueta">Próximo pago</span>
        {prox ? (
          <div className="fila-proximo">
            <div>
              <div className="titulo-pago">{prox.pago.nombre}</div>
              <div className="sub">
                {fechaCorta(prox.fecha)} · <strong className="naranja">{enDias(diasHasta(prox.fecha, hoy))}</strong>
              </div>
            </div>
            <span className="num importe naranja">{euros(prox.pago.importe)}</span>
          </div>
        ) : (
          <p className="sub vacio">No hay pagos próximos</p>
        )}
      </div>

      {proxIngreso && (
        <div className="tarjeta">
          <span className="etiqueta">Próximo ingreso</span>
          <div className="fila-proximo">
            <div>
              <div className="titulo-pago">{proxIngreso.pago.nombre}</div>
              <div className="sub">
                {fechaCorta(proxIngreso.fecha)} · <strong className="verde">{enDias(diasHasta(proxIngreso.fecha, hoy))}</strong>
              </div>
            </div>
            <span className="num importe verde">+{euros(proxIngreso.pago.importe)}</span>
          </div>
        </div>
      )}

      <div className="tarjeta">
        <span className="etiqueta">Últimos movimientos</span>
        {recientes.length === 0 && <p className="sub vacio">Aquí verás lo que se suma y se resta solo.</p>}
        {recientes.map((m) => (
          <div key={m.id} className="movimiento">
            <div>
              <div className="titulo-pago">{m.nombre}</div>
              <div className="sub">{fechaCorta(parseISO(m.fecha) ?? hoy)}{m.tipo === 'fijo' ? ' · automático' : ''}</div>
            </div>
            <span className={`num importe ${m.importe > 0 ? 'verde' : 'naranja'}`}>{m.importe > 0 ? '+' : '−'}{euros(Math.abs(m.importe))}</span>
          </div>
        ))}
      </div>

      <Sheet titulo="Lo que tengo" abierta={editando} onCerrar={() => setEditando(false)}>
        <form onSubmit={(e) => { e.preventDefault(); guardar() }}>
          <div className="campo-grande">
            <input
              className="num"
              inputMode="decimal"
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onFocus={(e) => e.target.select()}
              aria-label="Saldo"
            />
            <span className="num">€</span>
          </div>
          <button className="btn btn-principal" type="submit" disabled={nuevo === null}>Guardar</button>
        </form>
      </Sheet>

      <Sheet titulo="Ajustes" abierta={ajustes} onCerrar={() => setAjustes(false)}>
        <p className="sub">Copia de seguridad en JSON</p>
        <div className="pila">
          <button className="btn btn-secundario" onClick={() => exportarJSON(datos, hoy)}>
            <IconBajar /> Exportar copia
          </button>
          <button className="btn btn-secundario" onClick={() => fileRef.current?.click()}>
            <IconSubir /> Importar copia
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => importar(e.target.files?.[0])}
          />
          {aviso && <p className={`aviso ${aviso.ok ? 'verde' : 'naranja'}`}>{aviso.texto}</p>}
        </div>
      </Sheet>
    </section>
  )
}
