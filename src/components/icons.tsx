const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const IconInicio = () => (
  <svg {...base}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v11h14V9" /></svg>
)
export const IconPagos = () => (
  <svg {...base}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
)
export const IconPuedo = () => (
  <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1 1-1.1 1.7v.4M12 17h.01" /></svg>
)
export const IconAjustes = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)
export const IconMas = () => (
  <svg {...base}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconX = () => (
  <svg {...base}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const IconEditar = () => (
  <svg {...base} width={18} height={18}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
)
export const IconCheck = () => (
  <svg {...base}><path d="M20 6 9 17l-5-5" /></svg>
)
export const IconAlerta = () => (
  <svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
)
export const IconSubir = () => (
  <svg {...base}><path d="M12 15V3M7 8l5-5 5 5M5 21h14" /></svg>
)
export const IconBajar = () => (
  <svg {...base}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
)
