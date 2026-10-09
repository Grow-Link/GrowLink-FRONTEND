import { useEffect, useState } from 'react';
import logo from '../imports/logoGrowLink.png';
import { useNavigation } from '../store/NavigationContext';
import { useTheme } from '../store/ThemeContext';
import LiveIndicator from '../components/LiveIndicator';
import { getUsuariosQuemados, rolDesdeBackend, type UsuarioQuemado } from '../services/usuariosServiceApi';
import type { UserRole } from '../types';

const ROLE_META: Record<UserRole, { label: string; accent: string; ring: string }> = {
  user: { label: 'Usuario', accent: '#0E8A7D', ring: 'hover:border-[#0E8A7D]/50' },
  publisher: { label: 'Publicador', accent: '#12C2A8', ring: 'hover:border-[#12C2A8]/50' },
  admin: { label: 'Administrador', accent: '#4CE07E', ring: 'hover:border-[#4CE07E]/50' },
};

const ROLE_ORDER: UserRole[] = ['user', 'publisher', 'admin'];

export default function UserSelectPage() {
  const { login, sessionExpired } = useNavigation();
  const { isDark, toggle } = useTheme();

  const [usuarios, setUsuarios] = useState<UsuarioQuemado[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loggingInId, setLoggingInId] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoadError(null);
    getUsuariosQuemados()
      .then((data) => {
        if (!ignore) setUsuarios(data);
      })
      .catch((err: unknown) => {
        if (!ignore) setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.');
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  async function handleLogin(usuario: UsuarioQuemado) {
    setLoggingInId(usuario.id);
    setLoginError(null);
    try {
      await login(usuario);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      setLoggingInId(null);
    }
  }

  return (
    <div className="min-h-screen flex relative">
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

      {/* Left panel — brand */}
      <div className="hidden lg:flex w-[40%] bg-[#1F2D2A] flex-col justify-between p-12 relative overflow-hidden">
        <div className="gl-float absolute top-0 right-0 w-80 h-80 rounded-full opacity-25 gl-gradient blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="gl-float absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-[#12C2A8] blur-2xl translate-y-1/3 -translate-x-1/4" style={{ animationDelay: '-3s' }} />
        <div className="gl-float absolute top-1/3 left-1/4 w-40 h-40 rounded-full opacity-10 bg-[#4CE07E] blur-2xl" style={{ animationDelay: '-5s' }} />

        <div className="relative z-10 flex justify-center items-center py-4">
          <img src={logo} alt="GrowLink" className="h-40 w-auto max-w-[340px] object-contain drop-shadow-[0_0_48px_rgba(18,194,168,0.25)]" />
        </div>

        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Plataforma de crecimiento</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <LiveIndicator label="47 personas activas ahora" color="green" />
          </div>
          <h1 className="text-5xl font-display font-bold text-white leading-[1.1] mb-6">
            Tu próximo salto<br />
            <span className="gl-gradient-text">empieza aquí.</span>
          </h1>
          <p className="text-[#98B0A6] text-lg leading-relaxed max-w-sm">
            Roadmaps generados a partir de tus metas, cursos reales con prerequisitos, y trivia competitiva para reforzar lo aprendido.
          </p>
        </div>

        <div className="relative z-10 inline-flex">
          <div className="gl-card-hover relative overflow-hidden border border-white/10 rounded-xl p-4 bg-white/5 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-0.5 gl-gradient" />
            <p className="text-2xl font-mono font-bold text-white">{usuarios ? usuarios.length : '…'}</p>
            <p className="text-xs text-[#98B0A6] mt-1">Usuarios de demostración</p>
          </div>
        </div>
      </div>

      {/* Right panel — seed user picker */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-[#F6F7F2] dark:bg-[#0E1815]">
        <div className="w-full max-w-xl">
          <img src={logo} alt="GrowLink" className="h-12 w-auto max-w-[180px] object-contain mb-8 lg:hidden" />

          <div className="mb-8">
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Acceso de demostración</span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] mt-2">Elige con quién quieres entrar</h2>
            <p className="text-[#6B7A74] dark:text-[#98B0A6] mt-1.5">Sin contraseña — cada perfil representa un rol distinto dentro de GrowLink.</p>
          </div>

          {sessionExpired && !loginError && (
            <div className="mb-5 flex items-center justify-between gap-3 p-3 rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] dark:bg-[#3A2A0D]">
              <p className="text-sm text-[#B45309] dark:text-[#FBBF24]">Tu sesión expiró o ya no es válida. Vuelve a elegir un usuario.</p>
            </div>
          )}

          {loginError && (
            <div className="mb-5 flex items-center justify-between gap-3 p-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
              <p className="text-sm text-[#DC2626] dark:text-[#F87171]">{loginError}</p>
            </div>
          )}

          {loadError ? (
            <div className="p-5 rounded-2xl border border-[#EF4444]/30 bg-[#FEF2F2] dark:bg-[#2A1111]">
              <p className="text-sm text-[#DC2626] dark:text-[#F87171] mb-3">{loadError}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-sm font-semibold text-[#DC2626] dark:text-[#F87171] underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : usuarios === null ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7A74] dark:text-[#98B0A6] py-6">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Cargando usuarios de usuarios-service...
            </div>
          ) : (
            <div className="space-y-6">
              {ROLE_ORDER.map((role) => {
                const meta = ROLE_META[role];
                const users = usuarios.filter((u) => rolDesdeBackend(u.rol) === role);
                if (users.length === 0) return null;
                return (
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.accent }} />
                      <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: meta.accent }}>{meta.label}</p>
                    </div>
                    <div className="space-y-2.5">
                      {users.map((user) => {
                        const initials = user.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2);
                        const loggingIn = loggingInId === user.id;
                        return (
                          <button
                            key={user.id}
                            onClick={() => handleLogin(user)}
                            disabled={loggingInId !== null}
                            className={`gl-card-hover w-full flex items-center gap-4 p-4 rounded-2xl border border-[#E1E6DF] dark:border-[#27403A] bg-white dark:bg-[#15231F] text-left cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${meta.ring}`}
                          >
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-display font-bold shrink-0"
                              style={{ background: `linear-gradient(135deg, ${meta.accent}, #1F2D2A)` }}
                            >
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-bold text-[#1F2D2A] dark:text-[#E6EFE9] truncate">{user.nombre}</p>
                              {user.cargo && <p className="text-xs text-[#6B7A74] dark:text-[#98B0A6] truncate mt-0.5">{user.cargo}</p>}
                            </div>
                            {loggingIn ? (
                              <svg className="w-4 h-4 text-[#6B7A74] dark:text-[#98B0A6] shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-[#6B7A74] dark:text-[#98B0A6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
