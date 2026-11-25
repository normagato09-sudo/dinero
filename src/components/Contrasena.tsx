import { useState } from 'react'

/** Pantalla para poner la contraseña de Mi Dinero (la de DINERO_CLAVE en Vercel). Se pide una vez por dispositivo. */
export function Contrasena({ onEntrar }: { onEntrar: (c: string) => void }) {
  const [valor, setValor] = useState('')
  return (
    <div className="app">
      <main>
        <section className="pantalla">
          <header className="cabecera"><h1>Mi Dinero</h1></header>
          <form className="tarjeta form" onSubmit={(e) => { e.preventDefault(); if (valor) onEntrar(valor) }}>
            <label>
              <span>Contraseña</span>
              <input type="password" autoFocus autoComplete="current-password" value={valor} onChange={(e) => setValor(e.target.value)} />
            </label>
            <p className="sub">Tus datos están guardados en la nube. Pon tu contraseña para verlos en este dispositivo.</p>
            <button className="btn btn-principal" type="submit" disabled={!valor}>Entrar</button>
          </form>
        </section>
      </main>
    </div>
  )
}
