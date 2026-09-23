import logo from '../imports/logoGrowLink.png';
import { useNavigation } from '../store/NavigationContext';
import { useTheme } from '../store/ThemeContext';
import LiveIndicator from '../components/LiveIndicator';
import { SEED_USERS } from '../services/mockData';
import type { UserRole } from '../types';

const ROLE_META: Record<UserRole, { label: string; accent: string; ring: string }> = {
  user: { label: 'Usuario', accent: '#1E73E8', ring: 'hover:border-[#1E73E8]/50' },
  publisher: { label: 'Publicador', accent: '#12C2A8', ring: 'hover:border-[#12C2A8]/50' },
  admin: { label: 'Administrador', accent: '#4CE07E', ring: 'hover:border-[#4CE07E]/50' },
};

const ROLE_ORDER: UserRole[] = ['user', 'publisher', 'admin'];

export default function UserSelectPage() {
  const { login } = useNavigation();
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-screen flex relative">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 z-20 w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-[#0F2240] border border-[#DDE4ED] dark:border-[#1C3254] text-[#6B7A99] dark:text-[#8BA5C2] hover:text-[#0B1F3A] dark:hover:text-[#E2EBF6] shadow-sm transition-all cursor-pointer"
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
      <div className="hidden lg:flex w-[40%] bg-[#0B1F3A] flex-col justify-between p-12 relative overflow-hidden">
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
          <p className="text-[#8BA5C2] text-lg leading-relaxed max-w-sm">
            Roadmaps generados a partir de tus metas, cursos reales con prerequisitos, y trivia competitiva para reforzar lo aprendido.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '14,800+', label: 'Usuarios activos', accent: '#1E73E8' },
            { value: '41%', label: 'Roadmaps completados', accent: '#12C2A8' },
            { value: '14', label: 'Cursos en catálogo', accent: '#4CE07E' },
          ].map((stat) => (
            <div key={stat.label} className="gl-card-hover relative overflow-hidden border border-white/10 rounded-xl p-4 bg-white/5 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: stat.accent }} />
              <p className="text-2xl font-display font-bold text-white">{stat.value}</p>
              <p className="text-xs text-[#8BA5C2] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — seed user picker */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-[#F7F9FA] dark:bg-[#081629]">
        <div className="w-full max-w-xl">
          <img src={logo} alt="GrowLink" className="h-12 w-auto max-w-[180px] object-contain mb-8 lg:hidden" />

          <div className="mb-8">
            <span className="text-[#12C2A8] text-xs font-mono font-semibold tracking-widest uppercase">Acceso de demostración</span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] mt-2">Elige con quién quieres entrar</h2>
            <p className="text-[#6B7A99] dark:text-[#8BA5C2] mt-1.5">Sin contraseña — cada perfil representa un rol distinto dentro de GrowLink.</p>
          </div>

          <div className="space-y-6">
            {ROLE_ORDER.map((role) => {
              const meta = ROLE_META[role];
              const users = SEED_USERS.filter((u) => u.role === role);
              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.accent }} />
                    <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: meta.accent }}>{meta.label}</p>
                  </div>
                  <div className="space-y-2.5">
                    {users.map((user) => {
                      const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
                      return (
                        <button
                          key={user.id}
                          onClick={() => login(user.id)}
                          className={`gl-card-hover w-full flex items-center gap-4 p-4 rounded-2xl border border-[#DDE4ED] dark:border-[#1C3254] bg-white dark:bg-[#0F2240] text-left cursor-pointer transition-all ${meta.ring}`}
                        >
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-display font-bold shrink-0"
                            style={{ background: `linear-gradient(135deg, ${meta.accent}, #0B1F3A)` }}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-[#0B1F3A] dark:text-[#E2EBF6] truncate">{user.name}</p>
                            <p className="text-xs text-[#6B7A99] dark:text-[#8BA5C2] truncate mt-0.5">
                              {user.headline}{user.org ? ` · ${user.org}` : ''}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-[#6B7A99] dark:text-[#8BA5C2] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
