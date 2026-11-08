// Primer ingreso con Microsoft (modo oidc): GET /api/usuarios/me vino con rolElegido = false, así que antes
// de entrar a la app la persona escoge con qué rol la va a usar. Solo se ofrecen USUARIO y PUBLICADOR —
// ADMIN no se escoge, lo asigna quien administra.
//
// Si el servidor responde 403 (o cualquier otro error) se muestra el mensaje que mandó y el botón vuelve a
// quedar disponible: no se cierra la sesión ni se pierde lo elegido.

import { useState } from 'react';
import logo from '../imports/logoGrowLink.png';
import { useNavigation } from '../store/NavigationContext';
import { useTheme } from '../store/ThemeContext';
import { ROLES_ELEGIBLES, type RolElegible } from '../services/usuariosServiceApi';

const OPCIONES: Record<RolElegible, { titulo: string; descripcion: string; accent: string; icono: string }> = {
  USUARIO: {
    titulo: 'Usuario',
    descripcion: 'Defines una meta, recibes tu roadmap, apruebas exámenes y compites en trivia.',
    accent: '#0E8A7D',
    icono: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12 12 0 0112 20.055a12 12 0 01-6.16-9.475L12 14z',
  },
  PUBLICADOR: {
    titulo: 'Publicador',
    descripcion: 'Publicas cursos con su temario y su examen, y agregas preguntas de trivia de tus áreas.',
    accent: '#12C2A8',
    icono: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.247m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.247',
  },
};

export default function RoleChoicePage() {
  const { currentUser, confirmarRol, logout } = useNavigation();
  const { isDark, toggle } = useTheme();

  const [elegido, setElegido] = useState<RolElegible | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (!elegido || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await confirmarRol(elegido);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el rol. Inténtalo de nuevo.');
      setEnviando(false);
    }
  }

  const primerNombre = currentUser?.name.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center p-5 sm:p-8 bg-[#F6F7F2] dark:bg-[#0E1815] relative">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 z-20 w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-[#15231F] border border-[#E1E6DF] dark:border-[#27403A] text-[#6B7A74] dark:text-[#98B0A6] hover:text-[#1F2D2A] dark:hover:text-[#E6EFE9] shadow-sm transition-all cursor-pointer"
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
        aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      >
        {isDark ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-2xl">
        <img src={logo} alt="GrowLink" className="h-12 w-auto max-w-[180px] object-contain mb-8" />

        <div className="mb-8">
          <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Primer ingreso</span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">
            {primerNombre ? `Hola, ${primerNombre}. ` : ''}¿Cómo vas a usar GrowLink?
          </h1>
          <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1.5">
            Escoge una opción para empezar. Define lo que ves al entrar y lo que puedes hacer.
          </p>
        </div>

        <div role="radiogroup" aria-label="Rol" className="grid sm:grid-cols-2 gap-4 mb-6">
          {ROLES_ELEGIBLES.map((rol) => {
            const meta = OPCIONES[rol];
            const activo = elegido === rol;
            return (
              <button
                key={rol}
                type="button"
                role="radio"
                aria-checked={activo}
                disabled={enviando}
                onClick={() => setElegido(rol)}
                className={`gl-card-hover text-left p-5 rounded-2xl border-2 bg-white dark:bg-[#15231F] cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  activo ? 'shadow-md' : 'border-[#E1E6DF] dark:border-[#27403A]'
                }`}
                style={activo ? { borderColor: meta.accent } : undefined}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
                  style={{ background: `linear-gradient(135deg, ${meta.accent}, #1F2D2A)` }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icono} />
                  </svg>
                </div>
                <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9]">{meta.titulo}</p>
                <p className="text-sm text-[#6B7A74] dark:text-[#98B0A6] mt-1 leading-relaxed">{meta.descripcion}</p>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
            <p role="alert" className="text-sm text-[#DC2626] dark:text-[#F87171]">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={enviar}
            disabled={!elegido || enviando}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gl-gradient text-white font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {enviando ? 'Guardando…' : error ? 'Reintentar' : 'Continuar'}
          </button>
          <button
            type="button"
            onClick={logout}
            disabled={enviando}
            className="text-sm font-medium text-[#6B7A74] dark:text-[#98B0A6] hover:text-[#0E8A7D] dark:hover:text-[#5FD3C2] cursor-pointer transition-colors disabled:opacity-60"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
