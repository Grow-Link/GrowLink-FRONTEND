// El botón de "Iniciar sesión con Microsoft" del modo oidc (ver services/authMode.ts). Reemplaza la lista de
// usuarios de demostración en UserSelectPage; el resto de esa pantalla (la marca, el tema) es la misma.
//
// Los errores que suben desde MSAL ya vienen con un mensaje para mostrar (ver msalAuth.MicrosoftAuthError),
// tanto si falta configuración como si la persona canceló, y el botón queda listo para reintentar.

import { useState } from 'react';
import { useNavigation } from '../../store/NavigationContext';

/** El logo de Microsoft: los cuatro cuadrados. */
function LogoMicrosoft() {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 23 23" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

export default function MicrosoftSignIn() {
  const { loginConMicrosoft } = useNavigation();
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    setEntrando(true);
    setError(null);
    try {
      await loginConMicrosoft();
      // si salió por redirección la página se va; si no, la navegación ya la hizo el contexto
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Microsoft.');
      setEntrando(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-5 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
          <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171]">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={entrar}
        disabled={entrando}
        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] font-semibold text-[#1F2D2A] dark:text-[#E6EFE9] shadow-sm hover:border-[#0E8A7D]/50 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {entrando ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <LogoMicrosoft />
        )}
        {entrando ? 'Abriendo Microsoft…' : 'Iniciar sesión con Microsoft'}
      </button>

      <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] mt-4 leading-relaxed">
        Se abre una ventana de Microsoft para autenticarte. Si tu navegador la bloquea, la app continúa en la
        misma pestaña.
      </p>
    </div>
  );
}
