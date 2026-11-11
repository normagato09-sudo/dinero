import { describe, expect, it } from 'vitest'
import {
  type Pago,
  cobraEnDia,
  cobroEnMes,
  cobrosRestantes,
  costeAnual,
  DATOS_INICIALES,
  diasEnMes,
  diasHasta,
  enDias,
  euros,
  fechaAjustada,
  frecuencia,
  libreEsteMes,
  parseImporte,
  pendienteEsteMes,
  proximoCobro,
  proximoPago,
  resumenFin,
  semanaActual,
  terminado,
  validarDatos,
} from './calc'

const d = (a: number, m: number, dia: number) => new Date(a, m - 1, dia)
const iso = (x: Date | null) =>
  x ? `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` : null

const mensual = (dia: number, extra: Partial<Pago> = {}): Pago => ({
  id: 'm', nombre: 'M', importe: 10, tipo: 'mensual', dia, ...extra,
})
const anual = (mes: number, dia: number, extra: Partial<Pago> = {}): Pago => ({
  id: 'a', nombre: 'A', importe: 50, tipo: 'anual', dia, mes, ...extra,
})

const [DAZN, CIFA] = DATOS_INICIALES.pagos

describe('fechas básicas', () => {
  it('días en mes, incluidos bisiestos', () => {
    expect(diasEnMes(2026, 1)).toBe(28)
    expect(diasEnMes(2028, 1)).toBe(29)
    expect(diasEnMes(2026, 3)).toBe(30)
    expect(diasEnMes(2026, 11)).toBe(31)
  })

  it('usa el último día si el mes no tiene ese día', () => {
    expect(iso(fechaAjustada(2026, 1, 31))).toBe('2026-02-28')
    expect(iso(fechaAjustada(2028, 1, 30))).toBe('2028-02-29')
    expect(iso(fechaAjustada(2026, 3, 31))).toBe('2026-04-30')
    expect(iso(fechaAjustada(2026, 0, 31))).toBe('2026-01-31')
  })

  it('días hasta una fecha, cruzando cambio de hora', () => {
    expect(diasHasta(d(2026, 11, 11), d(2026, 11, 11))).toBe(0)
    expect(diasHasta(d(2026, 11, 12), d(2026, 11, 11))).toBe(1)
    expect(diasHasta(d(2026, 4, 1), d(2026, 3, 20))).toBe(12)
    expect(diasHasta(d(2026, 11, 1), d(2026, 10, 20))).toBe(12)
  })

  it('texto relativo', () => {
    expect(enDias(0)).toBe('hoy')
    expect(enDias(1)).toBe('mañana')
    expect(enDias(14)).toBe('en 14 días')
  })

  it('semana de lunes a domingo', () => {
    const s = semanaActual(d(2026, 11, 11)) // miércoles
    expect(s.map(iso)).toEqual([
      '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    ])
    expect(iso(semanaActual(d(2026, 11, 15))[0])).toBe('2026-11-09') // domingo
    expect(iso(semanaActual(d(2026, 11, 16))[0])).toBe('2026-11-16') // lunes
    expect(iso(semanaActual(d(2026, 12, 31))[6])).toBe('2027-01-03') // cruza el año
  })
})

describe('cobros', () => {
  it('mensual el 31 se cobra el último día en meses cortos', () => {
    const p = mensual(31)
    expect(iso(cobroEnMes(p, 2026, 1))).toBe('2026-02-28')
    expect(iso(cobroEnMes(p, 2026, 5))).toBe('2026-06-30')
    expect(cobraEnDia(p, d(2026, 2, 28))).toBe(true)
    expect(cobraEnDia(p, d(2026, 3, 30))).toBe(false)
  })

  it('anual solo se cobra en su mes', () => {
    expect(iso(cobroEnMes(CIFA, 2027, 0))).toBe('2027-01-01')
    expect(cobroEnMes(CIFA, 2027, 1)).toBeNull()
    expect(iso(cobroEnMes(anual(2, 29), 2027, 1))).toBe('2027-02-28')
  })

  it('próximo cobro: hoy cuenta como pendiente', () => {
    expect(iso(proximoCobro(mensual(11), d(2026, 11, 11)))).toBe('2026-11-11')
    expect(iso(proximoCobro(mensual(10), d(2026, 11, 11)))).toBe('2026-12-10')
    expect(iso(proximoCobro(mensual(31), d(2027, 1, 31)))).toBe('2027-01-31')
    expect(iso(proximoCobro(mensual(31), d(2027, 2, 1)))).toBe('2027-02-28')
  })

  it('próximo cobro anual cruza el año', () => {
    expect(iso(proximoCobro(CIFA, d(2026, 11, 11)))).toBe('2027-01-01')
    expect(iso(proximoCobro(CIFA, d(2027, 1, 1)))).toBe('2027-01-01')
    expect(iso(proximoCobro(CIFA, d(2027, 1, 2)))).toBe('2028-01-01')
  })

  it('respeta la fecha de fin', () => {
    expect(iso(proximoCobro(DAZN, d(2027, 11, 25)))).toBe('2027-11-25')
    expect(proximoCobro(DAZN, d(2027, 11, 26))).toBeNull()
    expect(terminado(DAZN, d(2027, 11, 25))).toBe(false)
    expect(terminado(DAZN, d(2027, 11, 26))).toBe(true)
    // fin antes del día de cobro de ese mes
    const p = mensual(25, { fin: '2027-03-20' })
    expect(iso(proximoCobro(p, d(2027, 2, 26)))).toBeNull()
    expect(iso(proximoCobro(p, d(2027, 2, 25)))).toBe('2027-02-25')
  })

  it('cuenta los pagos que quedan', () => {
    const r = cobrosRestantes(DAZN, d(2026, 11, 11))
    expect(r).toHaveLength(13)
    expect(iso(r[0])).toBe('2026-11-25')
    expect(iso(r[12])).toBe('2027-11-25')
    expect(cobrosRestantes(DAZN, d(2026, 11, 26))).toHaveLength(12)
    expect(cobrosRestantes(DAZN, d(2028, 1, 1))).toHaveLength(0)
    expect(cobrosRestantes(CIFA, d(2026, 11, 11))).toHaveLength(0)
  })

  it('próximo pago entre varios', () => {
    const r = proximoPago(DATOS_INICIALES.pagos, d(2026, 11, 11))
    expect(r?.pago.nombre).toBe('DAZN')
    expect(iso(r!.fecha)).toBe('2026-11-25')
    const r2 = proximoPago(DATOS_INICIALES.pagos, d(2026, 12, 26))
    expect(r2?.pago.nombre).toBe('Dominio CIFA')
    expect(proximoPago([], d(2026, 1, 1))).toBeNull()
  })
})

describe('cálculos de dinero', () => {
  it('pendiente este mes: solo lo que falta, sin terminados', () => {
    const pagos = [mensual(5), mensual(20, { importe: 15.5 }), anual(11, 30, { importe: 7.25 }), anual(1, 1)]
    expect(pendienteEsteMes(pagos, d(2026, 11, 11))).toBe(22.75)
    expect(pendienteEsteMes(pagos, d(2026, 11, 20))).toBe(22.75) // hoy cuenta
    expect(pendienteEsteMes(pagos, d(2026, 11, 21))).toBe(7.25)
    expect(pendienteEsteMes([mensual(5, { fin: '2026-10-05' })], d(2026, 11, 1))).toBe(0)
  })

  it('libre = saldo − pendiente', () => {
    expect(libreEsteMes(184.5, DATOS_INICIALES.pagos, d(2026, 11, 11))).toBe(174.5)
    expect(libreEsteMes(184.5, DATOS_INICIALES.pagos, d(2026, 11, 26))).toBe(184.5)
    expect(libreEsteMes(5, DATOS_INICIALES.pagos, d(2026, 11, 1))).toBe(-5)
  })

  it('coste real al año', () => {
    expect(costeAnual(DATOS_INICIALES.pagos, d(2026, 11, 11))).toBe(128.11)
    expect(costeAnual(DATOS_INICIALES.pagos, d(2028, 1, 1))).toBe(8.11)
  })
})

describe('formato', () => {
  it('euros en formato español', () => {
    expect(euros(184.5)).toBe('184,50 €')
    expect(euros(8.11)).toBe('8,11 €')
    expect(euros(0)).toBe('0,00 €')
    expect(euros(1234.5)).toBe('1.234,50 €')
    expect(euros(-5)).toBe('-5,00 €')
  })

  it('parsea importes', () => {
    expect(parseImporte('8,11')).toBe(8.11)
    expect(parseImporte('1.234,50')).toBe(1234.5)
    expect(parseImporte('10')).toBe(10)
    expect(parseImporte('10.5')).toBe(10.5)
    expect(parseImporte('12 €')).toBe(12)
    expect(parseImporte('')).toBeNull()
    expect(parseImporte('abc')).toBeNull()
  })

  it('textos de pagos', () => {
    expect(frecuencia(DAZN)).toBe('cada mes · día 25')
    expect(frecuencia(CIFA)).toBe('cada año · enero')
    expect(resumenFin(DAZN, d(2026, 11, 11))).toBe('Hasta 25/11/2027 · quedan 13 pagos · 130,00 €')
    expect(resumenFin(CIFA, d(2026, 11, 11))).toBeNull()
    expect(resumenFin(DAZN, d(2027, 11, 1))).toBe('Hasta 25/11/2027 · quedan 1 pago · 10,00 €')
  })
})

describe('copia de seguridad', () => {
  it('valida datos correctos', () => {
    const r = validarDatos(JSON.parse(JSON.stringify(DATOS_INICIALES)))
    expect(r).toEqual(DATOS_INICIALES)
  })

  it('rechaza datos no válidos', () => {
    expect(() => validarDatos(null)).toThrow()
    expect(() => validarDatos({ saldo: 'x', pagos: [] })).toThrow()
    expect(() => validarDatos({ saldo: 1, pagos: [{ nombre: 'x' }] })).toThrow()
  })
})
