# Mi Dinero

App web (PWA) para organizar el dinero: saldo, pagos fijos y "¿me lo puedo permitir?".
Vite + React + TypeScript. Gastos **e ingresos** fijos que se suman o restan solos del saldo cada día.

Datos en la nube (Neon) con contraseña, y copia en el navegador. Funciones del servidor en `api/`:
- `api/datos.ts`: leer y guardar (con versión, para no pisar cambios).
- `api/cron.ts`: cada mañana (Vercel Cron) aplica los fijos del día y avisa a Mi Oficina (agentes `dinero-pagos` y `dinero-resumen`).

Variables en Vercel: base de datos Neon conectada (`DATABASE_URL`), `DINERO_CLAVE` (tu contraseña),
`MI_OFICINA_URL` y `MI_OFICINA_CLAVE` (avisos). Sin `DINERO_CLAVE`, la app sigue funcionando solo en el navegador.

```bash
npm install
npm run dev      # desarrollo
npm test         # tests (Vitest)
npm run build    # producción → dist/
```

Iconos: `node scripts/iconos.mjs` regenera los PNG de `public/`.
