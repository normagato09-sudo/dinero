// Genera los iconos PNG de la PWA (sin dependencias). Uso: node scripts/iconos.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const VERDE = [8, 122, 88]
const BLANCO = [255, 255, 255]

// Distancia con signo a un rectángulo redondeado (coordenadas en 0..512)
function sdRect(px, py, x, y, w, h, r) {
  const cx = x + w / 2, cy = y + h / 2
  const qx = Math.abs(px - cx) - (w / 2 - r)
  const qy = Math.abs(py - cy) - (h / 2 - r)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
}

function pintar(size, { maskable }) {
  const s = maskable ? 0.72 : 1 // zona segura de iconos maskable
  const off = (512 - 512 * s) / 2
  const barras = [
    [128, 276, 64, 108, 0.7],
    [224, 212, 64, 172, 0.85],
    [320, 128, 64, 256, 1],
  ].map(([x, y, w, h, a]) => [off + x * s, off + y * s, w * s, h * s, a])
  const px = Buffer.alloc(size * size * 4)
  const SS = 4
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let r = 0, g = 0, b = 0, al = 0
      for (let sj = 0; sj < SS; sj++) for (let si = 0; si < SS; si++) {
        const x = ((i + (si + 0.5) / SS) / size) * 512
        const y = ((j + (sj + 0.5) / SS) / size) * 512
        const dentro = maskable || sdRect(x, y, 0, 0, 512, 512, 112) <= 0
        if (!dentro) continue
        let c = VERDE
        for (const [bx, by, bw, bh, a] of barras) {
          if (sdRect(x, y, bx, by, bw, bh, 20 * s) <= 0) c = c.map((v, k) => v * (1 - a) + BLANCO[k] * a)
        }
        r += c[0]; g += c[1]; b += c[2]; al += 255
      }
      const n = SS * SS, o = (j * size + i) * 4
      const cov = al / n
      px[o] = cov ? (r / n) * 255 / cov : 0
      px[o + 1] = cov ? (g / n) * 255 / cov : 0
      px[o + 2] = cov ? (b / n) * 255 / cov : 0
      px[o + 3] = cov
    }
  }
  return png(size, px)
}

function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const crcT = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (buf) => {
    let c = 0xffffffff
    for (const b of buf) c = crcT[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (tipo, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(tipo), data])
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync('public/icon-192.png', pintar(192, { maskable: false }))
writeFileSync('public/icon-512.png', pintar(512, { maskable: false }))
writeFileSync('public/icon-maskable-512.png', pintar(512, { maskable: true }))
writeFileSync('public/apple-touch-icon.png', pintar(180, { maskable: true }))
console.log('Iconos generados')
