// Lógica pura de fechas, pagos y dinero. Sin dependencias de React.

export type TipoPago = 'mensual' | 'anual'

export interface Pago {
  id: string
  nombre: string
  importe: number
  tipo: TipoPago
  /** Día del mes (1–31). Si el mes no lo tiene, se usa el último día. */
  dia: number
  /** Mes 1–12 (solo pagos anuales). */
  mes?: number
  /** Fecha de fin opcional, formato AAAA-MM-DD (incluida). */
  fin?: string
}

export interface Datos {
  saldo: number
  pagos: Pago[]
}

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// ---------- Fechas básicas (siempre en hora local, a medianoche) ----------

export function inicioDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Número de días del mes. `mes0` es 0–11. */
export function diasEnMes(anio: number, mes0: number): number {
  return new Date(anio, mes0 + 1, 0).getDate()
}

/** Fecha con el día ajustado al último día del mes si no existe (p. ej. 31 → 30). */
export function fechaAjustada(anio: number, mes0: number, dia: number): Date {
  return new Date(anio, mes0, Math.min(dia, diasEnMes(anio, mes0)))
}

/** Convierte "AAAA-MM-DD" a Date local. */
export function parseISO(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d.getTime()) ? null : d
}

export function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Días naturales entre hoy y la fecha (0 = hoy). Robusto ante cambios de hora. */
export function diasHasta(fecha: Date, hoy: Date): number {
  const a = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const b = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  return Math.round((b - a) / 86_400_000)
}

/** Lunes a domingo de la semana que contiene `hoy`. */
export function semanaActual(hoy: Date): Date[] {
  const base = inicioDia(hoy)
  const offset = (base.getDay() + 6) % 7 // lunes = 0
  return Array.from({ length: 7 }, (_, i) => new Date(base.getFullYear(), base.getMonth(), base.getDate() - offset + i))
}

// ---------- Cobros ----------

function finDe(pago: Pago): Date | null {
  return pago.fin ? parseISO(pago.fin) : null
}

/** ¿Está dentro de la fecha de fin (si tiene)? */
export function dentroDeFin(pago: Pago, fecha: Date): boolean {
  const fin = finDe(pago)
  return !fin || inicioDia(fecha) <= fin
}

/** Un pago ha terminado si su fecha de fin ya pasó. */
export function terminado(pago: Pago, hoy: Date): boolean {
  const fin = finDe(pago)
  return !!fin && fin < inicioDia(hoy)
}

/** Fecha de cobro del pago en un mes concreto, o null si ese mes no se cobra. */
export function cobroEnMes(pago: Pago, anio: number, mes0: number): Date | null {
  if (pago.tipo === 'anual' && (pago.mes ?? 1) - 1 !== mes0) return null
  const f = fechaAjustada(anio, mes0, pago.dia)
  return dentroDeFin(pago, f) ? f : null
}

/** ¿Hay cobro de este pago en esa fecha? */
export function cobraEnDia(pago: Pago, fecha: Date): boolean {
  const f = cobroEnMes(pago, fecha.getFullYear(), fecha.getMonth())
  return !!f && mismoDia(f, fecha)
}

/**
 * Próximo cobro desde hoy (incluido: un pago de hoy se considera pendiente).
 */
export function proximoCobro(pago: Pago, hoy: Date): Date | null {
  const base = inicioDia(hoy)
  if (terminado(pago, base)) return null
  for (let i = 0; i <= 12; i++) {
    const anio = base.getFullYear() + Math.floor((base.getMonth() + i) / 12)
    const mes0 = (base.getMonth() + i) % 12
    const f = cobroEnMes(pago, anio, mes0)
    if (f && f >= base) return f
    // Si el teórico de ese mes ya supera la fecha de fin, no habrá más.
    if (!f && !dentroDeFin(pago, fechaAjustada(anio, mes0, 1))) return null
  }
  return null
}

/** Todos los cobros pendientes desde hoy hasta la fecha de fin. Solo si tiene fin. */
export function cobrosRestantes(pago: Pago, hoy: Date): Date[] {
  const fin = finDe(pago)
  if (!fin) return []
  const base = inicioDia(hoy)
  const out: Date[] = []
  let anio = base.getFullYear()
  let mes0 = base.getMonth()
  while (new Date(anio, mes0, 1) <= fin) {
    const f = cobroEnMes(pago, anio, mes0)
    if (f && f >= base) out.push(f)
    mes0++
    if (mes0 === 12) { mes0 = 0; anio++ }
  }
  return out
}

export interface Proximo {
  pago: Pago
  fecha: Date
}

export function proximoPago(pagos: Pago[], hoy: Date): Proximo | null {
  let mejor: Proximo | null = null
  for (const pago of pagos) {
    const fecha = proximoCobro(pago, hoy)
    if (fecha && (!mejor || fecha < mejor.fecha)) mejor = { pago, fecha }
  }
  return mejor
}

/** Suma de los pagos que aún faltan por cobrar este mes (hoy incluido). */
export function pendienteEsteMes(pagos: Pago[], hoy: Date): number {
  const base = inicioDia(hoy)
  let total = 0
  for (const p of pagos) {
    const f = cobroEnMes(p, base.getFullYear(), base.getMonth())
    if (f && f >= base) total += p.importe
  }
  return redondear(total)
}

/** Libre = saldo − pagos que faltan este mes. */
export function libreEsteMes(saldo: number, pagos: Pago[], hoy: Date): number {
  return redondear(saldo - pendienteEsteMes(pagos, hoy))
}

/** Coste real al año: mensuales × 12 + anuales (sin los terminados). */
export function costeAnual(pagos: Pago[], hoy: Date): number {
  return redondear(
    pagos
      .filter((p) => !terminado(p, hoy))
      .reduce((s, p) => s + (p.tipo === 'mensual' ? p.importe * 12 : p.importe), 0),
  )
}

export function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

// ---------- Formato ----------

const fmtEuro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
})

/** 184,50 € · 1.234,50 € */
export function euros(n: number): string {
  return fmtEuro.format(n).replace(/ | /g, ' ')
}

/** Parsea "8,11", "1.234,5", "10" → número. */
export function parseImporte(s: string): number | null {
  const limpio = s.trim().replace(/\s|€/g, '')
  if (!limpio) return null
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio
  if (!/^-?\d+(\.\d+)?$/.test(normal)) return null
  return redondear(Number(normal))
}

export function fechaCorta(d: Date): string {
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`
}

export function fechaLarga(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

export function ddmmaaaa(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function enDias(n: number): string {
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  return `en ${n} días`
}

export function frecuencia(p: Pago): string {
  return p.tipo === 'mensual' ? `cada mes · día ${p.dia}` : `cada año · ${MESES[(p.mes ?? 1) - 1]}`
}

/** "Hasta 25/11/2027 · quedan 13 pagos · 130,00 €" */
export function resumenFin(p: Pago, hoy: Date): string | null {
  const fin = finDe(p)
  if (!fin) return null
  if (terminado(p, hoy)) return `Terminó el ${ddmmaaaa(fin)}`
  const n = cobrosRestantes(p, hoy).length
  return `Hasta ${ddmmaaaa(fin)} · quedan ${n} ${n === 1 ? 'pago' : 'pagos'} · ${euros(n * p.importe)}`
}

// ---------- Datos ----------

export const DATOS_INICIALES: Datos = {
  saldo: 0,
  pagos: [
    { id: 'dazn', nombre: 'DAZN', importe: 10, tipo: 'mensual', dia: 25, fin: '2027-11-25' },
    { id: 'cifa', nombre: 'Dominio CIFA', importe: 8.11, tipo: 'anual', dia: 1, mes: 1 },
  ],
}

/** Valida y normaliza datos importados. Lanza Error si no son válidos. */
export function validarDatos(x: unknown): Datos {
  if (!x || typeof x !== 'object') throw new Error('Archivo no válido')
  const o = x as Record<string, unknown>
  if (typeof o.saldo !== 'number' || !isFinite(o.saldo)) throw new Error('Falta el saldo')
  if (!Array.isArray(o.pagos)) throw new Error('Faltan los pagos')
  const pagos: Pago[] = o.pagos.map((raw, i) => {
    const p = raw as Record<string, unknown>
    const tipo = p.tipo === 'anual' ? 'anual' : p.tipo === 'mensual' ? 'mensual' : null
    const dia = Number(p.dia)
    if (typeof p.nombre !== 'string' || typeof p.importe !== 'number' || !tipo || !(dia >= 1 && dia <= 31)) {
      throw new Error(`Pago ${i + 1} no válido`)
    }
    const pago: Pago = {
      id: typeof p.id === 'string' ? p.id : crearId(),
      nombre: p.nombre,
      importe: redondear(p.importe),
      tipo,
      dia: Math.floor(dia),
    }
    if (tipo === 'anual') {
      const mes = Number(p.mes)
      pago.mes = mes >= 1 && mes <= 12 ? Math.floor(mes) : 1
    }
    if (typeof p.fin === 'string' && parseISO(p.fin)) pago.fin = p.fin
    return pago
  })
  return { saldo: redondear(o.saldo), pagos }
}

export function crearId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
